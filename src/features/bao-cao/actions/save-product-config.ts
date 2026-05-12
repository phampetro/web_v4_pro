'use server';

import { getPool } from '@/lib/db';
import sql from 'mssql';
import { Product } from '../types';

export async function saveProductConfig(username: string, products: Product[]) {
  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Xóa cấu hình cũ
      const requestDelete = new sql.Request(transaction);
      requestDelete.input('username', sql.NVarChar, username);
      await requestDelete.query('DELETE FROM tbl_config_sanpham_baocao WHERE Username = @username');

      // 2. Chèn cấu hình mới
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const requestInsert = new sql.Request(transaction);
        requestInsert.input('username', sql.NVarChar, username);
        requestInsert.input('ma_sp', sql.NVarChar, p.MA_SPQD);
        requestInsert.input('ten_sp', sql.NVarChar, p.TEN_SPQD);
        requestInsert.input('stt', sql.Int, i + 1);
        
        await requestInsert.query(`
          INSERT INTO tbl_config_sanpham_baocao (Username, MA_SPQD, TEN_SPQD, Thu_tu_sap_xep)
          VALUES (@username, @ma_sp, @ten_sp, @stt)
        `);
      }

      await transaction.commit();
      return { success: true };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('saveProductConfig error:', error);
    return { error: 'Lỗi khi lưu cấu hình sản phẩm' };
  }
}
