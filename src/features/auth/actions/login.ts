'use server';

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { loginSchema, type LoginInput } from '@/types/auth';
import { ActionResult, successResponse, errorResponse } from '@/lib/actions';

export async function login(input: LoginInput & { token: string }): Promise<ActionResult> {
  try {
    // 1. Xác thực Turnstile Token với Cloudflare
    // Bỏ qua trong môi trường dev để tiện test trên localhost
    const isDevBypass = process.env.NODE_ENV === 'development' && input.token === 'dev-bypass';
    
    if (!isDevBypass) {
      const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      const verifyRes = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${input.token}`,
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return errorResponse('Xác thực bảo mật không hợp lệ. Vui lòng thử lại.');
      }
    }

    // 2. Tiếp tục logic đăng nhập bình thường
    const validated = loginSchema.parse({
      username: input.username,
      password: input.password
    });
    
    // Kiểm tra thông tin user và trạng thái khóa
    const result = await query<any>(
      'SELECT *, DATEADD(HOUR, 7, GETUTCDATE()) as CurrentTime FROM UserInfo WHERE ID = @id',
      { id: validated.username }
    );
    
    const user = result.recordset[0];
    
    if (!user) {
      return errorResponse('Tài khoản không tồn tại');
    }

    // Kiểm tra xem có đang bị khóa không
    if (user.LockoutUntil && new Date(user.LockoutUntil) > new Date(user.CurrentTime)) {
      const waitTime = Math.ceil((new Date(user.LockoutUntil).getTime() - new Date(user.CurrentTime).getTime()) / 1000);
      return errorResponse(`Tài khoản đang bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${waitTime} giây.`);
    }

    const passwordMatch = await bcrypt.compare(validated.password, user.pass_hash);
    
    if (!passwordMatch) {
      // Tính toán thời gian khóa tăng dần: 3 lần sai = 30s, 5 lần = 5p, 10 lần = 15p
      let lockSeconds = 0;
      const newFailedAttempts = (user.FailedAttempts || 0) + 1;
      
      if (newFailedAttempts >= 10) lockSeconds = 900; // 15 phút
      else if (newFailedAttempts >= 5) lockSeconds = 300; // 5 phút
      else if (newFailedAttempts >= 3) lockSeconds = 30;  // 30 giây

      await query(
        `UPDATE UserInfo SET 
          FailedAttempts = @failed, 
          LockoutUntil = DATEADD(SECOND, @lockSec, DATEADD(HOUR, 7, GETUTCDATE())) 
         WHERE ID = @id`,
        { id: validated.username, failed: newFailedAttempts, lockSec: lockSeconds }
      );

      return errorResponse(lockSeconds > 0 
        ? `Mật khẩu không chính xác. Bạn đã bị khóa tạm thời ${lockSeconds} giây.` 
        : `Mật khẩu không chính xác (Lần ${newFailedAttempts})`);
    }

    // Đăng nhập thành công: Cập nhật nhật ký và reset lỗi
    await query(
      `UPDATE UserInfo SET 
        LastLogin = DATEADD(HOUR, 7, GETUTCDATE()), 
        LoginCount = ISNULL(LoginCount, 0) + 1,
        FailedAttempts = 0,
        LockoutUntil = NULL
       WHERE ID = @id`,
      { id: validated.username }
    );

    // Lấy danh sách quyền từ bảng AppPermissions
    // Lấy cả quyền theo Nhóm (Role) và quyền riêng theo Cá nhân (User)
    const permsResult = await query<any>(
      `SELECT PermissionKey, IsAllowed, TargetType 
       FROM AppPermissions 
       WHERE (TargetType = 'ROLE' AND TargetValue = @role)
          OR (TargetType = 'USER' AND TargetValue = @userId)`,
      { role: user.Quyen_QL || '', userId: user.ID }
    );

    // Logic trộn quyền: Quyền USER ghi đè quyền ROLE cho cùng 1 PermissionKey
    const permissionMap = new Map<string, boolean>();
    permsResult.recordset.forEach((p: any) => {
      // Nếu là quyền của USER hoặc Key này chưa có trong Map thì mới set
      // (Vì truy vấn có thể trả về cả 2 dòng cho cùng 1 key, ta ưu tiên USER)
      if (p.TargetType === 'USER' || !permissionMap.has(p.PermissionKey)) {
        permissionMap.set(p.PermissionKey, p.IsAllowed);
      }
    });

    // Chuyển Map thành mảng các Key được phép (IsAllowed = 1)
    let finalPermissions = Array.from(permissionMap.entries())
      .filter(([_, allowed]) => allowed)
      .map(([key]) => key);

    // Đặc cách: Nếu là ADMIN thì luôn có toàn quyền '*'
    if (user.Quyen_QL === 'ADMIN') {
      finalPermissions = ['*'];
    }

    // Thiết lập session
    const sessionData = {
      id: user.ID,
      username: user.ID,
      quyenQL: user.Quyen_QL || '',
      quyen: user.Quyen || '',
      permissions: finalPermissions
    };

    const { encrypt } = await import('@/lib/auth-server');
    const sessionToken = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: false, // Cho phép chạy cả trên HTTP (không SSL)
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 ngày
      path: '/',
    });

    return successResponse(null, 'Đăng nhập thành công');
  } catch (error: any) {
    console.error('Login error:', error);
    // Trả về thông báo chi tiết hơn để chẩn đoán khi deploy
    if (error.code === 'ELOGIN' || error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
      return errorResponse('Không thể kết nối đến máy chủ cơ sở dữ liệu. Vui lòng kiểm tra địa chỉ Server và tường lửa.');
    }
    return errorResponse('Đã có lỗi xảy ra trong quá trình đăng nhập: ' + (error.message || 'Unknown error'));
  }
}
