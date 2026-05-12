'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Flex, App, Button, Space, Typography, Modal } from 'antd';
import { DownloadOutlined, CameraOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { KPSDSFilters } from './kpsds-filters';
import { KPSDSTable } from './kpsds-table';
import { KHRecord } from '../types';
import { getKPSDS } from '../actions/get-kpsds';
import { getTamNgungStatuses } from '../actions/get-tam-ngung-statuses';
import { saveTamNgung } from '../actions/save-tam-ngung';
import { DEFAULT_PAGE_SIZE, THU_LIST } from '@/constants';

const { Title, Text } = Typography;

export function KPSDSContainer() {
  const { message, modal } = App.useApp();
  
  // State
  const [data, setData] = useState<KHRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [ngayUpdate, setNgayUpdate] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Record<string, { status: string, date: string | null }>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Filters state
  const dayIdx = new Date().getDay();
  const todayThu = THU_LIST[(dayIdx + 6) % 7];

  const [filters, setFilters] = useState({
    khuVuc: undefined as string | undefined,
    nvbh: undefined as string | undefined,
    kh: undefined as string | undefined,
    thu: [todayThu],
    tanSuat: [] as string[],
    showAll: false,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resKpsds, resStatuses] = await Promise.all([
        getKPSDS(),
        getTamNgungStatuses()
      ]);

      if ('error' in resKpsds) {
        message.error(resKpsds.error);
      } else {
        setData(resKpsds.data);
        setNgayUpdate(resKpsds.ngayUpdate);
      }

      if (!('error' in resStatuses)) {
        const statusMap: Record<string, { status: string, date: string | null }> = {};
        resStatuses.forEach(p => {
          statusMap[p.Ma_KH] = { status: p.Trang_thai_duyet, date: p.Ngay_duyet };
        });
        setPendingStatus(statusMap);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTamNgung = async () => {
    if (selectedRowKeys.length === 0) return;
    
    const selectedRows = data.filter(r => selectedRowKeys.includes(r.Mã_KH));
    
    modal.confirm({
      title: 'Xác nhận tạm ngưng khách hàng',
      content: `Bạn có chắc chắn muốn gửi yêu cầu tạm ngưng cho ${selectedRowKeys.length} khách hàng đã chọn?`,
      centered: true,
      onOk: async () => {
        setLoading(true);
        try {
          const res = await saveTamNgung({ rows: selectedRows });
          if (res.success) {
            message.success(res.message || 'Đã gửi yêu cầu thành công');
            setSelectedRowKeys([]);
            fetchData();
          } else {
            message.error(res.error || 'Lỗi khi gửi yêu cầu');
          }
        } catch (err) {
          message.error('Lỗi kết nối server');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Derived options for filters
  const options = useMemo(() => {
    const khuVuc = Array.from(new Set(data.map(r => r.Khu_Vực))).filter(Boolean).sort().map(v => ({ label: v, value: v }));

    let filteredForNVBH = data;
    if (filters.khuVuc) filteredForNVBH = data.filter(r => r.Khu_Vực === filters.khuVuc);
    const nvbh = Array.from(new Set(filteredForNVBH.map(r => r.Mã_Tên_NVBH))).filter(Boolean).sort().map(v => ({ label: v, value: v }));

    let filteredForKH = data;
    if (filters.khuVuc) filteredForKH = filteredForKH.filter(r => r.Khu_Vực === filters.khuVuc);
    if (filters.nvbh) filteredForKH = filteredForKH.filter(r => r.Mã_Tên_NVBH === filters.nvbh);
    const kh = Array.from(new Set(filteredForKH.map(r => `${r.Mã_KH} - ${r.Tên_KH}`))).sort().map(v => ({ label: v, value: v.split(' - ')[0] }));

    const tanSuat = Array.from(new Set(data.map(r => r.Tần_Suất))).filter(Boolean).sort().map(v => ({ label: v, value: v }));
    const thu = THU_LIST.map(v => ({ label: v, value: v }));

    return { khuVuc, nvbh, kh, tanSuat, thu };
  }, [data, filters.khuVuc, filters.nvbh]);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter(r => {
      if (filters.khuVuc && r.Khu_Vực !== filters.khuVuc) return false;
      if (filters.nvbh && r.Mã_Tên_NVBH !== filters.nvbh) return false;
      if (filters.kh && r.Mã_KH !== filters.kh) return false;
      if (filters.thu.length > 0 && !filters.thu.some(t => r.Thứ.includes(t))) return false;
      if (filters.tanSuat.length > 0 && !filters.tanSuat.includes(r.Tần_Suất)) return false;
      if (!filters.showAll && r.Ngày_ĐH_Cuối) return false;
      return true;
    });
  }, [data, filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'khuVuc') setFilters(prev => ({ ...prev, nvbh: undefined, kh: undefined }));
    if (key === 'nvbh') setFilters(prev => ({ ...prev, kh: undefined }));
  };

  const handleExportExcel = async () => {
    if (filteredData.length === 0) return;
    
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Danh sách KH');
      
      const filterKhuVuc = filters.khuVuc || 'Tất cả';
      const filterNVBH = filters.nvbh || 'Tất cả';
      const filterThu = filters.thu.length > 0 ? filters.thu.join(', ') : 'Tất cả';
      const filterTanSuat = filters.tanSuat.length > 0 ? filters.tanSuat.join(', ') : 'Tất cả';
      const ngayFmt = ngayUpdate ? new Date(ngayUpdate).toLocaleDateString('vi-VN') : '';

      // Định nghĩa cột
      sheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Khu vực', key: 'khu_vuc', width: 15 },
        { header: 'NVBH', key: 'nvbh', width: 30 },
        { header: 'Mã KH', key: 'ma_kh', width: 15 },
        { header: 'Tên KH', key: 'ten_kh', width: 35 },
        { header: 'Địa chỉ', key: 'dc', width: 50 },
        { header: 'Thứ', key: 'thu', width: 10 },
        { header: 'Tần suất', key: 'tan_suat', width: 15 },
        { header: 'Trưng bày', key: 'trung_bay', width: 15 },
        { header: 'Ngày ĐH Cuối', key: 'ngay_dh_cuoi', width: 15 },
      ];

      // Thêm Header rows
      sheet.spliceRows(1, 0, [], [], []);

      // Tiêu đề báo cáo
      sheet.mergeCells('A1:J1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'DANH SÁCH KHÁCH HÀNG KHÔNG PHÁT SINH DOANH SỐ TRONG 90 NGÀY';
      titleCell.font = { bold: true, size: 16, color: { argb: 'FF1D4ED8' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Bộ lọc
      sheet.mergeCells('A2:J2');
      const filterCell = sheet.getCell('A2');
      filterCell.value = `Khu vực: ${filterKhuVuc} | NVBH: ${filterNVBH} | Thứ: ${filterThu} | Tần suất: ${filterTanSuat} | Cập nhật: ${ngayFmt}`;
      filterCell.font = { italic: true, size: 11, color: { argb: 'FF64748B' } };
      filterCell.alignment = { horizontal: 'center' };

      // Định dạng Header Table (Dòng 4)
      const headerRow = sheet.getRow(4);
      headerRow.height = 25;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Thêm dữ liệu
      filteredData.forEach((r, idx) => {
        const row = sheet.addRow({
          stt: idx + 1,
          khu_vuc: r.Khu_Vực,
          nvbh: r.Mã_Tên_NVBH,
          ma_kh: r.Mã_KH,
          ten_kh: r.Tên_KH,
          dc: r.Địa_Chỉ,
          thu: r.Thứ,
          tan_suat: r.Tần_Suất,
          trung_bay: r.Trưng_Bày || '',
          ngay_dh_cuoi: r.Ngày_ĐH_Cuối ? new Date(r.Ngày_ĐH_Cuối).toLocaleDateString('vi-VN') : '-',
        });

        // Kẻ khung và định dạng dòng dữ liệu
        row.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle' };
        });
        row.getCell('stt').alignment = { horizontal: 'center' };
        row.getCell('ma_kh').alignment = { horizontal: 'center' };
        row.getCell('thu').alignment = { horizontal: 'center' };
        row.getCell('tan_suat').alignment = { horizontal: 'center' };
        row.getCell('trung_bay').alignment = { horizontal: 'center' };
        row.getCell('ngay_dh_cuoi').alignment = { horizontal: 'center' };
      });

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `KH_KPSDS_${new Date().getTime()}.xlsx`);
      
      message.success('Đã xuất file Excel thành công!');
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleCapture = async () => {
    if (!filters.nvbh || filters.thu.length === 0) {
      modal.warning({ title: 'Chưa đủ điều kiện', content: 'Vui lòng lọc 1 NVBH và ít nhất 1 Thứ.' });
      return;
    }
    
    setCapturing(true);
    const msgKey = 'capturing';
    message.loading({ content: 'Đang tạo báo cáo hình ảnh...', key: msgKey });

    try {
      const { domToPng } = await import('modern-screenshot');
      
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed; left:-9999px; top:0; width:1200px; background:#fff; padding:40px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; opacity: 1;';
      
      const ngayFormatted = ngayUpdate ? new Date(ngayUpdate).toLocaleDateString('vi-VN') : '';
      const timestamp = new Date().toLocaleString('vi-VN');
      
      container.innerHTML = `
        <div style="margin-bottom: 35px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 800;">BÁO CÁO KHÁCH HÀNG KPSDS</h1>
            </div>
            <div style="text-align: right; color: #64748b; font-size: 13px;">
              <div>Ngày báo cáo: <strong>${timestamp}</strong></div>
              <div>Dữ liệu cập nhật: <strong>${ngayFormatted}</strong></div>
            </div>
          </div>
          <div style="margin-top: 15px; display: flex; gap: 20px; font-size: 15px; color: #334155;">
            <div style="background: #eff6ff; padding: 6px 12px; border-radius: 6px; border: 1px solid #dbeafe;">
              NVBH: <strong style="color: #1d4ed8;">${filters.nvbh}</strong>
            </div>
            <div style="background: #f8fafc; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
              Tuyến Thứ: <strong style="color: #475569;">${filters.thu.join(', ')}</strong>
            </div>
          </div>
        </div>

        <table style="border-collapse: collapse; width: 100%; font-size: 13px; color: #334155;">
          <thead>
            <tr style="background: #2563eb;">
              ${['STT', 'Mã KH', 'Tên khách hàng', 'Địa chỉ', 'Thứ', 'Tần suất', 'Trưng bày', 'Ngày ĐH'].map(h => 
                `<th style="padding: 12px 10px; text-align: left; font-weight: 600; color: #ffffff; border: 1px solid #2563eb;">${h}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((r, i) => `
              <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center; color: #94a3b8;">${i + 1}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: 700; color: #2563eb;">${r.Mã_KH}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: 500; color: #1e293b;">${r.Tên_KH}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; font-size: 12px; color: #64748b; line-height: 1.4;">${r.Địa_Chỉ}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">${r.Thứ}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">${r.Tần_Suất}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center; font-size: 11px;">${r.Trưng_Bày || '-'}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">${r.Ngày_ĐH_Cuối ? new Date(r.Ngày_ĐH_Cuối).toLocaleDateString('vi-VN') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          <div style="color: #94a3b8; font-size: 11px; font-style: italic;">
            Báo cáo được trích xuất tự động từ hệ thống DMS Report V4
          </div>
          <div style="color: #cbd5e1; font-size: 12px; font-weight: 700; letter-spacing: 0.1em;">
            CONFIDENTIAL
          </div>
        </div>
      `;
      
      document.body.appendChild(container);
      
      // Đợi render hoàn toàn nội dung
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await domToPng(container, {
        scale: 3,
        backgroundColor: '#ffffff',
      });
      
      document.body.removeChild(container);
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        message.success({ content: 'Đã copy báo cáo hiện đại vào clipboard!', key: msgKey });
      }
    } catch (err) {
      console.error(err);
      message.error({ content: 'Lỗi tạo ảnh báo cáo', key: msgKey });
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Flex vertical gap={16} className="h-full">
      <div>
        <KPSDSFilters
          filters={filters}
          options={options}
          onChange={handleFilterChange}
          onReload={fetchData}
          loading={loading}
        />
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-1" />

      <div className="flex-1 overflow-hidden">
        <KPSDSTable
          data={filteredData}
          loading={loading}
          pendingStatus={pendingStatus}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={setSelectedRowKeys}
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
            Tải lại
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExportExcel}
            loading={exporting}
            disabled={filteredData.length === 0}
            className="rounded-lg shadow-sm"
          >
            Xuất Excel
          </Button>
          <Button 
            icon={<CameraOutlined />} 
            onClick={handleCapture}
            loading={capturing}
            className="rounded-lg shadow-sm"
          >
            Chụp ảnh
          </Button>
          <Button 
            icon={<PauseCircleOutlined />} 
            danger={selectedRowKeys.length > 0}
            type={selectedRowKeys.length > 0 ? 'primary' : 'default'}
            className="rounded-lg shadow-sm"
            onClick={handleTamNgung}
            loading={loading}
            disabled={selectedRowKeys.length === 0}
          >
            Tạm ngưng {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
          </Button>
        </Space>
      </Flex>
    </Flex>
  );
}
