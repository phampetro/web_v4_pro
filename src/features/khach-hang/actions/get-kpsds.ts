'use server';

import { query } from '@/lib/db';
import { KHRecord, KPSDSResponse } from '../types';
import { cookies } from 'next/headers';
import { getNgayUpdate } from '@/features/dashboard/actions/dashboard';

function parseQuyenDL(raw: string): string[] {
  if (!raw) return [];
  return raw.split('-').map(s => s.trim()).filter(Boolean);
}

// Query trực tiếp từ DB (không dùng unstable_cache vì dữ liệu > 2MB)
async function fetchKPSDSFromDB(areas: string[]): Promise<KHRecord[]> {
  const params: Record<string, string> = {};
  const placeholders = areas.map((area, i) => {
    const key = `area${i}`;
    params[key] = area;
    return `@${key}`;
  });

  const queryString = `
    SELECT 
      [Khu_vực] AS [Khu_Vực], [Mã_Tên_NVBH], [Mã_KH], [Tên_KH], [Địa_Chỉ], [Tần_Suất], [Thứ], [Ngày_ĐH_Cuối], [Trưng_Bày]
    FROM ReportVBA_KH_KDS_WEB 
    WHERE [Khu_vực] IN (${placeholders.join(',')}) 
    ORDER BY [Khu_vực], [Mã_Tên_NVBH], [Mã_KH]
  `;

  const result = await query<KHRecord>(queryString, params);
  return result.recordset;
}

export async function getKPSDS(checkOnly = false): Promise<KPSDSResponse | { error: string }> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session_token')?.value;
    if (!session) return { error: 'Unauthorized' };
    
    const user = JSON.parse(session);
    const quyenQL = user.quyenQL || '';
    
    const areas = parseQuyenDL(quyenQL);
    if (areas.length === 0) {
      return { error: 'Không có quyền dữ liệu' };
    }

    // Lấy ngày cập nhật
    const resNgay = await getNgayUpdate();
    const serverNgayUpdate = resNgay.success ? resNgay.ngayUpdate : null;

    if (checkOnly) {
      return { data: [], ngayUpdate: serverNgayUpdate };
    }

    // Query trực tiếp (trung bình ~500ms, dữ liệu quá lớn cho cache)
    const data = await fetchKPSDSFromDB(areas);

    return { 
      data, 
      ngayUpdate: serverNgayUpdate 
    };
  } catch (error) {
    console.error('getKPSDS error:', error);
    return { error: 'Lỗi truy vấn dữ liệu từ máy chủ' };
  }
}
