'use server';

import { query } from '@/lib/db';

export async function getNgayUpdate() {
  try {
    const result = await query<any>(
      'SELECT TOP(1) [Ngay_Update] FROM Web_NgayUpdate'
    );
    
    const ngayUpdate = result.recordset[0]?.Ngay_Update || null;
    return { success: true, ngayUpdate };
  } catch (error) {
    console.error('Error fetching Ngay_Update:', error);
    return { success: false, error: 'Không thể lấy ngày cập nhật' };
  }
}
