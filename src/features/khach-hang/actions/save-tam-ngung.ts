'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { KHRecord } from '../types';
import { ActionResult, successResponse, errorResponse } from '@/lib/actions';
import { revalidateTag } from 'next/cache';

export interface TamNgungRequest {
  rows: KHRecord[];
}

export async function saveTamNgung(request: TamNgungRequest): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session_token')?.value;
    if (!session) return errorResponse('Unauthorized');
    
    const user = JSON.parse(session);
    const nguoi_dang_ky = user.username || 'N/A';

    const { rows } = request;
    if (!rows || rows.length === 0) return errorResponse('Không có dữ liệu gửi đi');

    const maKHs = rows.map(r => r.Mã_KH);
    
    // 1. Kiểm tra trạng thái hiện tại
    const placeholders = maKHs.map((_, i) => `@ma${i}`).join(',');
    const params: Record<string, string> = {};
    maKHs.forEach((ma, i) => params[`ma${i}`] = ma);

    const checkRes = await query<{ Ma_KH: string; Trang_thai_duyet: string }>(`
      SELECT Ma_KH, Trang_thai_duyet FROM tbl_dangky_tamngung_kh 
      WHERE Ma_KH IN (${placeholders})
    `, params);
    
    const existingRecords = checkRes.recordset;
    const rejectedMaKHs = new Set(existingRecords.filter(r => r.Trang_thai_duyet === 'Từ chối').map(r => r.Ma_KH));
    const ignoredMaKHs = new Set(existingRecords.filter(r => r.Trang_thai_duyet !== 'Từ chối').map(r => r.Ma_KH));

    const newRows = rows.filter(r => !ignoredMaKHs.has(r.Mã_KH) && !rejectedMaKHs.has(r.Mã_KH));
    const resubmitMaKHs = rows.filter(r => rejectedMaKHs.has(r.Mã_KH));

    if (newRows.length === 0 && resubmitMaKHs.length === 0) {
      return errorResponse('Các yêu cầu đã tồn tại hoặc đang chờ duyệt');
    }

    let insertedCount = 0;
    let updatedCount = 0;

    // 2. Insert mới
    for (const r of newRows) {
      await query(`
        INSERT INTO tbl_dangky_tamngung_kh
          (Khu_vuc, Ma_ten_nvbh, Ma_KH, Ten_KH, DC, Thu, Tan_suat, Nguoi_dang_ky, Ngay_dang_ky, Trang_thai_duyet)
        VALUES
          (@khu_vuc, @ma_ten_nvbh, @ma_kh, @ten_kh, @dc, @thu, @tan_suat, @nguoi_dk, DATEADD(hour, 7, GETUTCDATE()), N'Chờ duyệt')
      `, {
        khu_vuc: r.Khu_Vực || '',
        ma_ten_nvbh: r.Mã_Tên_NVBH || '',
        ma_kh: r.Mã_KH || '',
        ten_kh: r.Tên_KH || '',
        dc: r.Địa_Chỉ || '',
        thu: r.Thứ || '',
        tan_suat: r.Tần_Suất || '',
        nguoi_dk: nguoi_dang_ky
      });
      insertedCount++;
    }

    // 3. Update lại những đơn bị từ chối
    if (resubmitMaKHs.length > 0) {
      const updatePlaceholders = resubmitMaKHs.map((_, i) => `@upma${i}`).join(',');
      const updateParams: Record<string, string> = { nguoi_dk: nguoi_dang_ky };
      resubmitMaKHs.forEach((r, i) => updateParams[`upma${i}`] = r.Mã_KH);

      await query(`
        UPDATE tbl_dangky_tamngung_kh
        SET Trang_thai_duyet = N'Chờ duyệt',
            Ngay_dang_ky = DATEADD(hour, 7, GETUTCDATE()),
            Ngay_duyet = NULL,
            Nguoi_duyet = NULL,
            Nguoi_dang_ky = @nguoi_dk
        WHERE Ma_KH IN (${updatePlaceholders})
      `, updateParams);
      updatedCount = resubmitMaKHs.length;
    }

    revalidateTag('kpsds', 'max');

    return successResponse({
      inserted: insertedCount,
      updated: updatedCount
    }, `Đã gửi yêu cầu tạm ngưng cho ${insertedCount + updatedCount} khách hàng`);
  } catch (error: any) {
    console.error('saveTamNgung error:', error);
    return errorResponse(error.message || 'Lỗi hệ thống khi lưu dữ liệu');
  }
}
