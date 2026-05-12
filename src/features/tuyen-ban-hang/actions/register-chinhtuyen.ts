'use server';

import { query, getPool } from '@/lib/db';
import sql from 'mssql';
import { z } from 'zod';
import { ActionResult, successResponse, errorResponse } from '@/lib/actions';
import { revalidateTag } from 'next/cache';

const registerSchema = z.object({
  rows: z.array(z.object({
    Khu_vuc: z.string(),
    Ma_KH: z.string(),
    Ten_KH: z.string(),
    DC: z.string(),
    Ma_ten_nvbh_CU: z.string(),
    Thu_CU: z.string(),
    Tan_suat_CU: z.string(),
    Ma_ten_nvbh_MOI: z.string(),
    Thu_MOI: z.string(),
    Tan_suat_MOI: z.string(),
  })),
  nguoi_dang_ky: z.string().min(1, 'Người đăng ký không được để trống'),
});

type RegisterInput = z.infer<typeof registerSchema>;

export async function registerChinhtuyen(input: RegisterInput): Promise<ActionResult> {
  try {
    // 1. Validate
    const validated = registerSchema.safeParse(input);
    if (!validated.success) {
      return errorResponse('Dữ liệu không hợp lệ', validated.error.flatten().fieldErrors as any);
    }

    const { rows, nguoi_dang_ky } = validated.data;
    if (rows.length === 0) {
      return errorResponse('Không có dữ liệu để đăng ký');
    }

    // 2. Kiểm tra trạng thái hiện tại
    const maKHs = rows.map(r => r.Ma_KH);
    const params: Record<string, string> = {};
    const placeholders = maKHs.map((ma, i) => {
      const p = `ma${i}`;
      params[p] = ma;
      return `@${p}`;
    });

    const checkRes = await query<{ Ma_KH: string, Trang_thai_duyet: string }>(`
      SELECT Ma_KH, Trang_thai_duyet FROM tbl_dangky_chinhtuyen 
      WHERE Ma_KH IN (${placeholders.join(',')})
    `, params);
    
    const existingRecords = checkRes.recordset;
    const rejectedMaKHs = new Set(existingRecords.filter(r => r.Trang_thai_duyet === 'Từ chối').map(r => r.Ma_KH));
    const ignoredMaKHs = new Set(existingRecords.filter(r => r.Trang_thai_duyet !== 'Từ chối').map(r => r.Ma_KH));
    
    const newRows = rows.filter(r => !ignoredMaKHs.has(r.Ma_KH) && !rejectedMaKHs.has(r.Ma_KH));
    const resubmitRows = rows.filter(r => rejectedMaKHs.has(r.Ma_KH));

    if (newRows.length === 0 && resubmitRows.length === 0) {
      return errorResponse('Tất cả yêu cầu đã tồn tại và đang chờ duyệt');
    }

    const pool = await getPool();

    // 3. Thực hiện Insert/Update trong Transaction (nếu cần, ở đây làm tuần tự)
    // Lưu ý: Có thể dùng Bulk Insert để tối ưu hơn nếu số lượng lớn
    
    for (const r of newRows) {
      await pool.request()
        .input('khu_vuc', sql.NVarChar(100), r.Khu_vuc)
        .input('ma_kh', sql.NVarChar(50), r.Ma_KH)
        .input('ten_kh', sql.NVarChar(255), r.Ten_KH)
        .input('dc', sql.NVarChar(500), r.DC)
        .input('nvbh_cu', sql.NVarChar(255), r.Ma_ten_nvbh_CU)
        .input('thu_cu', sql.NVarChar(100), r.Thu_CU)
        .input('ts_cu', sql.NVarChar(50), r.Tan_suat_CU)
        .input('nvbh_moi', sql.NVarChar(255), r.Ma_ten_nvbh_MOI)
        .input('thu_moi', sql.NVarChar(100), r.Thu_MOI)
        .input('ts_moi', sql.NVarChar(50), r.Tan_suat_MOI)
        .input('nguoi_dk', sql.NVarChar(100), nguoi_dang_ky)
        .query(`
          INSERT INTO tbl_dangky_chinhtuyen
            (Khu_vuc, Ma_KH, Ten_KH, DC, Ma_ten_nvbh_CU, Thu_CU, Tan_suat_CU, Ma_ten_nvbh_MOI, Thu_MOI, Tan_suat_MOI, Nguoi_dang_ky, Ngay_dang_ky)
          VALUES
            (@khu_vuc, @ma_kh, @ten_kh, @dc, @nvbh_cu, @thu_cu, @ts_cu, @nvbh_moi, @thu_moi, @ts_moi, @nguoi_dk, DATEADD(hour, 7, GETUTCDATE()))
        `);
    }

    for (const r of resubmitRows) {
      await pool.request()
        .input('ma_kh', sql.NVarChar(50), r.Ma_KH)
        .input('nvbh_moi', sql.NVarChar(255), r.Ma_ten_nvbh_MOI)
        .input('thu_moi', sql.NVarChar(100), r.Thu_MOI)
        .input('ts_moi', sql.NVarChar(50), r.Tan_suat_MOI)
        .input('nguoi_dk', sql.NVarChar(100), nguoi_dang_ky)
        .query(`
          UPDATE tbl_dangky_chinhtuyen
          SET Trang_thai_duyet = N'Chờ duyệt',
              Ma_ten_nvbh_MOI = @nvbh_moi,
              Thu_MOI = @thu_moi,
              Tan_suat_MOI = @ts_moi,
              Nguoi_dang_ky = @nguoi_dk,
              Ngay_dang_ky = DATEADD(hour, 7, GETUTCDATE()),
              Ngay_duyet = NULL
          WHERE Ma_KH = @ma_kh
        `);
    }

    revalidateTag('chinhtuyen', 'max');

    return successResponse({
      inserted: newRows.length,
      updated: resubmitRows.length
    }, `Đã gửi đăng ký thành công cho ${newRows.length + resubmitRows.length} khách hàng`);

  } catch (error) {
    console.error('registerChinhtuyen error:', error);
    return errorResponse('Lỗi hệ thống khi lưu đăng ký');
  }
}
