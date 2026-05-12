'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flex, App, Button, Space, Modal } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TamNgungFilters } from './tam-ngung-filters';
import { TamNgungTable } from './tam-ngung-table';
import { TamNgungRecord } from '../types';
import { getTamNgung } from '../actions/get-tam-ngung';
import { approveTamNgung } from '../actions/approve-tam-ngung';
import { deleteTamNgung } from '../actions/delete-tam-ngung';
import { DEFAULT_PAGE_SIZE } from '@/constants';

export function TamNgungContainer() {
  const { message, modal } = App.useApp();
  const [data, setData] = useState<TamNgungRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [filters, setFilters] = useState({
    khuVuc: undefined as string | undefined,
    nvbh: undefined as string | undefined,
    trangThai: 'Chờ duyệt' as string | undefined,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTamNgung();
      
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
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tự động gỡ chọn các bản ghi không còn là "Chờ duyệt"
  useEffect(() => {
    if (selectedRowKeys.length > 0) {
      const validIds = data
        .filter(r => r.Trang_thai_duyet === 'Chờ duyệt')
        .map(r => r.ID);
      
      const filteredKeys = selectedRowKeys.filter(key => validIds.includes(key as number));
      
      if (filteredKeys.length !== selectedRowKeys.length) {
        setSelectedRowKeys(filteredKeys);
      }
    }
  }, [data, selectedRowKeys]);

  const options = useMemo(() => {
    const khuVuc = Array.from(new Set(data.map(r => r.Khu_vuc))).filter(Boolean).sort().map(v => ({ label: v, value: v }));
    
    let filteredForNVBH = data;
    if (filters.khuVuc) filteredForNVBH = data.filter(r => r.Khu_vuc === filters.khuVuc);
    const nvbh = Array.from(new Set(filteredForNVBH.map(r => r.Ma_ten_nvbh))).filter(Boolean).sort().map(v => ({ label: v, value: v }));

    return { khuVuc, nvbh };
  }, [data, filters.khuVuc]);

  const filteredData = useMemo(() => {
    return data.filter(r => {
      if (filters.khuVuc && r.Khu_vuc !== filters.khuVuc) return false;
      if (filters.nvbh && r.Ma_ten_nvbh !== filters.nvbh) return false;
      if (filters.trangThai && r.Trang_thai_duyet !== filters.trangThai) return false;
      return true;
    });
  }, [data, filters]);

  const handleApprove = async (trangThai: 'Đã duyệt' | 'Từ chối') => {
    if (selectedRowKeys.length === 0) return;
    
    modal.confirm({
      title: `Xác nhận ${trangThai === 'Đã duyệt' ? 'Duyệt' : 'Từ chối'}`,
      content: `Bạn có chắc chắn muốn ${trangThai === 'Đã duyệt' ? 'Duyệt' : 'Từ chối'} ${selectedRowKeys.length} yêu cầu đã chọn?`,
      icon: <ExclamationCircleOutlined />,
      centered: true,
      onOk: async () => {
        setLoading(true);
        try {
          const result = await approveTamNgung({
            ids: selectedRowKeys as number[],
            trang_thai: trangThai,
          });
          
          if ('error' in result) {
            message.error(result.error);
          } else {
            message.success(`${trangThai} thành công ${result.updated} bản ghi`);
            setSelectedRowKeys([]);
            fetchData();
          }
        } catch {
          message.error('Lỗi hệ thống');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleDelete = async () => {
    if (selectedRowKeys.length === 0) return;

    modal.confirm({
      title: 'Xác nhận xóa yêu cầu',
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} yêu cầu đã chọn? Lưu ý: Chỉ xóa được các đơn "Chờ duyệt".`,
      okType: 'danger',
      centered: true,
      onOk: async () => {
        setLoading(true);
        try {
          const result = await deleteTamNgung(selectedRowKeys as number[]);
          if ('error' in result) {
            message.error(result.error);
          } else {
            message.success(`Đã xóa thành công ${result.deleted} yêu cầu`);
            setSelectedRowKeys([]);
            fetchData();
          }
        } catch {
          message.error('Lỗi hệ thống');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Duyệt Tạm Ngưng');

      // 1. Tiêu đề báo cáo
      worksheet.mergeCells('A1:K1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'BÁO CÁO DANH SÁCH DUYỆT TẠM NGƯNG';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1D4ED8' } }; // Blue-700
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // 2. Thông tin bộ lọc
      worksheet.mergeCells('A2:K2');
      const filterCell = worksheet.getCell('A2');
      filterCell.value = `Khu vực: ${filters.khuVuc || 'Tất cả'} | NVBH: ${filters.nvbh || 'Tất cả'} | Trạng thái: ${filters.trangThai || 'Tất cả'}`;
      filterCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF64748B' } }; // Slate-500
      filterCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // 3. Header bảng
      const headerRow = worksheet.getRow(4);
      headerRow.height = 25;
      headerRow.values = [
        'STT', 'Khu vực', 'NVBH', 'Mã KH', 'Tên KH', 'Địa chỉ', 'Trạng thái', 'Người ĐK', 'Ngày ĐK', 'Người Duyệt', 'Ngày Duyệt'
      ];
      
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Blue-600
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      worksheet.columns = [
        { key: 'stt', width: 5 },
        { key: 'Khu_vuc', width: 12 },
        { key: 'Ma_ten_nvbh', width: 25 },
        { key: 'Ma_KH', width: 12 },
        { key: 'Ten_KH', width: 30 },
        { key: 'DC', width: 40 },
        { key: 'Trang_thai_duyet', width: 15 },
        { key: 'Nguoi_dang_ky', width: 15 },
        { key: 'Ngay_dang_ky', width: 20 },
        { key: 'Nguoi_duyet', width: 15 },
        { key: 'Ngay_duyet', width: 20 },
      ];

      // 4. Đổ dữ liệu
      filteredData.forEach((r, i) => {
        const row = worksheet.addRow({
          stt: i + 1,
          Khu_vuc: r.Khu_vuc,
          Ma_ten_nvbh: r.Ma_ten_nvbh,
          Ma_KH: r.Ma_KH,
          Ten_KH: r.Ten_KH,
          DC: r.DC,
          Trang_thai_duyet: r.Trang_thai_duyet,
          Nguoi_dang_ky: r.Nguoi_dang_ky,
          Ngay_dang_ky: r.Ngay_dang_ky,
          Nguoi_duyet: r.Nguoi_duyet || '-',
          Ngay_duyet: r.Ngay_duyet || '-',
        });

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', wrapText: false };
        });
        
        // Căn giữa một số cột
        row.getCell('stt').alignment = { horizontal: 'center' };
        row.getCell('Trang_thai_duyet').alignment = { horizontal: 'center' };
        row.getCell('Ngay_dang_ky').alignment = { horizontal: 'center' };
        row.getCell('Ngay_duyet').alignment = { horizontal: 'center' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Duyet_Tam_Ngung_${new Date().getTime()}.xlsx`);
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
        <TamNgungFilters
          filters={filters}
          options={options}
          onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
          onReload={fetchData}
          loading={loading}
        />
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-1" />

      <div className="flex-1 overflow-hidden">
        <TamNgungTable
          data={filteredData}
          loading={loading}
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
            onClick={() => fetchData()} 
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
          
          <Button 
            icon={<CheckCircleOutlined />} 
            type="primary" 
            onClick={() => handleApprove('Đã duyệt')}
            disabled={selectedRowKeys.length === 0}
            className="bg-green-600 hover:bg-green-700 rounded-lg shadow-sm border-none ml-4"
          >
            Duyệt {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
          </Button>

          <Button 
            icon={<CloseCircleOutlined />} 
            danger 
            type="primary"
            onClick={() => handleApprove('Từ chối')}
            disabled={selectedRowKeys.length === 0}
            className="rounded-lg shadow-sm"
          >
            Từ chối
          </Button>

          <Button 
            icon={<DeleteOutlined />} 
            onClick={handleDelete}
            disabled={selectedRowKeys.length === 0}
            className="rounded-lg shadow-sm"
          >
            Xóa
          </Button>
        </Space>
      </Flex>
    </Flex>
  );
}
