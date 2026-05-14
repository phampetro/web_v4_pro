'use client';

import React, { useMemo } from 'react';
import { Table, Tag, Tooltip, Typography, Flex } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { ChinhtuyenRecord } from '../types';
import { TABLE_CONFIG, TABLE_SCROLL_X } from '@/constants/table-config';

const { Text } = Typography;

interface ChinhtuyenTableProps {
  data: ChinhtuyenRecord[];
  loading: boolean;
  selectedRowKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export function ChinhtuyenTable({
  data,
  loading,
  selectedRowKeys,
  onSelectionChange,
}: ChinhtuyenTableProps) {
  const columns: ColumnsType<ChinhtuyenRecord> = useMemo(() => [
    { 
      title: 'STT', 
      key: 'stt', 
      width: TABLE_CONFIG.COL_STT, 
      align: 'center', 
      render: (_, __, i) => <Text className="text-[11px] text-gray-500">{i + 1}</Text> 
    },
    {
      title: 'Khu vực',
      dataIndex: 'Khu_vuc',
      key: 'khu_vuc',
      width: TABLE_CONFIG.COL_KHU_VUC,
      align: 'center',
      render: (val) => <div className="truncate whitespace-nowrap text-[11px] text-gray-500">{val}</div>
    },
    {
      title: 'Khách hàng / Địa chỉ',
      key: 'kh_info',
      width: TABLE_CONFIG.COL_TEN_KH + 120,
      render: (_, r) => (
        <div className="py-1 overflow-hidden">
          <Tooltip title={`${r.Ma_KH} - ${r.Ten_KH}`} mouseEnterDelay={0.5}>
            <div className="flex items-center gap-1.5 leading-none mb-1 truncate whitespace-nowrap">
              <Text strong className="text-blue-600 text-[13px] shrink-0">{r.Ma_KH}</Text>
              <Text className="text-[12px] text-gray-700 truncate">— {r.Ten_KH}</Text>
            </div>
          </Tooltip>
          <Tooltip title={r.DC}>
            <div className="truncate whitespace-nowrap text-[11px] text-gray-400 font-light">{r.DC}</div>
          </Tooltip>
        </div>
      )
    },
    {
      title: 'Thông tin Tuyến (Cũ → Mới)',
      key: 'tuyen_compare',
      width: 320,
      render: (_, r) => (
        <div className="py-1 relative pl-3 overflow-hidden">
          <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-100 rounded-full" />
          <div className="flex items-center gap-2 mb-1 leading-none opacity-50 truncate whitespace-nowrap">
            <span className="text-[9px] font-bold text-gray-400 w-6 shrink-0">CŨ</span>
            <Text className="text-[12px] text-gray-500 italic truncate">
              {r.Ma_ten_nvbh_CU} | {r.Thu_CU} | {r.Tan_suat_CU}
            </Text>
          </div>
          <div className="flex items-center gap-2 leading-none truncate whitespace-nowrap">
            <span className="text-[9px] font-bold text-blue-500 w-6 shrink-0">MỚI</span>
            <Text strong className="text-[12px] text-blue-600 truncate">
              {r.Ma_ten_nvbh_MOI} | {r.Thu_MOI} | {r.Tan_suat_MOI}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Trang_thai_duyet',
      key: 'trang_thai',
      width: TABLE_CONFIG.COL_TRANG_THAI,
      align: 'center',
      render: (status) => {
        const config: Record<string, { color: string, icon: any }> = {
          'Chờ duyệt': { color: 'orange', icon: <ClockCircleOutlined /> },
          'Đã duyệt': { color: 'green', icon: <CheckCircleOutlined /> },
          'Từ chối': { color: 'red', icon: <CloseCircleOutlined /> },
        };
        const { color, icon } = config[status] || { color: 'default', icon: null };
        return (
          <Tag variant="filled" color={color} icon={icon} className="m-0 text-[10px] px-2 py-0.5 rounded-md font-medium">
            {status}
          </Tag>
        );
      }
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'Ngay_dang_ky',
      key: 'ngay_dk',
      width: TABLE_CONFIG.COL_NGAY_GIO,
      align: 'center',
      render: (val) => (
        <Flex vertical gap={0} align="center">
          <Text className="text-[11px] text-gray-500 whitespace-nowrap">{new Date(val).toLocaleDateString('vi-VN')}</Text>
          <Text className="text-[10px] text-gray-300 whitespace-nowrap">{new Date(val).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
        </Flex>
      )
    }
  ], []);

  return (
    <>
      <Table
        className="border border-gray-100 rounded-lg overflow-hidden flex-1"
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="ID"
        scroll={{ x: 'max-content', y: TABLE_CONFIG.SCROLL_Y_STANDARD }}
        size="small"
        rowSelection={{
          selectedRowKeys,
          onChange: onSelectionChange,
          columnWidth: TABLE_CONFIG.COL_SELECT,
        }}
        pagination={{
          pageSize: 300,
          showSizeChanger: false,
          showTotal: (total) => (
            <span className="text-[11px] text-gray-500">Tổng cộng: <b className="text-blue-600">{total}</b> yêu cầu duyệt</span>
          ),
          placement: ['bottomRight'],
          size: 'small'
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
        .ant-table-wrapper .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          text-align: center !important;
          padding: 8px 4px !important;
        }
        .ant-table-wrapper .ant-table-tbody > tr > td {
          white-space: nowrap !important;
          padding: 4px 8px !important;
          vertical-align: middle !important;
        }
        .ant-table-small {
          font-size: 12px !important;
        }
        /* Cấu hình phân trang chuyên nghiệp */
        .ant-table-pagination.ant-pagination {
          margin: 12px 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
        }
        .ant-pagination-total-text {
          margin-right: auto !important;
        }
      `}} />
    </>
  );
}
