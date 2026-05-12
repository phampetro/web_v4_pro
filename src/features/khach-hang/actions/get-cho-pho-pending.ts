'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export interface PendingChoPhoItem {
  ID: number;
  Ma_KH: string;
  Ten_KH: string;
  Khu_vuc: string;
  NVBH: string;
  Dia_chi: string;
  Thu: string;
  Gia_tri_cu: string;
  Gia_tri_moi: string;
  Trang_thai_duyet: string;
  Nguoi_dang_ky: string;
  Ngay_dang_ky: string;
  Nguoi_duyet: string | null;
  Ngay_duyet: string | null;
  Ghi_chu: string | null;
}

function parseQuyenDL(raw: string): string[] {
  if (!raw) return [];
  return raw.split('-').map(s => s.trim()).filter(Boolean);
}

export async function getChoPhoPending(since?: string | null): Promise<PendingChoPhoItem[] | { error: string }> {
  try {
    const { getAuthSession } = await import('@/lib/auth-server');
    const user = await getAuthSession();
    if (!user) return { error: 'Unauthorized' };
    
    const areas = parseQuyenDL(user.quyenQL || '');
    
    if (areas.length === 0) return { error: 'Không có quyền dữ liệu' };

    const params: Record<string, string> = {};
    const placeholders = areas.map((area, i) => {
      const p = `area${i}`;
      params[p] = area;
      return `@${p}`;
    });

    let queryString = `
      SELECT *, 
             FORMAT(Ngay_dang_ky, 'dd/MM/yyyy HH:mm:ss') as Ngay_dang_ky_str,
             FORMAT(Ngay_duyet, 'dd/MM/yyyy HH:mm:ss') as Ngay_duyet_str
      FROM tbl_dangky_chopho 
      WHERE Khu_vuc IN (${placeholders.join(',')})
        AND (Trang_thai_duyet = N'Chờ duyệt'
    `;

    if (since) {
      params.since = since;
      queryString += ` OR (Trang_thai_duyet != N'Chờ duyệt' AND Ngay_duyet > @since))`;
    } else {
      queryString += ` OR (Trang_thai_duyet != N'Chờ duyệt' AND CAST(Ngay_duyet AS DATE) = CAST(DATEADD(hour, 7, GETUTCDATE()) AS DATE)))`;
    }

    queryString += ` ORDER BY Ngay_dang_ky DESC`;

    const result = await query<PendingChoPhoItem & { Ngay_dang_ky_str: string, Ngay_duyet_str: string }>(queryString, params);
    
    return result.recordset.map(item => ({
      ...item,
      Ngay_dang_ky: item.Ngay_dang_ky_str,
      Ngay_duyet: item.Ngay_duyet_str
    }));
  } catch (error) {
    console.error('getChoPhoPending error:', error);
    return { error: 'Lỗi truy vấn dữ liệu chờ duyệt' };
  }
}
