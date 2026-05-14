'use client';

import React from 'react';
import { Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { KHRecord } from '../types';
import { PAGE_SIZE_OPTIONS } from '@/constants';
import { TABLE_CONFIG, TABLE_SCROLL_X } from '@/constants/table-config';

const { Text } = Typography;

interface KPSDSTableProps {
  data: KHRecord[];
  loading: boolean;
  pendingStatus: Record<string, { status: string, date: string | null }>;
  selectedRowKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  hideSelection?: boolean;
}

export function KPSDSTable({ 
  data, 
  loading, 
  pendingStatus, 
  selectedRowKeys, 
  onSelectionChange,
  pageSize,
  onPageSizeChange,
  hideSelection = false
}: KPSDSTableProps) {
  const columns: ColumnsType<KHRecord> = [
    { 
      title: 'STT', 
      key: 'stt', 
      width: TABLE_CONFIG.COL_STT, 
      align: 'center', 
      fixed: 'left',
      render: (_, __, i) => i + 1 
    },
    { 
      title: 'NVBH', 
      dataIndex: 'Mã_Tên_NVBH', 
      key: 'Mã_Tên_NVBH', 
      width: TABLE_CONFIG.COL_NVBH, 
      ellipsis: true 
    },
    {
      title: 'Mã KH',
      dataIndex: 'Mã_KH',
      key: 'Mã_KH',
      width: TABLE_CONFIG.COL_MA_KH,
      render: (v) => <Text strong className="text-blue-600 text-[13px]">{v}</Text>
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'Tên_KH',
      key: 'Tên_KH',
      width: TABLE_CONFIG.COL_TEN_KH,
      ellipsis: true,
      render: (v) => (
        <Tooltip title={v} mouseEnterDelay={0.5}>
          <Text className="text-[12px] text-gray-700">{v}</Text>
        </Tooltip>
      )
    },
    { 
      title: 'Địa chỉ', 
      key: 'Địa_Chỉ', 
      width: TABLE_CONFIG.COL_DIA_CHI,
      ellipsis: true,
      render: (_, r) => (
        <Tooltip title={r.Địa_Chỉ} mouseEnterDelay={0.5}>
          <div className="truncate text-[12px] text-gray-600">
            {r.Địa_Chỉ}
          </div>
        </Tooltip>
      )
    },
    { title: 'Thứ', dataIndex: 'Thứ', key: 'Thứ', width: TABLE_CONFIG.COL_THU, align: 'center' },
    { title: 'Tần suất', dataIndex: 'Tần_Suất', key: 'Tần_Suất', width: TABLE_CONFIG.COL_TAN_SUAT, align: 'center' },
    {
      title: 'Tạm ngưng', 
      key: 'trang_thai', 
      width: TABLE_CONFIG.COL_TRANG_THAI, 
      align: 'center',
      render: (_, r) => {
        const item = pendingStatus[r.Mã_KH];
        if (!item) return null;
        
        const status = item.status;

        if (status === 'Chờ duyệt') return <Tag color="orange" icon={<ClockCircleOutlined />} className="m-0 px-2 py-0.5 rounded-md font-medium text-[11px]">Chờ duyệt</Tag>;
        if (status === 'Đã duyệt') return <Tag color="green" icon={<CheckCircleOutlined />} className="m-0 px-2 py-0.5 rounded-md font-medium text-[11px]">Đã duyệt</Tag>;
        if (status === 'Từ chối') return <Tag color="red" icon={<CloseCircleOutlined />} className="m-0 px-2 py-0.5 rounded-md font-medium text-[11px]">Từ chối</Tag>;
        return null;
      }
    },
    { 
      title: 'Trưng bày', 
      key: 'Trưng_Bày', 
      width: TABLE_CONFIG.COL_TRUNG_BAY, 
      align: 'center',
      render: (_, r) => (
        <Tooltip title={r.Trưng_Bày} mouseEnterDelay={0.5}>
          <div className="truncate text-[12px] px-2">
            {r.Trưng_Bày}
          </div>
        </Tooltip>
      )
    },
    { title: 'Khu vực', dataIndex: 'Khu_Vực', key: 'Khu_Vực', width: TABLE_CONFIG.COL_KHU_VUC, align: 'center' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ant-table-wrapper .ant-table-thead > tr > th,
        .ant-table-wrapper .ant-table-tbody > tr > td,
        .ant-table-cell {
          white-space: nowrap !important;
          padding: 6px 8px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .ant-table-small .ant-table-thead > tr > th {
          text-align: center !important;
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
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }
      `}} />
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="Mã_KH"
        scroll={{ x: TABLE_SCROLL_X.STANDARD, y: TABLE_CONFIG.SCROLL_Y_STANDARD || 600 }}
        size="small"
        virtual
        rowSelection={hideSelection ? undefined : {
          selectedRowKeys,
          onChange: onSelectionChange,
          columnWidth: 50,
          getCheckboxProps: (r) => {
            const item = pendingStatus[r.Mã_KH];
            const isLocked = item && (item.status === 'Chờ duyệt' || item.status === 'Đã duyệt');
            return {
              disabled: isLocked,
            };
          }
        }}
        pagination={{
          pageSize: 300,
          showSizeChanger: false,
          showTotal: (total) => (
            <span>Tổng cộng: <b className="text-blue-600">{total}</b> khách hàng</span>
          ),
          position: ['bottomRight'],
          size: 'small'
        }}
        className="border border-gray-100 rounded-lg overflow-hidden shadow-sm"
        onRow={(record) => {
          const item = pendingStatus[record.Mã_KH];
          const isLocked = item && (item.status === 'Chờ duyệt' || item.status === 'Đã duyệt');
          return {
            onClick: () => {
              if (isLocked) return;
              const key = record.Mã_KH;
              const newKeys = [...selectedRowKeys];
              const idx = newKeys.indexOf(key);
              if (idx >= 0) newKeys.splice(idx, 1);
              else newKeys.push(key);
              onSelectionChange(newKeys);
            },
            className: isLocked 
              ? 'opacity-60 cursor-not-allowed bg-gray-50/30' 
              : 'cursor-pointer hover:bg-blue-50/30 transition-colors',
          };
        }}
      />
    </>
  );
}
