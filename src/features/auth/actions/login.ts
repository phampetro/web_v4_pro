'use server';

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { loginSchema, type LoginInput } from '@/types/auth';
import { ActionResult, successResponse, errorResponse } from '@/lib/actions';

export async function login(input: LoginInput): Promise<ActionResult> {
  try {
    const validated = loginSchema.parse(input);
    
    const result = await query<any>(
      'SELECT * FROM UserInfo WHERE ID = @id',
      { id: validated.username }
    );
    
    const user = result.recordset[0];
    
    if (!user) {
      return errorResponse('Tài khoản không tồn tại');
    }

    const passwordMatch = await bcrypt.compare(validated.password, user.pass_hash);
    
    if (!passwordMatch) {
      return errorResponse('Mật khẩu không chính xác');
    }

    // Thiết lập session
    const sessionData = {
      id: user.ID,
      username: user.ID,
      quyenQL: user.Quyen_QL || '',
      quyen: user.Quyen || '',
    };

    const cookieStore = await cookies();
    cookieStore.set('session_token', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 ngày
      path: '/',
    });

    return successResponse(null, 'Đăng nhập thành công');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Đã có lỗi xảy ra trong quá trình đăng nhập');
  }
}
