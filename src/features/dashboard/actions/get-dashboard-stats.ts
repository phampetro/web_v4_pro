'use server';

import { query } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-server';
import { ActionResult, successResponse, errorResponse } from '@/lib/actions';

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  displayCustomers: number;
  lossCustomers: number;
  totalStaff: number;
  coverageRate: number;
  lastUpdate: string | null;
  topStaff: { name: string; count: number; active: number; rate: number }[];
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse('Chưa đăng nhập');

    const quyenQL = session.quyenQL;
    let whereClause = '';
    const queryParams: Record<string, any> = {};

    if (quyenQL) {
      const allowedAreas = quyenQL.split(/[,-]/).map(a => a.trim()).filter(Boolean);
      if (allowedAreas.length > 0) {
        const areaPlaceholders = allowedAreas.map((a, i) => {
          const p = `area${i}`;
          queryParams[p] = a;
          return `@${p}`;
        }).join(',');
        whereClause = `WHERE Khu_Vực IN (${areaPlaceholders})`;
      }
    }

    // Lấy thông tin tổng quan dựa trên Mã_KH duy nhất để tránh trùng lặp
    const summaryRes = await query<{
      totalKH: number;
      activeKH: number;
      displayKH: number;
      totalStaff: number;
    }>(`
      SELECT 
        COUNT(DISTINCT Mã_KH) as totalKH,
        COUNT(DISTINCT CASE WHEN Sku_Đang_bán > 0 THEN Mã_KH END) as activeKH,
        COUNT(DISTINCT CASE WHEN Trưng_Bày IS NOT NULL AND Trưng_Bày <> '' AND Trưng_Bày <> '0' THEN Mã_KH END) as displayKH,
        COUNT(DISTINCT Mã_Tên_NV) as totalStaff
      FROM ReportVBA_BP_KH
      ${whereClause}
    `, queryParams);

    const summary = summaryRes.recordset[0];
    const totalKH = summary.totalKH || 0;
    const activeKH = summary.activeKH || 0;
    const lossKH = totalKH - activeKH;

    // Lấy ngày cập nhật
    const updateRes = await query<{ Ngay_Update: Date }>(`
      SELECT TOP 1 Ngay_Update FROM Web_NgayUpdate ORDER BY Ngay_Update DESC
    `);
    const lastUpdate = updateRes.recordset[0]?.Ngay_Update?.toISOString() || null;

    // Lấy Top 5 Nhân viên theo độ bao phủ
    const staffRes = await query<{
      Mã_Tên_NV: string;
      total: number;
      active: number;
    }>(`
      SELECT TOP 5
        Mã_Tên_NV,
        COUNT(DISTINCT Mã_KH) as total,
        COUNT(DISTINCT CASE WHEN Sku_Đang_bán > 0 THEN Mã_KH END) as active
      FROM ReportVBA_BP_KH
      ${whereClause}
      GROUP BY Mã_Tên_NV
      HAVING COUNT(DISTINCT Mã_KH) > 0
      ORDER BY (CAST(COUNT(DISTINCT CASE WHEN Sku_Đang_bán > 0 THEN Mã_KH END) AS FLOAT) / COUNT(DISTINCT Mã_KH)) DESC
    `, queryParams);

    const topStaff = staffRes.recordset.map(s => ({
      name: s.Mã_Tên_NV,
      count: s.total,
      active: s.active,
      rate: s.total > 0 ? Math.round((s.active / s.total) * 100) : 0
    }));

    return successResponse({
      totalCustomers: totalKH,
      activeCustomers: activeKH,
      displayCustomers: summary.displayKH || 0,
      lossCustomers: lossKH > 0 ? lossKH : 0,
      totalStaff: summary.totalStaff || 0,
      coverageRate: totalKH > 0 ? Math.round((activeKH / totalKH) * 100) : 0,
      lastUpdate,
      topStaff
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return errorResponse('Lỗi khi tải thông tin dashboard');
  }
}
