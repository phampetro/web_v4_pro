'use server';

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function changePassword(values: any) {
  try {
    const { oldPassword, newPassword, username } = values;

    // 1. Lấy thông tin user hiện tại
    const result = await query<any>(
      'SELECT * FROM UserInfo WHERE ID = @id',
      { id: username }
    );
    
    const user = result.recordset[0];
    if (!user) {
      return { success: false, error: 'Người dùng không tồn tại' };
    }

    // 2. Kiểm tra mật khẩu cũ
    const passwordMatch = await bcrypt.compare(oldPassword, user.pass_hash);
    if (!passwordMatch) {
      return { success: false, error: 'Mật khẩu cũ không chính xác' };
    }

    // 3. Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // 4. Cập nhật vào DB
    await query(
      'UPDATE UserInfo SET pass_hash = @hash WHERE ID = @id',
      { hash: newHash, id: username }
    );

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi đổi mật khẩu' };
  }
}
