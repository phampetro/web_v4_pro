'use server';

import { getPool } from '@/lib/db';
import sql from 'mssql';

export async function deleteChoPho(ids: number[]) {
  try {
    if (!ids.length) return { error: 'Chưa chọn bản ghi nào' };

    const pool = await getPool();
    const request = pool.request();

    const placeholders = ids.map((id, i) => {
      const p = `id${i}`;
      request.input(p, sql.BigInt, id);
      return `@${p}`;
    });

    const result = await request.query(`
      DELETE FROM tbl_dangky_chopho
      WHERE ID IN (${placeholders.join(',')})
      AND Trang_thai_duyet = N'Chờ duyệt'
    `);

    return {
      success: true,
      deleted: result.rowsAffected[0],
    };
  } catch (error) {
    console.error('deleteChoPho error:', error);
    return { error: 'Lỗi khi xóa đăng ký Chợ - Phố' };
  }
}
