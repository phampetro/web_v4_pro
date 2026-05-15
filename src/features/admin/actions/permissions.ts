'use server';

import { query } from '@/lib/db';
import { ActionResult, successResponse, errorResponse } from '@/lib/actions';
import { revalidatePath } from 'next/cache';

// Lấy danh sách tất cả quyền hiện có trong DB cho một Target (Role hoặc User)
export async function getPermissions(targetType: 'ROLE' | 'USER', targetValue: string): Promise<ActionResult<string[]>> {
  try {
    const result = await query<any>(
      'SELECT PermissionKey FROM AppPermissions WHERE TargetType = @type AND TargetValue = @val AND IsAllowed = 1',
      { type: targetType, val: targetValue }
    );
    const permissions = result.recordset.map((r: any) => r.PermissionKey);
    return successResponse(permissions);
  } catch (error) {
    return errorResponse('Không thể lấy danh sách quyền');
  }
}

// Lưu (Cập nhật) danh sách quyền cho một Target
export async function savePermissions(
  targetType: 'ROLE' | 'USER', 
  targetValue: string, 
  permissionKeys: string[],
  adminUsername: string
): Promise<ActionResult> {
  try {
    // 1. Xóa hết quyền cũ của Target này
    await query(
      'DELETE FROM AppPermissions WHERE TargetType = @type AND TargetValue = @val',
      { type: targetType, val: targetValue }
    );

    // 2. Thêm danh sách quyền mới
    if (permissionKeys.length > 0) {
      // Vì mssql package của chúng ta dùng tham số hóa đơn giản, ta sẽ insert từng dòng hoặc dùng chuỗi gộp
      // Để an toàn, ta lặp qua và insert (vì số lượng menu không quá lớn)
      for (const key of permissionKeys) {
        await query(
          'INSERT INTO AppPermissions (TargetType, TargetValue, PermissionKey, IsAllowed, UpdatedBy) VALUES (@type, @val, @key, 1, @admin)',
          { type: targetType, val: targetValue, key: key, admin: adminUsername }
        );
      }
    }

    revalidatePath('/dashboard');
    return successResponse(null, 'Cập nhật quyền thành công');
  } catch (error) {
    console.error('Save permissions error:', error);
    return errorResponse('Lỗi khi lưu quyền');
  }
}

// Lấy danh sách Users để phân quyền cá nhân
export async function getAllUsers(): Promise<ActionResult<any[]>> {
  try {
    const result = await query<any>('SELECT ID, Quyen_QL FROM UserInfo ORDER BY ID ASC');
    return successResponse(result.recordset);
  } catch (error) {
    return errorResponse('Không thể lấy danh sách người dùng');
  }
}
