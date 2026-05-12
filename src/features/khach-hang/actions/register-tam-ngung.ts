'use server';

import { query, getPool } from '@/lib/db';
import sql from 'mssql';

interface RegisterInput {
  rows: any[];
  nguoi_dang_ky: string;
}

export async function registerTamNgung({ rows, nguoi_dang_ky }: RegisterInput) {
  try {
    const maKHs = rows.map((r: any) => r.Ma_KH).filter(Boolean);
    if (maKHs.length === 0) return { error: 'Không có khách hàng nào được chọn' };

    // 1. Kiểm tra tồn tại
    const params: Record<string, string> = {};
    const placeholders = maKHs.map((ma: string, i: number) => {
      const p = `ma${i}`;
      params[p] = ma;
      return `@${p}`;
    });

    const checkRes = await query<{ Ma_KH: string; Trang_thai_duyet: string }>(`
      SELECT Ma_KH, Trang_thai_duyet FROM tbl_dangky_tamngung_kh 
      WHERE Ma_KH IN (${placeholders.join(',')})
    `, params);
    
    const existingRecords = checkRes.recordset;
    const rejectedMaKHs = new Set(existingRecords.filter(r => r.Trang_thai_duyet === 'Từ chối').map(r => r.Ma_KH));
    const ignoredMaKHs = new Set(existingRecords.filter(r => r.Trang_thai_duyet !== 'Từ chối').map(r => r.Ma_KH));
    
    const newRows = rows.filter((r: any) => !ignoredMaKHs.has(r.Ma_KH) && !rejectedMaKHs.has(r.Ma_KH));
    const resubmitMaKHs = existingRecords.filter(r => r.Trang_thai_duyet === 'Từ chối').map(r => r.Ma_KH);

    const pool = await getPool();

    // 2. Insert mới
    for (const r of newRows) {
      await pool.request()
        .input('khu_vuc', sql.NVarChar(100), r.Khu_vuc || '')
        .input('ma_ten_nvbh', sql.NVarChar(200), r.Ma_ten_nvbh || '')
        .input('ma_kh', sql.NVarChar(50), r.Ma_KH || '')
        .input('ten_kh', sql.NVarChar(200), r.Ten_KH || '')
        .input('dc', sql.NVarChar(500), r.DC || '')
        .input('thu', sql.NVarChar(20), r.Thu || '')
        .input('tan_suat', sql.NVarChar(50), r.Tan_suat || '')
        .input('nguoi_dk', sql.NVarChar(100), nguoi_dang_ky || '')
        .query(`
          INSERT INTO tbl_dangky_tamngung_kh
            (Khu_vuc, Ma_ten_nvbh, Ma_KH, Ten_KH, DC, Thu, Tan_suat, Nguoi_dang_ky, Ngay_dang_ky)
          VALUES
            (@khu_vuc, @ma_ten_nvbh, @ma_kh, @ten_kh, @dc, @thu, @tan_suat, @nguoi_dk, DATEADD(hour, 7, GETUTCDATE()))
        `);
    }

    // 3. Gửi lại
    if (resubmitMaKHs.length > 0) {
      const updateRequest = pool.request();
      updateRequest.input('nguoi_dk', sql.NVarChar(100), nguoi_dang_ky || '');
      const updatePlaceholders = resubmitMaKHs.map((ma, i) => {
        const p = `upd_ma${i}`;
        updateRequest.input(p, sql.NVarChar(50), ma);
        return `@${p}`;
      });
      
      await updateRequest.query(`
        UPDATE tbl_dangky_tamngung_kh
        SET Trang_thai_duyet = N'Chờ duyệt',
            Ngay_dang_ky = DATEADD(hour, 7, GETUTCDATE()),
            Ngay_duyet = NULL,
            Nguoi_dang_ky = @nguoi_dk
        WHERE Ma_KH IN (${updatePlaceholders.join(',')})
      `);
    }

    return { 
      success: true, 
      inserted: newRows.length,
      updated: resubmitMaKHs.length,
      ignored: existingRecords.filter(r => r.Trang_thai_duyet !== 'Từ chối').length
    };
  } catch (error) {
    console.error('registerTamNgung error:', error);
    return { error: 'Lỗi khi lưu đăng ký Tạm ngưng' };
  }
}
