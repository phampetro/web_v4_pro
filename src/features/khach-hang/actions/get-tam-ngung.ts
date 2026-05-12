'use server';

import { query } from '@/lib/db';
import { TamNgungRecord, TamNgungResponse } from '../types';
import { cookies } from 'next/headers';

function parseQuyenDL(raw: string): string[] {
  if (!raw) return [];
  return raw.split('-').map(s => s.trim()).filter(Boolean);
}

export async function getTamNgung(checkOnly = false): Promise<TamNgungResponse | { error: string }> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session_token')?.value;
    if (!session) return { error: 'Unauthorized' };
    
    const user = JSON.parse(session);
    const quyenQL = user.quyenQL || '';

    const areas = parseQuyenDL(quyenQL);
    if (areas.length === 0) return { error: 'Forbidden' };

    // Lấy ngày cập nhật
    const resNgay = await query<{ lastUpdate: string }>(`
      SELECT TOP(1) Ngay_dang_ky as lastUpdate 
      FROM tbl_dangky_tamngung_kh 
      ORDER BY Ngay_dang_ky DESC
    `);
    const serverNgayUpdate = resNgay.recordset[0]?.lastUpdate ? new Date(resNgay.recordset[0].lastUpdate).toISOString() : null;

    if (checkOnly) {
      return { data: [], ngayUpdate: serverNgayUpdate };
    }

    const params: Record<string, string> = {};
    const placeholders = areas.map((area, i) => {
      const p = `area${i}`;
      params[p] = area;
      return `@${p}`;
    });

    const result = await query<TamNgungRecord>(`
      SELECT *, 
             FORMAT(Ngay_dang_ky, 'dd/MM/yyyy HH:mm:ss') as Ngay_dang_ky_str,
             FORMAT(Ngay_duyet, 'dd/MM/yyyy HH:mm:ss') as Ngay_duyet_str
      FROM tbl_dangky_tamngung_kh
      WHERE Khu_vuc IN (${placeholders.join(',')})
      ORDER BY Ngay_dang_ky DESC
    `, params);

    // Gán lại giá trị chuỗi đã định dạng
    const finalData = result.recordset.map(r => ({
      ...r,
      Ngay_dang_ky: (r as any).Ngay_dang_ky_str,
      Ngay_duyet: (r as any).Ngay_duyet_str
    }));

    return { data: finalData, ngayUpdate: serverNgayUpdate };
  } catch (error) {
    console.error('getTamNgung error:', error);
    return { error: 'Lỗi truy vấn dữ liệu Tạm ngưng' };
  }
}
