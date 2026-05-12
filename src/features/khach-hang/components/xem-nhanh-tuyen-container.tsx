'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flex, App, Typography, Spin, Button, Space } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { getKPSDS } from '../actions/get-kpsds';
import { getChoPho } from '../actions/get-cho-pho';
import { KHRecord } from '../types';
import { XemNhanhTuyenTable } from '@/features/khach-hang/components/xem-nhanh-tuyen-table';
import { XemNhanhTuyenFilters } from '@/features/khach-hang/components/xem-nhanh-tuyen-filters';
import { DEFAULT_PAGE_SIZE } from '@/constants';

const { Text } = Typography;

export interface SummaryCell {
  total: number;
  marketCount: number;
  details: Record<string, number>;
}

export interface SummaryRow {
  key: string;
  khuVuc: string;
  nvbh: string;
  tongKH: number;
  t2: SummaryCell;
  t3: SummaryCell;
  t4: SummaryCell;
  t5: SummaryCell;
  t6: SummaryCell;
  t7: SummaryCell;
  cn: SummaryCell;
}

export function XemNhanhTuyenContainer() {
  const { message } = App.useApp();
  const [data, setData] = useState<KHRecord[]>([]);
  const [choPhoMap, setChoPhoMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [filters, setFilters] = useState({
    khuVuc: undefined as string | undefined,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resKpsds, resChoPho] = await Promise.all([
        getKPSDS(),
        getChoPho()
      ]);

      if ('error' in resKpsds) throw new Error(resKpsds.error);
      if ('error' in resChoPho) throw new Error(resChoPho.error);

      setData(resKpsds.data);
      
      const cpMap: Record<string, string> = {};
      resChoPho.data.forEach(item => {
        cpMap[item.MA_KH] = item.TRENDUONG_TRONGCHO;
      });
      setChoPhoMap(cpMap);
    } catch (err: any) {
      message.error(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summaryData = useMemo(() => {
    const groups: Record<string, any> = {};
    const days = ['t2', 't3', 't4', 't5', 't6', 't7', 'cn'];
    const dayMapping: Record<string, string> = { 'T2': 't2', 'T3': 't3', 'T4': 't4', 'T5': 't5', 'T6': 't6', 'T7': 't7', 'CN': 'cn' };

    data.forEach(r => {
      if (filters.khuVuc && r.Khu_Vực !== filters.khuVuc) return;

      // Logic lọc F2 giống bản cũ (chỉ lấy v)
      const tanSuat = r.Tần_Suất || '';
      if (tanSuat.includes('F2') && !tanSuat.toLowerCase().includes('v')) return;

      const key = `${r.Khu_Vực}_${r.Mã_Tên_NVBH}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          khuVuc: r.Khu_Vực,
          nvbh: r.Mã_Tên_NVBH,
          khSet: new Set<string>(),
        };
        days.forEach(d => {
          groups[key][d] = { total: 0, marketCount: 0, details: {} as Record<string, number> };
        });
      }

      const g = groups[key];
      g.khSet.add(r.Mã_KH);

      const thuStr = r.Thứ || '';
      Object.entries(dayMapping).forEach(([label, dayKey]) => {
        if (thuStr.includes(label)) {
          g[dayKey].total++;
          g[dayKey].details[tanSuat] = (g[dayKey].details[tanSuat] || 0) + 1;
          
          const rawVal = choPhoMap[r.Mã_KH.trim()] || '';
          if (rawVal.toLowerCase().includes('trong chợ')) {
            g[dayKey].marketCount++;
          }
        }
      });
    });

    return Object.values(groups).map(g => ({
      ...g,
      tongKH: g.khSet.size
    })).sort((a, b) => (a.khuVuc || '').localeCompare(b.khuVuc || '') || (a.nvbh || '').localeCompare(b.nvbh || '')) as SummaryRow[];
  }, [data, filters.khuVuc, choPhoMap]);

  const handleExportExcel = async () => {
    if (summaryData.length === 0) return;
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Xem nhanh tuyến');
      
      const filterKhuVuc = filters.khuVuc || 'Tất cả';

      // 1. Định nghĩa cột
      sheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Khu vực', key: 'khuVuc', width: 15 },
        { header: 'NVBH', key: 'nvbh', width: 35 },
        { header: 'Tổng KH', key: 'tongKH', width: 12 },
        { header: 'Thứ 2', key: 't2', width: 10 },
        { header: 'Thứ 3', key: 't3', width: 10 },
        { header: 'Thứ 4', key: 't4', width: 10 },
        { header: 'Thứ 5', key: 't5', width: 10 },
        { header: 'Thứ 6', key: 't6', width: 10 },
        { header: 'Thứ 7', key: 't7', width: 10 },
        { header: 'Chủ nhật', key: 'cn', width: 12 },
      ];

      // 2. Thêm Header rows (Để trống 3 dòng đầu cho Tiêu đề & Filter)
      sheet.spliceRows(1, 0, [], [], []);

      // 3. Tiêu đề báo cáo
      sheet.mergeCells('A1:K1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'BÁO CÁO XEM NHANH TUYẾN BÁN HÀNG';
      titleCell.font = { bold: true, size: 16, color: { argb: 'FF1D4ED8' } }; // Blue-700
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // 4. Thông tin bộ lọc
      sheet.mergeCells('A2:K2');
      const filterCell = sheet.getCell('A2');
      filterCell.value = `Khu vực: ${filterKhuVuc} | Thời gian: ${new Date().toLocaleDateString('vi-VN')}`;
      filterCell.font = { italic: true, size: 11, color: { argb: 'FF64748B' } }; // Slate-500
      filterCell.alignment = { horizontal: 'center' };

      // 5. Định dạng Table Header (Dòng 4)
      const headerRow = sheet.getRow(4);
      headerRow.height = 25;
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Blue-600
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // 6. Đổ dữ liệu
      summaryData.forEach((r, idx) => {
        const row = sheet.addRow({
          stt: idx + 1,
          khuVuc: r.khuVuc,
          nvbh: r.nvbh,
          tongKH: r.tongKH,
          // Các cột Thứ sẽ được điền thủ công để định dạng
        });

        // Định dạng dòng dữ liệu (tất cả 11 cột để đảm bảo có đường kẻ ô)
        for (let i = 1; i <= 11; i++) {
          const cell = row.getCell(i);
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle', wrapText: false };
        }

        // Điền và định dạng các cột Thứ (T2 -> CN)
        const days = ['t2', 't3', 't4', 't5', 't6', 't7', 'cn'] as const;
        days.forEach(day => {
          const val = r[day];
          const cell = row.getCell(day);
          
          if (!val || val.total === 0) {
            cell.value = '-';
            cell.font = { color: { argb: 'FF94A3B8' } }; // Gray-400
          } else {
            const isMarket = val.marketCount >= 1;
            const label = isMarket ? '[C]' : '[P]';
            const threshold = isMarket ? 36 : 32;
            const isLow = val.total < threshold;
            
            cell.value = `${val.total} ${label}`;
            
            if (isLow) {
              cell.font = { color: { argb: 'FF991B1B' }, bold: true }; // Red-800
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } }; // Red-100/Rose-100
            } else {
              cell.font = { color: { argb: 'FF2563EB' }, bold: true }; // Blue-600
            }
          }
        });

        // Căn giữa một số cột
        ['stt', 'tongKH', 't2', 't3', 't4', 't5', 't6', 't7', 'cn'].forEach(col => {
          row.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
        });
      });

      // 7. Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Xem_Nhanh_Tuyen_${new Date().getTime()}.xlsx`);
      
      message.success('Đã xuất file Excel thành công!');
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  const khuVucOptions = useMemo(() => {
    return Array.from(new Set(data.map(r => r.Khu_Vực))).filter(Boolean).sort().map(v => ({ label: v, value: v }));
  }, [data]);

  return (
    <Flex vertical gap={16} className="h-full">
      <div>
        <XemNhanhTuyenFilters 
          options={{ khuVuc: khuVucOptions }}
          filters={filters}
          onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
          onReload={fetchData}
          loading={loading}
        />
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-1" />

      <div className="flex-1 overflow-hidden">
        <XemNhanhTuyenTable 
          data={summaryData}
          loading={loading}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Flex justify="start" align="center" className="mt-auto py-3 px-2 border-t border-gray-50 action-bar-container bg-white/50 backdrop-blur-sm">
        <Space size={12}>
          <Button 
            icon={<ReloadOutlined spin={loading} />} 
            onClick={fetchData} 
            loading={loading}
            className="rounded-lg shadow-sm"
          >
            Làm mới
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExportExcel} 
            loading={exporting}
            className="rounded-lg shadow-sm"
          >
            Xuất Excel
          </Button>
        </Space>
      </Flex>
    </Flex>
  );
}
