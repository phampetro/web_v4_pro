'use server';

import { query } from '@/lib/db';

import { cookies } from 'next/headers';

export interface PendingTamNgung {
  ID: number;
  Ma_KH: string;
  Khu_vuc: string;
  Trang_thai_duyet: string;
}

function parseQuyenDL(raw: string): string[] {
  if (!raw) return [];
  return raw.split('-').map(s => s.trim()).filter(Boolean);
}

export async function getTamNgungPending(): Promise<PendingTamNgung[] | { error: string }> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) return { error: 'Unauthorized' };

    const user = JSON.parse(sessionToken);
    const areas = parseQuyenDL(user.quyenQL || '');
    
    if (areas.length === 0) return { error: 'Không có quyền dữ liệu' };

    const params: Record<string, string> = {};
    const placeholders = areas.map((area, i) => {
      const p = `area${i}`;
      params[p] = area;
      return `@${p}`;
    });

    // Chỉ lấy các đơn đang chờ duyệt hoặc vừa được duyệt/từ chối trong ngày hôm nay (để hiển thị tag)
    // Thực tế thường chỉ cần lấy 'Chờ duyệt'
    const result = await query<PendingTamNgung>(`
      SELECT ID, Ma_KH, Khu_vuc, Trang_thai_duyet 
      FROM tbl_dangky_tamngung_kh 
      WHERE Trang_thai_duyet = N'Chờ duyệt'
        AND Khu_vuc IN (${placeholders.join(',')})
    `, params);
    
    return result.recordset;
  } catch (error) {
    console.error('getTamNgungPending error:', error);
    return { error: 'Lỗi tải trạng thái tạm ngưng' };
  }
}
