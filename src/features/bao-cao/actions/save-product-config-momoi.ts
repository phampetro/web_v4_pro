'use server';

import { query } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-server';
import { ActionResult, successResponse, errorResponse } from '@/lib/actions';
import { Product } from '../types';

export async function saveProductConfigMomoi(products: Product[]): Promise<ActionResult<void>> {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse('Chưa đăng nhập hoặc phiên đã hết hạn');
    
    const username = session.username;

    // 1. Xóa cấu hình cũ của user trong bảng momoi
    await query('DELETE FROM tbl_danhsach_sp_momoi WHERE Username = @username', { username });

    // 2. Thêm cấu hình mới
    if (products.length > 0) {
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        await query(`
          INSERT INTO tbl_danhsach_sp_momoi (MA_SPQD, TEN_SPQD, Username, Thu_tu_sap_xep)
          VALUES (@ma, @ten, @user, @order)
        `, {
          ma: p.MA_SPQD,
          ten: p.TEN_SPQD,
          user: username,
          order: i + 1
        });
      }
    }

    return successResponse(undefined, 'Đã lưu cấu hình danh sách sản phẩm mở mới');
  } catch (error) {
    console.error('saveProductConfigMomoi error:', error);
    return errorResponse('Lỗi khi lưu cấu hình: ' + (error as Error).message);
  }
}
