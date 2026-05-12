'use server';

import { getPool } from '@/lib/db';
import sql from 'mssql';
import { ActionResult, successResponse, errorResponse } from '@/lib/actions';
import { revalidateTag } from 'next/cache';

interface ApproveInput {
  ids: number[];
  trang_thai: string;
  nguoi_duyet: string;
}

export async function approveChinhtuyen({ ids, trang_thai, nguoi_duyet }: ApproveInput): Promise<ActionResult> {
  try {
    if (!ids.length) return errorResponse('Chưa chọn bản ghi nào');

    const pool = await getPool();
    const request = pool.request();
    request.input('trang_thai', sql.NVarChar(50), trang_thai);
    request.input('nguoi_duyet', sql.NVarChar(100), nguoi_duyet || '');

    const placeholders = ids.map((id, i) => {
      const p = `id${i}`;
      request.input(p, sql.Int, id);
      return `@${p}`;
    });

    const result = await request.query(`
      UPDATE tbl_dangky_chinhtuyen
      SET Trang_thai_duyet = @trang_thai,
          Nguoi_duyet = @nguoi_duyet,
          Ngay_duyet = DATEADD(hour, 7, GETUTCDATE())
      WHERE ID IN (${placeholders.join(',')})
    `);

    revalidateTag('chinhtuyen', 'max');

    return successResponse({
      updated: result.rowsAffected[0],
      trang_thai,
    }, `Đã ${trang_thai.toLowerCase()} ${result.rowsAffected[0]} yêu cầu thành công`);
  } catch (error) {
    console.error('approveChinhtuyen error:', error);
    return errorResponse('Lỗi khi cập nhật trạng thái duyệt điều chỉnh tuyến');
  }
}
