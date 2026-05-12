'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flex, App, Button, Space, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { ChinhtuyenTable } from './chinhtuyen-table';
import { ChinhtuyenRecord } from '../types';
import { getChinhtuyen } from '../actions/get-chinhtuyen';
import { approveChinhtuyen } from '../actions/approve-chinhtuyen';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { ChinhtuyenFilters } from './chinhtuyen-filters';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;

export function ChinhtuyenContainer() {
  const { message, modal } = App.useApp();
  const [data, setData] = useState<ChinhtuyenRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [filters, setFilters] = useState({
    khuVuc: undefined as string | undefined,
    nvbh: undefined as string | undefined,
    kh: undefined as string | undefined,
    thu: undefined as string | undefined,
    tanSuat: undefined as string | undefined,
    trangThai: 'Chờ duyệt' as string | undefined,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'khuVuc') {
        next.nvbh = undefined;
        next.kh = undefined;
        next.thu = undefined;
        next.tanSuat = undefined;
      } else if (key === 'nvbh') {
        next.kh = undefined;
        next.thu = undefined;
        next.tanSuat = undefined;
      } else if (key === 'kh') {
        next.thu = undefined;
        next.tanSuat = undefined;
      }
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getChinhtuyen();

      if ('error' in result) {
        message.error(result.error);
      } else {
        setData(result.data);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter(r => {
      if (filters.khuVuc && r.Khu_vuc !== filters.khuVuc) return false;
      if (filters.nvbh && r.Ma_ten_nvbh_MOI !== filters.nvbh) return false;
      if (filters.kh && r.Ma_KH !== filters.kh) return false;
      if (filters.thu && r.Thu_MOI !== filters.thu) return false;
      if (filters.tanSuat && r.Tan_suat_MOI !== filters.tanSuat) return false;
      if (filters.trangThai && r.Trang_thai_duyet !== filters.trangThai) return false;
      return true;
    });
  }, [data, filters]);

  const options = useMemo(() => {
    const khuVucOptions = Array.from(new Set(data.map(r => r.Khu_vuc))).filter(Boolean).sort().map(v => ({ label: v, value: v }));

    let fNVBH = data;
    if (filters.khuVuc) fNVBH = data.filter(r => r.Khu_vuc === filters.khuVuc);
    const nvbhOptions = Array.from(new Set(fNVBH.map(r => r.Ma_ten_nvbh_MOI))).filter(Boolean).sort().map(v => ({ label: v, value: v }));

    let fKH = fNVBH;
    if (filters.nvbh) fKH = fNVBH.filter(r => r.Ma_ten_nvbh_MOI === filters.nvbh);
    const khOptions = Array.from(new Set(fKH.map(r => `${r.Ma_KH} - ${r.Ten_KH}`))).sort().map(v => ({ label: v, value: v.split(' - ')[0] }));

    let fThuTS = fKH;
    if (filters.kh) fThuTS = fKH.filter(r => r.Ma_KH === filters.kh);
    const thuOptions = Array.from(new Set(fThuTS.flatMap(r => r.Thu_MOI.split(',').map(t => t.trim())))).filter(Boolean).sort().map(v => ({ label: v, value: v }));
    const tanSuatOptions = Array.from(new Set(fThuTS.map(r => r.Tan_suat_MOI))).filter(Boolean).sort().map(v => ({ label: v, value: v }));

    return {
      khuVuc: khuVucOptions,
      nvbh: nvbhOptions,
      kh: khOptions,
      thu: thuOptions,
      tanSuat: tanSuatOptions
    };
  }, [data, filters.khuVuc, filters.nvbh, filters.kh]);

  const handleApprove = async (action: 'Đã duyệt' | 'Từ chối') => {
    if (selectedRowKeys.length === 0) return;

    modal.confirm({
      title: `${action === 'Đã duyệt' ? 'Duyệt' : 'Từ chối'} điều chỉnh tuyến cho ${selectedRowKeys.length} khách hàng?`,
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          const result = await approveChinhtuyen({
            ids: selectedRowKeys as number[],
            trang_thai: action,
            nguoi_duyet: 'Admin',
          });

          if (result.success) {
            message.success(result.message || 'Cập nhật thành công');
            setSelectedRowKeys([]);
            fetchData();
          } else {
            message.error(result.error || 'Lỗi khi cập nhật');
          }
        } catch {
          message.error('Lỗi hệ thống');
        }
      },
    });
  };

  const handleExportExcel = async () => {
    if (filteredData.length === 0) return;
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Điều chỉnh tuyến');

      sheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Khu vực', key: 'khu_vuc', width: 15 },
        { header: 'Mã KH', key: 'ma_kh', width: 12 },
        { header: 'Tên KH', key: 'ten_kh', width: 30 },
        { header: 'NVBH Cũ', key: 'nvbh_cu', width: 30 },
        { header: 'Thứ Cũ', key: 'thu_cu', width: 10 },
        { header: 'TS Cũ', key: 'ts_cu', width: 10 },
        { header: 'NVBH Mới', key: 'nvbh_moi', width: 30 },
        { header: 'Thứ Mới', key: 'thu_moi', width: 10 },
        { header: 'TS Mới', key: 'ts_moi', width: 10 },
        { header: 'Trạng thái', key: 'trang_thai', width: 15 },
      ];

      sheet.spliceRows(1, 0, [], [], []);

      sheet.mergeCells('A1:K1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'DANH SÁCH DUYỆT ĐIỀU CHỈNH TUYẾN BÁN HÀNG';
      titleCell.font = { bold: true, size: 16, color: { argb: 'FF1D4ED8' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.mergeCells('A2:K2');
      const filterCell = sheet.getCell('A2');
      filterCell.value = `Khu vực: ${filters.khuVuc || 'Tất cả'} | Trạng thái: ${filters.trangThai || 'Tất cả'} | Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`;
      filterCell.font = { italic: true, size: 11, color: { argb: 'FF64748B' } };
      filterCell.alignment = { horizontal: 'center' };

      const headerRow = sheet.getRow(4);
      headerRow.height = 25;
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      filteredData.forEach((r, idx) => {
        const row = sheet.addRow({
          stt: idx + 1,
          khu_vuc: r.Khu_vuc,
          ma_kh: r.Ma_KH,
          ten_kh: r.Ten_KH,
          nvbh_cu: r.Ma_ten_nvbh_CU,
          thu_cu: r.Thu_CU,
          ts_cu: r.Tan_suat_CU,
          nvbh_moi: r.Ma_ten_nvbh_MOI,
          thu_moi: r.Thu_MOI,
          ts_moi: r.Tan_suat_MOI,
          trang_thai: r.Trang_thai_duyet,
        });

        row.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle', wrapText: false };
        });
        row.getCell('stt').alignment = { horizontal: 'center' };
        row.getCell('ma_kh').alignment = { horizontal: 'center' };
        row.getCell('trang_thai').alignment = { horizontal: 'center' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Duyet_Dieu_Chinh_Tuyen_${new Date().getTime()}.xlsx`);
      message.success('Xuất Excel thành công');
    } catch (error) {
      message.error('Lỗi khi xuất Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Flex vertical gap={16} className="h-full">
      <div>
        <ChinhtuyenFilters
          filters={filters}
          options={options}
          onChange={handleFilterChange}
        />
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-1" />

      <div className="flex-1 overflow-hidden">
        <ChinhtuyenTable
          data={filteredData}
          loading={loading}
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
            className="rounded-lg shadow-sm"
          >
            Xuất Excel
          </Button>

          {selectedRowKeys.length > 0 && (
            <Space className="ml-4 pl-4 border-l border-gray-200">
              <Button
                icon={<CheckCircleOutlined />}
                type="primary"
                onClick={() => handleApprove('Đã duyệt')}
                className="bg-green-600 hover:bg-green-700 rounded-lg shadow-sm border-none"
              >
                Duyệt ({selectedRowKeys.length})
              </Button>
              <Button
                icon={<CloseCircleOutlined />}
                danger
                type="primary"
                onClick={() => handleApprove('Từ chối')}
                className="rounded-lg shadow-sm"
              >
                Từ chối
              </Button>
            </Space>
          )}
        </Space>
      </Flex>
    </Flex>
  );
}
