'use server';

import { query } from '@/lib/db';

export interface ChoPhoStatus {
  Ma_KH: string;
  Trang_thai_duyet: string;
  Gia_tri_moi: string;
}

export async function getChoPhoStatuses(): Promise<ChoPhoStatus[] | { error: string }> {
  try {
    const result = await query<ChoPhoStatus>(`
      WITH LatestStatus AS (
        SELECT Ma_KH, Trang_thai_duyet, Gia_tri_moi,
               ROW_NUMBER() OVER (PARTITION BY Ma_KH ORDER BY Ngay_dang_ky DESC, ID DESC) as rn
        FROM tbl_dangky_chopho
      )
      SELECT Ma_KH, Trang_thai_duyet, Gia_tri_moi
      FROM LatestStatus
      WHERE rn = 1
    `);
    
    return result.recordset;
  } catch (error) {
    console.error('getChoPhoStatuses error:', error);
    return { error: 'Lỗi tải trạng thái Chợ - Phố' };
  }
}
