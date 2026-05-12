'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export interface ApproveChoPhoParams {
  ids: number[];
  status: 'Đã duyệt' | 'Từ chối';
  note?: string;
}

export async function approveChoPho({ ids, status, note }: ApproveChoPhoParams): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) return { success: false, error: 'Unauthorized' };

    const user = JSON.parse(sessionToken);
    const username = user.username || 'System';

    if (!ids || ids.length === 0) return { success: false, error: 'No IDs provided' };

    // Lấy thông tin các dòng cần duyệt
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const queryParams: Record<string, any> = { status, user: username, note: note || null };
    ids.forEach((id, i) => { queryParams[`id${i}`] = id; });

    const recordsRes = await query<{ Ma_KH: string, Gia_tri_moi: string }>(
      `SELECT Ma_KH, Gia_tri_moi FROM tbl_dangky_chopho WHERE ID IN (${placeholders})`,
      queryParams
    );

    // 1. Cập nhật bảng đăng ký
    await query(`
      UPDATE tbl_dangky_chopho
      SET Trang_thai_duyet = @status,
          Ngay_duyet = DATEADD(hour, 7, GETUTCDATE()),
          Nguoi_duyet = @user,
          Ghi_chu = @note
      WHERE ID IN (${placeholders})
    `, queryParams);

    // 2. Nếu là Duyệt, cập nhật bảng tuyến chính (tbl_tuyen)
    if (status === 'Đã duyệt') {
      for (const record of recordsRes.recordset) {
        await query(
          `UPDATE tbl_tuyen 
           SET TRENDUONG_TRONGCHO = @val 
           WHERE MA_KH = @maKH`,
          { val: record.Gia_tri_moi, maKH: record.Ma_KH }
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error('approveChoPho error:', error);
    return { success: false, error: 'Lỗi khi xử lý duyệt Chợ - Phố' };
  }
}
