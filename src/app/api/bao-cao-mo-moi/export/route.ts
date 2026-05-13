import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { products, reportType, areas } = await req.json();

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'Chưa chọn sản phẩm' }, { status: 400 });
    }

    if (reportType !== 'pt_diem_ban') {
      return NextResponse.json({ error: 'Loại báo cáo không hỗ trợ' }, { status: 400 });
    }

    // 1. Lấy ngày cập nhật dữ liệu mới nhất từ DB
    let toDateStr = '';
    let fromDateStr = '';
    const resNgay = await query<any>('SELECT TOP(1) [Ngay_Update] FROM Web_NgayUpdate');
    if (resNgay.recordset.length > 0) {
      const ngayUpdate = resNgay.recordset[0].Ngay_Update;
      const dTo = new Date(ngayUpdate);
      if (!isNaN(dTo.getTime())) {
        toDateStr = `${dTo.getDate().toString().padStart(2, '0')}/${(dTo.getMonth() + 1).toString().padStart(2, '0')}/${dTo.getFullYear()}`;
        const dFrom = new Date(dTo);
        dFrom.setDate(dFrom.getDate() - 90);
        fromDateStr = `${dFrom.getDate().toString().padStart(2, '0')}/${(dFrom.getMonth() + 1).toString().padStart(2, '0')}/${dFrom.getFullYear()}`;
      }
    }

    // 2. Chuẩn bị danh sách cột cho PIVOT
    const productNames = products.map((p: any) => p.TEN_SPQD);
    const pivotCols = productNames.map((name: string) => `[${name.replace(/]/g, "]]")}]`).join(', ');

    // 3. Chuẩn bị điều kiện lọc khu vực
    const areaParams: Record<string, string> = {};
    const areaPlaceholders = areas.map((area: string, i: number) => {
      const key = `area${i}`;
      areaParams[key] = area;
      return `@${key}`;
    }).join(', ');

    // 4. Xây dựng câu lệnh SQL PIVOT
    const sqlQuery = `
      SELECT 
        TEN_MIEN, TEN_VUNG, TEN_KHUVUC, MA_NPP, TEN_NPP, MA_NVBH, TEN_NVBH,
        MAX(Vieng_Tham) as TongKH,
        MAX(Dang_ban_Cholimex) as DangBan,
        ${pivotCols}
      FROM (
        SELECT 
          TEN_MIEN, TEN_VUNG, TEN_KHUVUC, MA_NPP, TEN_NPP, MA_NVBH, TEN_NVBH, 
          Vieng_Tham, Dang_ban_Cholimex, 
          TEN_SPQD, Bao_Phu
        FROM tbl_baophu_nv_92
        WHERE TEN_KHUVUC IN (${areaPlaceholders})
      ) x
      PIVOT (
        MAX(Bao_Phu)
        FOR TEN_SPQD IN (${pivotCols})
      ) p
      GROUP BY TEN_MIEN, TEN_VUNG, TEN_KHUVUC, MA_NPP, TEN_NPP, MA_NVBH, TEN_NVBH, ${pivotCols}
      ORDER BY TEN_MIEN, TEN_VUNG, TEN_KHUVUC, MA_NPP, MA_NVBH
    `;

    const result = await query<any>(sqlQuery, areaParams);
    const data = result.recordset;

    // 5. Đọc Template Excel
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_bao_cao_phan_tich_diem_ban_do_phu.xlsx');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Không tìm thấy file template' }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return NextResponse.json({ error: 'Template không hợp lệ' }, { status: 500 });

    // 6. Điền thông tin Header (Chỉ điền giá trị)
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    
    worksheet.getCell('B3').value = timeStr;
    worksheet.getCell('B4').value = fromDateStr;
    worksheet.getCell('D4').value = toDateStr;

    // Điền tiêu đề sản phẩm động (Dòng 6, từ cột I)
    const headerRow = worksheet.getRow(6);
    productNames.forEach((name: string, i: number) => {
      const cell = headerRow.getCell(9 + i);
      cell.value = name;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Hàm tính tổng
    const calculateTotals = (items: any[]) => {
      const totals: any = { TongKH: 0, DangBan: 0 };
      productNames.forEach((name: string) => totals[name] = 0);
      items.forEach(item => {
        totals.TongKH += (item.TongKH || 0);
        totals.DangBan += (item.DangBan || 0);
        productNames.forEach((name: string) => totals[name] += (item[name] || 0));
      });
      return totals;
    };

    // Hàm chèn dòng tổng
    const insertTotalRow = (rowIndex: number, label: string, totals: any, color: string, startCol: number, endCol: number, extraData?: { col: number, val: any }) => {
      const row = worksheet.getRow(rowIndex);
      row.getCell(startCol).value = label;
      if (extraData) row.getCell(extraData.col).value = extraData.val;
      row.getCell(7).value = totals.TongKH;
      row.getCell(8).value = totals.DangBan;
      productNames.forEach((n: string, i: number) => {
        row.getCell(9 + i).value = totals[n];
      });

      if (endCol > startCol) worksheet.mergeCells(rowIndex, startCol, rowIndex, endCol);
      
      for (let i = 1; i < 9 + productNames.length; i++) {
        const cell = row.getCell(i);
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        
        // Chỉ set căn lề cho các cột số ở dòng tổng
        if (i >= 7) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
      }
    };

    let currentRowIndex = 7;
    let stt = 1;

    const mienGroups = Object.groupBy(data, (r: any) => r.TEN_MIEN);
    for (const [mien, mienRows] of Object.entries(mienGroups)) {
      const vungGroups = Object.groupBy(mienRows as any[], (r: any) => r.TEN_VUNG);
      for (const [vung, vungRows] of Object.entries(vungGroups)) {
        const nppGroups = Object.groupBy(vungRows as any[], (r: any) => r.MA_NPP);
        for (const [nppCode, nppRows] of Object.entries(nppGroups)) {
          const startNppRow = currentRowIndex;
          const nppName = (nppRows as any[])[0].TEN_NPP;

          (nppRows as any[]).forEach(item => {
            const row = worksheet.getRow(currentRowIndex++);
            row.getCell(1).value = stt;
            row.getCell(2).value = ''; // Mã NPP để trống ở dòng chi tiết
            row.getCell(3).value = item.TEN_NPP;
            row.getCell(4).value = item.MA_NVBH;
            row.getCell(5).value = item.TEN_NVBH;
            row.getCell(6).value = ''; // Kênh
            row.getCell(7).value = item.TongKH;
            row.getCell(8).value = item.DangBan;
            productNames.forEach((name: string, i: number) => {
              row.getCell(9 + i).value = item[name] || 0;
            });

            // Chỉ kẻ border mỏng, KHÔNG set alignment để dùng mặc định của template
            for (let i = 1; i < 9 + productNames.length; i++) {
              row.getCell(i).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
          });

          // Chỉ thực hiện gộp ô, không set alignment thủ công
          if ((nppRows as any[]).length > 1) {
            worksheet.mergeCells(startNppRow, 1, currentRowIndex - 1, 1);
            worksheet.mergeCells(startNppRow, 2, currentRowIndex - 1, 2);
            worksheet.mergeCells(startNppRow, 3, currentRowIndex - 1, 3);
          }
          stt++;

          insertTotalRow(currentRowIndex++, `TỔNG NPP: ${nppName}`, calculateTotals(nppRows as any[]), 'FFF2F2F2', 3, 5, { col: 2, val: nppCode });
        }
        insertTotalRow(currentRowIndex++, `TỔNG VÙNG: ${vung}`, calculateTotals(vungRows as any[]), 'FFE6F7FF', 2, 4);
      }
      insertTotalRow(currentRowIndex++, `TỔNG MIỀN: ${mien}`, calculateTotals(mienRows as any[]), 'FFCCFFCC', 1, 3);
    }

    insertTotalRow(currentRowIndex++, 'TỔNG CỘNG TẤT CẢ', calculateTotals(data), 'FFFFFF00', 1, 5);

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=Bao_Cao_Mo_Moi.xlsx',
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Lỗi xuất báo cáo: ' + error.message }, { status: 500 });
  }
}
