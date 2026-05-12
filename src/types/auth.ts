import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tài khoản'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface UserSession {
  id: string;
  username: string;
  quyenDL?: string;
  tenNhanVien?: string;
  expires: string;
}
