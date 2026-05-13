'use server';

import { query } from '@/lib/db';
import { Product, ProductConfigResponse } from '../types';
import { getAuthSession } from '@/lib/auth-server';
import { ActionResult, successResponse, errorResponse } from '@/lib/actions';

export async function getProductConfigMomoi(): Promise<ActionResult<ProductConfigResponse & { areas?: string[] }>> {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse('Chưa đăng nhập hoặc phiên đã hết hạn');
    
    const username = session.username;

    // Lấy danh sách sản phẩm duy nhất từ bảng dữ liệu bao phủ
    const resAll = await query<{ TEN_SPQD: string }>('SELECT DISTINCT TEN_SPQD FROM tbl_baophu_nv_92 WHERE TEN_SPQD IS NOT NULL ORDER BY TEN_SPQD');
    
    // Map lại để phù hợp với interface Product (Dùng TEN_SPQD làm MA_SPQD vì bảng này không có mã SP)
    const allProducts: Product[] = resAll.recordset.map(item => ({
      MA_SPQD: item.TEN_SPQD,
      TEN_SPQD: item.TEN_SPQD
    }));
    
    // Lấy cấu hình của user từ bảng momoi
    const resUser = await query<Product>(`
      SELECT MA_SPQD, TEN_SPQD, Username, Thu_tu_sap_xep 
      FROM tbl_danhsach_sp_momoi 
      WHERE Username = @username 
      ORDER BY Thu_tu_sap_xep
    `, { username });

    // Lấy Quyền Khu vực trực tiếp từ session
    const quyenDL = session.quyenQL || '';
    let userAreas: string[] = [];
    if (quyenDL) {
      const parts = quyenDL.split('-').map(p => p.replace(/["']/g, '').trim()).filter(Boolean);
      userAreas = [...new Set(parts)].sort();
    }

    return successResponse({
      allProducts: allProducts,
      userConfig: resUser.recordset,
      areas: userAreas,
    });
  } catch (error) {
    console.error('getProductConfigMomoi error:', error);
    return errorResponse('Lỗi truy vấn danh mục sản phẩm mở mới: ' + (error as Error).message);
  }
}
