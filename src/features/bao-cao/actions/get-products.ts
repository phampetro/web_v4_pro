'use server';

import { query } from '@/lib/db';
import { Product, ProductConfigResponse } from '../types';

export async function getProductConfig(username: string): Promise<ProductConfigResponse | { error: string }> {
  try {
    // Lấy tất cả sản phẩm
    const resAll = await query<Product>('SELECT MA_SPQD, TEN_SPQD FROM ReportVBA_SP_QUY_DOI ORDER BY MA_SPQD');
    
    // Lấy cấu hình của user
    const resUser = await query<Product>(`
      SELECT MA_SPQD, TEN_SPQD, Username, Thu_tu_sap_xep 
      FROM tbl_config_sanpham_baocao 
      WHERE Username = @username 
      ORDER BY Thu_tu_sap_xep
    `, { username });

    return {
      allProducts: resAll.recordset,
      userConfig: resUser.recordset,
    };
  } catch (error) {
    console.error('getProductConfig error:', error);
    return { error: 'Lỗi truy vấn danh mục sản phẩm' };
  }
}
