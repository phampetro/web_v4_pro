'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flex, App, Button, Typography, Modal, Space } from 'antd';
import { 
  DownloadOutlined, 
  ReloadOutlined, 
  SendOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ChoPhoFilters } from './cho-pho-filters';
import { ChoPhoTable } from './cho-pho-table';
import { KHRecord } from '../types';
import { getKPSDS } from '../actions/get-kpsds';
import { getChoPhoStatuses } from '../actions/get-cho-pho-statuses';
import { getChoPho } from '../actions/get-cho-pho';
import { saveChoPho, ChoPhoRequest } from '../actions/save-cho-pho';
import { DEFAULT_PAGE_SIZE, THU_LIST } from '@/constants';

const { Title, Text } = Typography;

export function ChoPhoContainer() {
  const { message, modal } = App.useApp();
  const [baseData, setBaseData] = useState<KHRecord[]>([]);
  const [choPhoMap, setChoPhoMap] = useState<Record<string, string>>({});
  const [pendingInDB, setPendingInDB] = useState<Record<string, { val: string, status: string }>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [ngayUpdate, setNgayUpdate] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const dayIdx = new Date().getDay();
  const todayThu = THU_LIST[(dayIdx + 6) % 7];
  const [filters, setFilters] = useState({
    khuVuc: undefined as string | undefined,
    nvbh: undefined as string | undefined,
    kh: undefined as string | undefined,
    thu: [todayThu] as string[],
  });

  const fetchData = useCallback(async (isReload = false) => {
    setLoading(true);
    try {
      const [resKpsds, resChoPho, resStatuses] = await Promise.all([
        getKPSDS(),
        getChoPho(),
        getChoPhoStatuses()
      ]);

      if ('error' in resKpsds) throw new Error(resKpsds.error);
      if ('error' in resChoPho) throw new Error(resChoPho.error);
      if ('error' in resStatuses) throw new Error(resStatuses.error);

      setBaseData(resKpsds.data);
      setNgayUpdate(resKpsds.ngayUpdate);

      const cpMap: Record<string, string> = {};
      resChoPho.data.forEach(item => {
        cpMap[item.MA_KH] = item.TRENDUONG_TRONGCHO;
      });
      setChoPhoMap(cpMap);

      const dbMap: Record<string, { val: string, status: string }> = {};
      resStatuses.forEach(p => {
        dbMap[p.Ma_KH] = { val: p.Gia_tri_moi, status: p.Trang_thai_duyet };
      });
      setPendingInDB(dbMap);

      if (isReload) {
        message.success('Đã làm mới dữ liệu thành công!');
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tự động gỡ chọn nếu không có thay đổi hoặc đang chờ duyệt
  useEffect(() => {
    if (selectedRowKeys.length > 0) {
      const filteredKeys = selectedRowKeys.filter(key => {
        const maKH = key as string;
        const dbStatus = pendingInDB[maKH];
        const isPending = dbStatus?.status === 'Chờ duyệt';
        const hasChange = pendingChanges[maKH] && pendingChanges[maKH] !== choPhoMap[maKH];
        
        return !isPending && hasChange;
      });
      
      if (filteredKeys.length !== selectedRowKeys.length) {
        setSelectedRowKeys(filteredKeys);
      }
    }
  }, [pendingChanges, pendingInDB, selectedRowKeys, choPhoMap]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key === 'khuVuc') {
        newFilters.nvbh = undefined;
        newFilters.kh = undefined;
      }
      if (key === 'nvbh') {
        newFilters.kh = undefined;
      }
      return newFilters;
    });
  };

  const filteredData = useMemo(() => {
    return baseData.filter(r => {
      if (filters.khuVuc && r.Khu_Vực !== filters.khuVuc) return false;
      if (filters.nvbh && r.Mã_Tên_NVBH !== filters.nvbh) return false;
      if (filters.kh && r.Mã_KH !== filters.kh) return false;
      if (filters.thu.length > 0 && !filters.thu.some(t => r.Thứ.includes(t))) return false;
      return true;
    });
  }, [baseData, filters]);

  const handleStatusChange = (maKH: string, val: string) => {
    setPendingChanges(prev => ({ ...prev, [maKH]: val }));
    const originalVal = choPhoMap[maKH] || '';
    if (val !== originalVal) {
      setSelectedRowKeys(prev => prev.includes(maKH) ? prev : [...prev, maKH]);
    } else {
      setSelectedRowKeys(prev => prev.filter(k => k !== maKH));
    }
  };

  const handleSubmit = async () => {
    const selectedRows = filteredData.filter(r => selectedRowKeys.includes(r.Mã_KH));
    const requests: ChoPhoRequest[] = selectedRows.map(r => ({
      maKH: r.Mã_KH,
      tenKH: r.Tên_KH,
      khuVuc: r.Khu_Vực,
      nvbh: r.Mã_Tên_NVBH,
      diaChi: r.Địa_Chỉ,
      thu: r.Thứ,
      oldVal: choPhoMap[r.Mã_KH] || '',
      newVal: pendingChanges[r.Mã_KH] || choPhoMap[r.Mã_KH] || ''
    }));

    if (requests.length === 0) return;

    modal.confirm({
      title: 'Xác nhận gửi đăng ký Chợ - Phố',
      centered: true,
      content: `Bạn đang gửi đăng ký cho ${requests.length} khách hàng.`,
      onOk: async () => {
        setSaving(true);
        try {
          const res = await saveChoPho(requests);
          if (res.success) {
            message.success(`Đã gửi thành công ${res.count} yêu cầu!`);
            setSelectedRowKeys([]);
            setPendingChanges({});
            // Refresh pending data
            const resStatuses = await getChoPhoStatuses();
            if (!('error' in resStatuses)) {
              const dbMap: Record<string, { val: string, status: string }> = {};
              resStatuses.forEach(p => {
                dbMap[p.Ma_KH] = { val: p.Gia_tri_moi, status: p.Trang_thai_duyet };
              });
              setPendingInDB(dbMap);
            }
          } else {
            message.error(res.error || 'Lỗi khi gửi yêu cầu');
          }
        } catch (err) {
          message.error('Lỗi kết nối máy chủ');
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleExportExcel = async () => {
    if (filteredData.length === 0) return;
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Danh sách Chợ Phố');
      
      sheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Khu vực', key: 'khu_vuc', width: 15 },
        { header: 'NVBH', key: 'nvbh', width: 30 },
        { header: 'Mã KH', key: 'ma_kh', width: 15 },
        { header: 'Tên KH', key: 'ten_kh', width: 35 },
        { header: 'Phố - Chợ', key: 'cho_pho', width: 20 },
        { header: 'Địa chỉ', key: 'dc', width: 50 },
        { header: 'Thứ', key: 'thu', width: 10 },
      ];

      // 1. Chèn 3 dòng trống lên đầu để lấy chỗ làm tiêu đề và bộ lọc
      sheet.spliceRows(1, 0, [], [], []);

      // 2. Tiêu đề báo cáo (Dòng 1)
      sheet.mergeCells('A1:H1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'DANH SÁCH KHÁCH HÀNG CHỢ - PHỐ';
      titleCell.font = { bold: true, size: 16, color: { argb: 'FF1D4ED8' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // 3. Bộ lọc (Dòng 2)
      sheet.mergeCells('A2:H2');
      const filterCell = sheet.getCell('A2');
      const filterKhuVuc = filters.khuVuc || 'Tất cả';
      const filterNVBH = filters.nvbh || 'Tất cả';
      const filterThu = filters.thu.length > 0 ? filters.thu.join(', ') : 'Tất cả';
      filterCell.value = `Khu vực: ${filterKhuVuc} | NVBH: ${filterNVBH} | Thứ: ${filterThu}`;
      filterCell.font = { italic: true, size: 11, color: { argb: 'FF64748B' } };
      filterCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // 4. Định dạng Header Table (Dòng 4 - đã bị đẩy xuống từ Row 1)
      const headerRow = sheet.getRow(4);
      headerRow.height = 25;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      filteredData.forEach((r, idx) => {
        const row = sheet.addRow({
          stt: idx + 1,
          khu_vuc: r.Khu_Vực,
          nvbh: r.Mã_Tên_NVBH,
          ma_kh: r.Mã_KH,
          ten_kh: r.Tên_KH,
          cho_pho: pendingInDB[r.Mã_KH]?.val || choPhoMap[r.Mã_KH] || '-',
          dc: r.Địa_Chỉ,
          thu: r.Thứ,
        });
        row.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle' };
        });
        row.getCell('stt').alignment = { horizontal: 'center' };
        row.getCell('ma_kh').alignment = { horizontal: 'center' };
        row.getCell('thu').alignment = { horizontal: 'center' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `KH_ChoPho_${new Date().getTime()}.xlsx`);
      message.success('Xuất Excel thành công!');
    } catch (e) {
      message.error('Lỗi xuất Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Flex vertical gap={16} className="h-full">
      <div>
        <ChoPhoFilters 
          data={baseData} 
          filters={filters} 
          onChange={handleFilterChange} 
        />
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-1" />

      <div className="flex-1 overflow-hidden">
        <ChoPhoTable 
          data={filteredData} 
          loading={loading}
          choPhoMap={choPhoMap}
          pendingInDB={pendingInDB}
          pendingChanges={pendingChanges}
          onStatusChange={handleStatusChange}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={setSelectedRowKeys}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Flex justify="start" align="center" className="mt-auto py-3 px-2 border-t border-gray-50 bg-white/50 backdrop-blur-sm">
        <Space size={12}>
          <Button 
            icon={<ReloadOutlined spin={loading} />} 
            onClick={() => fetchData(true)} 
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
            type="primary"
            icon={<SendOutlined />} 
            onClick={handleSubmit} 
            loading={saving} 
            disabled={selectedRowKeys.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 border-none shadow-md shadow-indigo-200 rounded-lg"
          >
            Gửi yêu cầu {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
          </Button>
        </Space>
      </Flex>
    </Flex>
  );
}
