'use server';

import { query } from '@/lib/db';
import { unstable_cache } from 'next/cache';

export interface PendingTamNgung {
  Ma_KH: string;
  Trang_thai_duyet: string;
  Ngay_duyet: string | null;
}

async function fetchTamNgungStatusesFromDB(): Promise<PendingTamNgung[]> {
  const result = await query<PendingTamNgung & { Ngay_duyet_str: string }>(`
    WITH LatestStatus AS (
      SELECT Ma_KH, Trang_thai_duyet, 
             FORMAT(Ngay_duyet, 'dd/MM/yyyy HH:mm:ss') as Ngay_duyet_str,
             ROW_NUMBER() OVER (PARTITION BY Ma_KH ORDER BY Ngay_dang_ky DESC, ID DESC) as rn
      FROM tbl_dangky_tamngung_kh
    )
    SELECT Ma_KH, Trang_thai_duyet, Ngay_duyet_str as Ngay_duyet
    FROM LatestStatus
    WHERE rn = 1
  `);
  return result.recordset;
}

const getCachedTamNgungStatuses = unstable_cache(
  async () => fetchTamNgungStatusesFromDB(),
  ['tam-ngung-statuses'],
  { revalidate: 60, tags: ['kpsds'] }
);

export async function getTamNgungStatuses(): Promise<PendingTamNgung[] | { error: string }> {
  try {
    const data = await getCachedTamNgungStatuses();
    return data;
  } catch (error) {
    console.error('getTamNgungStatuses error:', error);
    return { error: 'Lỗi tải trạng thái tạm ngưng' };
  }
}
