'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export interface ChoPhoRequest {
  maKH: string;
  tenKH: string;
  khuVuc: string;
  nvbh: string;
  diaChi: string;
  thu: string;
  oldVal: string;
  newVal: string;
}

export async function saveChoPho(requests: ChoPhoRequest[]): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { getAuthSession } = await import('@/lib/auth-server');
    const user = await getAuthSession();
    if (!user) return { success: false, error: 'Unauthorized' };
    const username = user.username || '';

    if (!requests || requests.length === 0) {
      return { success: true, count: 0 };
    }

    for (const req of requests) {
      // 1. Kiểm tra yêu cầu đang chờ duyệt
      const checkRes = await query<{ ID: number }>(
        `SELECT ID FROM tbl_dangky_chopho WHERE Ma_KH = @maKH AND Trang_thai_duyet = N'Chờ duyệt'`,
        { maKH: req.maKH }
      );

      const existingId = checkRes.recordset[0]?.ID;

      const params = {
        maKH: req.maKH,
        tenKH: req.tenKH,
        oldVal: req.oldVal,
        newVal: req.newVal,
        khuVuc: req.khuVuc,
        nvbh: req.nvbh,
        diaChi: req.diaChi,
        thu: req.thu,
        user: username
      };

      if (existingId) {
        // UPDATE
        await query(
          `UPDATE tbl_dangky_chopho 
           SET Gia_tri_moi = @newVal, 
               Ngay_dang_ky = DATEADD(hour, 7, GETUTCDATE()), 
               Nguoi_dang_ky = @user,
               Ghi_chu = NULL
           WHERE ID = @id`,
          { ...params, id: existingId.toString() }
        );
      } else {
        // INSERT
        await query(
          `INSERT INTO tbl_dangky_chopho (
             Ma_KH, Ten_KH, Gia_tri_cu, Gia_tri_moi, Khu_vuc, NVBH, Dia_chi, Thu,
             Nguoi_dang_ky, Ngay_dang_ky, Trang_thai_duyet
           )
           VALUES (
             @maKH, @tenKH, @oldVal, @newVal, @khuVuc, @nvbh, @diaChi, @thu,
             @user, DATEADD(hour, 7, GETUTCDATE()), N'Chờ duyệt'
           )`,
          params
        );
      }
    }

    return { success: true, count: requests.length };
  } catch (error) {
    console.error('saveChoPho error:', error);
    return { success: false, error: 'Lỗi khi lưu dữ liệu đăng ký' };
  }
}
