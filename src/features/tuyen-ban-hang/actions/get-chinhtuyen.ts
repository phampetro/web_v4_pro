'use server';

import { query } from '@/lib/db';
import { ChinhtuyenRecord, ChinhtuyenResponse } from '../types';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';

function parseQuyenDL(raw: string): string[] {
  if (!raw) return [];
  return raw.split('-').map(s => s.trim()).filter(Boolean);
}

async function fetchChinhtuyenFromDB(areas: string[]): Promise<ChinhtuyenRecord[]> {
  const params: Record<string, string> = {};
  const placeholders = areas.map((area, i) => {
    const p = `area${i}`;
    params[p] = area;
    return `@${p}`;
  });

  const result = await query<ChinhtuyenRecord>(`
    SELECT 
      ID, Khu_vuc, Ma_KH, Ten_KH, DC, 
      Ma_ten_nvbh_CU, Thu_CU, Tan_suat_CU, 
      Ma_ten_nvbh_MOI, Thu_MOI, Tan_suat_MOI, 
      Nguoi_dang_ky, Ngay_dang_ky, Trang_thai_duyet
    FROM tbl_dangky_chinhtuyen
    WHERE Khu_vuc IN (${placeholders.join(',')})
    ORDER BY Ngay_dang_ky DESC
  `, params);

  return result.recordset;
}

const getCachedChinhtuyen = unstable_cache(
  async (areas: string[]) => fetchChinhtuyenFromDB(areas),
  ['chinhtuyen-list'],
  { revalidate: 60, tags: ['chinhtuyen'] } // Cache ngắn hơn vì dữ liệu này thay đổi khi có người đăng ký mới
);

export async function getChinhtuyen(): Promise<ChinhtuyenResponse | { error: string }> {
  try {
    const { getAuthSession } = await import('@/lib/auth-server');
    const user = await getAuthSession();
    if (!user) return { error: 'Unauthorized' };
    
    const quyenQL = user.quyenQL || '';

    const areas = parseQuyenDL(quyenQL);
    if (areas.length === 0) return { error: 'Forbidden' };

    const data = await getCachedChinhtuyen(areas);

    return { data };
  } catch (error) {
    console.error('getChinhtuyen error:', error);
    return { error: 'Lỗi truy vấn dữ liệu điều chỉnh tuyến' };
  }
}
