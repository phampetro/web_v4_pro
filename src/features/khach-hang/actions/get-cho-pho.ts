'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { getNgayUpdate } from '@/features/dashboard/actions/dashboard';

export interface ChoPhoItem {
  MA_KH: string;
  TRENDUONG_TRONGCHO: string;
}

export interface ChoPhoResponse {
  data: ChoPhoItem[];
  ngayUpdate: string | null;
}

function parseQuyenDL(raw: string): string[] {
  if (!raw) return [];
  return raw.split('-').map(s => s.trim()).filter(Boolean);
}

export async function getChoPho(checkOnly = false): Promise<ChoPhoResponse | { error: string }> {
  try {
    const { getAuthSession } = await import('@/lib/auth-server');
    const user = await getAuthSession();
    if (!user) return { error: 'Unauthorized' };
    
    const areas = parseQuyenDL(user.quyenQL || '');
    
    if (areas.length === 0) return { error: 'Không có quyền dữ liệu' };

    // 1. Lấy ngày cập nhật (sử dụng cache)
    const resNgay = await getNgayUpdate();
    const serverNgayUpdate = resNgay.success ? resNgay.ngayUpdate : null;

    if (checkOnly) {
      return { data: [], ngayUpdate: serverNgayUpdate };
    }

    // 2. Lấy dữ liệu Chợ Phố dựa trên khu vực của user
    const params: Record<string, string> = {};
    const placeholders = areas.map((area, i) => {
      const key = `area${i}`;
      params[key] = area;
      return `@${key}`;
    });

    const queryString = `
      SELECT MA_KH, TRENDUONG_TRONGCHO
      FROM (
        SELECT MA_KH, TRENDUONG_TRONGCHO,
               ROW_NUMBER() OVER (PARTITION BY MA_KH ORDER BY (SELECT NULL)) as rn
        FROM tbl_tuyen WITH (NOLOCK)
        WHERE TEN_KHUVUC IN (${placeholders.join(',')})
      ) t
      WHERE rn = 1
    `;

    const result = await query<ChoPhoItem>(queryString, params);

    return {
      data: result.recordset,
      ngayUpdate: serverNgayUpdate
    };
  } catch (error) {
    console.error('getChoPho error:', error);
    return { error: 'Lỗi truy vấn dữ liệu Chợ - Phố' };
  }
}
