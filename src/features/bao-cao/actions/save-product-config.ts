'use server';

import { getPool } from '@/lib/db';
import sql from 'mssql';
import { Product } from '../types';
import { getAuthSession } from '@/lib/auth-server';
import { ActionResult, successResponse, errorResponse } from '@/lib/actions';

export async function saveProductConfig(products: Product[]): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse('Chưa đăng nhập hoặc phiên đã hết hạn');
    
    const username = session.username;

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Xóa cấu hình cũ của user
      const reqDelete = new sql.Request(transaction);
      reqDelete.input('username', sql.NVarChar, username);
      await reqDelete.query('DELETE FROM tbl_danhsach_sp_baophu WHERE Username = @username');

      // 2. Chèn danh sách mới
      if (products.length > 0) {
        for (const p of products) {
          const reqInsert = new sql.Request(transaction);
          reqInsert.input('ma_spqd', sql.NVarChar, p.MA_SPQD);
          reqInsert.input('ten_spqd', sql.NVarChar, p.TEN_SPQD);
          reqInsert.input('username', sql.NVarChar, username);
          reqInsert.input('thu_tu', sql.Int, p.Thu_tu_sap_xep);
          await reqInsert.query(`
            INSERT INTO tbl_danhsach_sp_baophu (MA_SPQD, TEN_SPQD, Username, Thu_tu_sap_xep)
            VALUES (@ma_spqd, @ten_spqd, @username, @thu_tu)
          `);
        }
      }

      await transaction.commit();
      return successResponse(null, 'Lưu cấu hình sản phẩm thành công');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('saveProductConfig error:', error);
    return errorResponse('Lỗi khi lưu cấu hình sản phẩm');
  }
}
