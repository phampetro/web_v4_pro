'use server';

import { getPool } from '@/lib/db';
import sql from 'mssql';
import { cookies } from 'next/headers';

interface ApproveInput {
  ids: number[];
  trang_thai: string;
}

export async function approveTamNgung({ ids, trang_thai }: ApproveInput) {
  try {
    if (!ids.length) return { error: 'Chưa chọn bản ghi nào' };

    // Lấy username từ session cookie
    const cookieStore = await cookies();
    const session = cookieStore.get('session_token')?.value;
    if (!session) return { error: 'Unauthorized' };
    
    let username = 'Admin';
    try {
      const userData = JSON.parse(decodeURIComponent(session));
      username = userData.username || 'Admin';
    } catch (e) {
      console.error('Failed to parse session in approveTamNgung');
    }

    const pool = await getPool();
    const request = pool.request();
    request.input('trang_thai', sql.NVarChar(50), trang_thai);
    request.input('nguoi_duyet', sql.NVarChar(100), username);

    const placeholders = ids.map((id, i) => {
      const p = `id${i}`;
      request.input(p, sql.BigInt, id);
      return `@${p}`;
    });

    const result = await request.query(`
      UPDATE tbl_dangky_tamngung_kh
      SET Trang_thai_duyet = @trang_thai,
          Nguoi_duyet = @nguoi_duyet,
          Ngay_duyet = DATEADD(hour, 7, GETUTCDATE())
      WHERE ID IN (${placeholders.join(',')})
    `);

    return {
      success: true,
      updated: result.rowsAffected[0],
      trang_thai,
    };
  } catch (error) {
    console.error('approveTamNgung error:', error);
    return { error: 'Lỗi khi cập nhật trạng thái duyệt' };
  }
}
