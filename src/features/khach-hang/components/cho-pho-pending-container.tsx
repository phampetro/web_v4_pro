'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flex, App, Button, Modal, Space, Select, Tag, Input, Typography } from 'antd';
import { 
  DownloadOutlined, 
  ReloadOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ChoPhoPendingTable } from './cho-pho-pending-table';
import { getChoPhoPending, PendingChoPhoItem } from '../actions/get-cho-pho-pending';
import { approveChoPho } from '../actions/approve-cho-pho';
import { deleteChoPho } from '../actions/delete-cho-pho';
import { DEFAULT_PAGE_SIZE } from '@/constants';

const { Text } = Typography;

export function ChoPhoPendingContainer() {
  const { message, modal } = App.useApp();
  const [data, setData] = useState<PendingChoPhoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  
  const [filters, setFilters] = useState({
    khuVuc: undefined as string | undefined,
    nvbh: undefined as string | undefined,
    trangThai: 'Chờ duyệt' as string | undefined,
    searchText: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getChoPhoPending();
      if ('error' in res) throw new Error(res.error);
      setData(res);
    } catch (err: any) {
      message.error(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Options
  const options = useMemo(() => {
    const khuVuc = Array.from(new Set(data.map(r => r.Khu_vuc))).filter(Boolean).sort().map(v => ({ label: v, value: v }));
    const nvbh = Array.from(new Set(data.map(r => r.NVBH))).filter(Boolean).sort().map(v => ({ label: v, value: v }));
    return { khuVuc, nvbh };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(r => {
      if (filters.khuVuc && r.Khu_vuc !== filters.khuVuc) return false;
      if (filters.nvbh && r.NVBH !== filters.nvbh) return false;
      if (filters.trangThai && r.Trang_thai_duyet !== filters.trangThai) return false;
      if (filters.searchText) {
        const search = filters.searchText.toLowerCase();
        return r.Ma_KH.toLowerCase().includes(search) || r.Ten_KH.toLowerCase().includes(search);
      }
      return true;
    });
  }, [data, filters]);

  const handleApprove = (status: 'Đã duyệt' | 'Từ chối') => {
    if (selectedRowKeys.length === 0) return;

    modal.confirm({
      title: `Xác nhận ${status.toLowerCase()}`,
      content: `Bạn có chắc chắn muốn ${status.toLowerCase()} ${selectedRowKeys.length} yêu cầu đã chọn?`,
      centered: true,
      onOk: async () => {
        setSubmitting(true);
        try {
          const res = await approveChoPho({ 
            ids: selectedRowKeys as number[], 
            status 
          });
          if (res.success) {
            message.success(`Đã xử lý thành công!`);
            setSelectedRowKeys([]);
            fetchData();
          } else {
            message.error(res.error || 'Lỗi xử lý');
          }
        } catch (err) {
          message.error('Lỗi kết nối server');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const handleExportExcel = async () => {
    if (filteredData.length === 0) return;
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Duyệt Chợ Phố');

      // Title
      worksheet.mergeCells('A1:K1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'BÁO CÁO DUYỆT THAY ĐỔI CHỢ - PHỐ';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1D4ED8' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Filters
      worksheet.mergeCells('A2:K2');
      const filterCell = worksheet.getCell('A2');
      filterCell.value = `Khu vực: ${filters.khuVuc || 'Tất cả'} | NVBH: ${filters.nvbh || 'Tất cả'} | Trạng thái: ${filters.trangThai || 'Tất cả'}`;
      filterCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF64748B' } };
      filterCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Header
      const headerRow = worksheet.getRow(4);
      headerRow.height = 25;
      headerRow.values = ['STT', 'Khu vực', 'NVBH', 'Mã KH', 'Tên KH', 'Địa chỉ', 'Giá trị cũ', 'Giá trị mới', 'Người ĐK', 'Ngày ĐK', 'Trạng thái'];
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      worksheet.columns = [
        { key: 'stt', width: 5 },
        { key: 'khu_vuc', width: 12 },
        { key: 'nvbh', width: 25 },
        { key: 'ma_kh', width: 12 },
        { key: 'ten_kh', width: 25 },
        { key: 'dc', width: 35 },
        { key: 'old', width: 15 },
        { key: 'new', width: 15 },
        { key: 'nguoi_dk', width: 15 },
        { key: 'ngay_dk', width: 20 },
        { key: 'status', width: 15 },
      ];

      filteredData.forEach((r, i) => {
        const row = worksheet.addRow({
          stt: i + 1,
          khu_vuc: r.Khu_vuc,
          nvbh: r.NVBH,
          ma_kh: r.Ma_KH,
          ten_kh: r.Ten_KH,
          dc: r.Dia_chi,
          old: r.Gia_tri_cu,
          new: r.Gia_tri_moi,
          nguoi_dk: r.Nguoi_dang_ky,
          ngay_dk: r.Ngay_dang_ky,
          status: r.Trang_thai_duyet
        });
        row.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle' };
        });
        ['stt', 'ma_kh', 'ngay_dk', 'status'].forEach(k => row.getCell(k).alignment = { horizontal: 'center' });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `DuyetChoPho_${new Date().getTime()}.xlsx`);
      message.success('Đã xuất file Excel!');
    } catch (e) {
      message.error('Lỗi xuất Excel');
    }
  };

  const handleDelete = async () => {
    if (selectedRowKeys.length === 0) return;

    modal.confirm({
      title: 'Xác nhận xóa yêu cầu',
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} yêu cầu đã chọn? Lưu ý: Chỉ xóa được các đơn "Chờ duyệt".`,
      okType: 'danger',
      centered: true,
      onOk: async () => {
        setSubmitting(true);
        try {
          const res = await deleteChoPho(selectedRowKeys as number[]);
          if (res.success) {
            message.success(`Đã xóa thành công ${res.deleted} yêu cầu!`);
            setSelectedRowKeys([]);
            fetchData();
          } else {
            message.error(res.error || 'Lỗi khi xóa');
          }
        } catch (err) {
          message.error('Lỗi kết nối server');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  return (
    <Flex vertical gap={16} className="h-full">
      <div>
        <Flex gap={16} align="end" className="py-2">
          <div className="flex-1 min-w-[160px]">
            <Text type="secondary" className="text-xs block mb-1">Khu vực</Text>
            <Select
              placeholder="Tất cả"
              allowClear
              showSearch
              className="w-full"
              options={options.khuVuc}
              value={filters.khuVuc}
              onChange={v => setFilters(p => ({ ...p, khuVuc: v }))}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <Text type="secondary" className="text-xs block mb-1">NVBH</Text>
            <Select
              placeholder="Tất cả"
              allowClear
              showSearch
              className="w-full"
              options={options.nvbh}
              value={filters.nvbh}
              onChange={v => setFilters(p => ({ ...p, nvbh: v }))}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <Text type="secondary" className="text-xs block mb-1">Trạng thái</Text>
            <Select
              placeholder="Tất cả"
              className="w-full"
              options={[
                { label: 'Chờ duyệt', value: 'Chờ duyệt' },
                { label: 'Đã duyệt', value: 'Đã duyệt' },
                { label: 'Từ chối', value: 'Từ chối' },
              ]}
              value={filters.trangThai}
              onChange={v => setFilters(p => ({ ...p, trangThai: v }))}
              allowClear
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <Text type="secondary" className="text-xs block mb-1">Tìm kiếm</Text>
            <Input
              placeholder="Mã/Tên khách hàng..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={filters.searchText}
              onChange={e => setFilters(p => ({ ...p, searchText: e.target.value }))}
              allowClear
            />
          </div>
        </Flex>
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-1" />

      <div className="flex-1 overflow-hidden">
        <ChoPhoPendingTable 
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
            onClick={fetchData} 
            loading={loading}
            className="rounded-lg shadow-sm"
          >
            Tải lại
          </Button>

          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExportExcel}
            className="rounded-lg shadow-sm"
          >
            Xuất Excel
          </Button>
          
          <Button 
            icon={<CheckCircleOutlined />} 
            type="primary" 
            onClick={() => handleApprove('Đã duyệt')}
            disabled={selectedRowKeys.length === 0}
            loading={submitting}
            className="bg-green-600 hover:bg-green-700 rounded-lg shadow-sm border-none"
          >
            Duyệt {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
          </Button>

          <Button 
            icon={<CloseCircleOutlined />} 
            danger 
            type="primary"
            onClick={() => handleApprove('Từ chối')}
            disabled={selectedRowKeys.length === 0}
            loading={submitting}
            className="rounded-lg shadow-sm"
          >
            Từ chối
          </Button>

          <Button 
            icon={<DeleteOutlined />} 
            danger
            onClick={handleDelete}
            disabled={selectedRowKeys.length === 0}
            loading={submitting}
            className="rounded-lg shadow-sm ml-auto"
          >
            Xóa yêu cầu
          </Button>

        </Space>
      </Flex>
    </Flex>
  );
}
