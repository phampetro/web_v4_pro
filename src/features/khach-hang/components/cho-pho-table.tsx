'use client';
// TEST CUOI CUNG: KIEM TRA QUYEN ADMINISTRATOR CUA GITHUB RUNNER


import React from 'react';
import { Table, Typography, Tooltip, Tag, Select } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { KHRecord } from '../types';
import { PAGE_SIZE_OPTIONS } from '@/constants';
import { TABLE_CONFIG, TABLE_SCROLL_X } from '@/constants/table-config';

const { Text } = Typography;

interface ChoPhoTableProps {
  data: KHRecord[];
  loading: boolean;
  choPhoMap: Record<string, string>;
  pendingInDB: Record<string, { val: string, status: string }>;
  pendingChanges: Record<string, string>;
  onStatusChange: (maKH: string, val: string) => void;
  selectedRowKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export function ChoPhoTable({
  data,
  loading,
  choPhoMap,
  pendingInDB,
  pendingChanges,
  onStatusChange,
  selectedRowKeys,
  onSelectionChange,
  pageSize,
  onPageSizeChange
}: ChoPhoTableProps) {
  const columns: ColumnsType<KHRecord> = [
    {
      title: 'STT',
      key: 'stt',
      width: TABLE_CONFIG.COL_STT,
      align: 'center',
      fixed: 'left',
      render: (_v, _r, index) => <span className="text-gray-400 text-xs">{index + 1}</span>
    },
    {
      title: 'NVBH',
      dataIndex: 'Mã_Tên_NVBH',
      key: 'Mã_Tên_NVBH',
      width: TABLE_CONFIG.COL_NVBH,
      ellipsis: true,
      render: (v) => <span className="text-[12px]">{v}</span>
    },
    {
      title: 'Mã KH',
      dataIndex: 'Mã_KH',
      key: 'Mã_KH',
      width: TABLE_CONFIG.COL_MA_KH,
      render: (v) => <span className="text-blue-600 font-bold text-[13px]">{v}</span>
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'Tên_KH',
      key: 'Tên_KH',
      width: TABLE_CONFIG.COL_TEN_KH,
      ellipsis: true,
      render: (v) => (
        <Tooltip title={v} mouseEnterDelay={0.5}>
          <span className="text-gray-700 text-[12px]">{v}</span>
        </Tooltip>
      )
    },
    {
      title: 'Phố - Chợ',
      key: 'cho_pho',
      width: TABLE_CONFIG.COL_LOAI_CP,
      align: 'center',
      render: (_, r) => {
        const dbStatus = pendingInDB[r.Mã_KH];

        if (dbStatus?.status === 'Chờ duyệt') {
          return (
            <Tag color="orange" icon={<ClockCircleOutlined />} className="m-0 px-2 py-0.5 rounded-md font-medium text-[11px]">
              Chờ duyệt
            </Tag>
          );
        }

        const maKH = r.Mã_KH.trim();
        const currentVal = pendingChanges[maKH] !== undefined ? pendingChanges[maKH] : (choPhoMap[maKH] || '');

        return (
          <Select
            value={currentVal || undefined}
            placeholder="Chọn..."
            className="w-full"
            size="small"
            onChange={(val) => onStatusChange(maKH, val)}
            options={[
              { label: 'Trong Chợ', value: 'Trong Chợ' },
              { label: 'Trên Đường', value: 'Trên Đường' },
            ]}
            status={(pendingChanges[maKH] !== undefined && pendingChanges[maKH] !== (choPhoMap[maKH] || '')) ? 'warning' : undefined}
          />
        );
      }
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'Địa_Chỉ',
      key: 'Địa_Chỉ',
      width: TABLE_CONFIG.COL_DIA_CHI,
      render: (v) => (
        <Tooltip title={v} mouseEnterDelay={0.5}>
          <div className="truncate text-[12px] text-gray-500">{v}</div>
        </Tooltip>
      )
    },
    {
      title: 'Thứ',
      dataIndex: 'Thứ',
      key: 'Thứ',
      width: TABLE_CONFIG.COL_THU,
      align: 'center',
      render: (v) => <span className="text-[12px]">{v}</span>
    },
    {
      title: 'Khu vực',
      dataIndex: 'Khu_Vực',
      key: 'Khu_Vực',
      width: TABLE_CONFIG.COL_KHU_VUC,
      align: 'center',
      render: (v) => <span className="text-[12px]">{v}</span>
    },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ant-table-small .ant-table-thead > tr > th,
        .ant-table-small .ant-table-tbody > tr > td,
        .ant-table-cell {
          padding: 6px 8px !important;
          white-space: nowrap !important;
        }
        .ant-table-small .ant-table-thead > tr > th {
          text-align: center !important;
        }
        /* Cấu hình phân trang chuyên nghiệp */
        .ant-table-pagination.ant-pagination {
          margin: 12px 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important; /* Đưa nút sang phải */
        }
        /* Đưa thông tin tổng cộng sang bên trái của thanh phân trang */
        .ant-pagination-total-text {
          margin-right: auto !important;
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }
        .ant-table-small {
          font-size: 12px !important;
        }
      `}} />
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="Mã_KH"
        scroll={{ x: TABLE_SCROLL_X.STANDARD, y: TABLE_CONFIG.SCROLL_Y_STANDARD }}
        size="small"
        virtual
        rowSelection={{
          selectedRowKeys,
          onChange: onSelectionChange,
          columnWidth: TABLE_CONFIG.COL_SELECT,
          getCheckboxProps: (r) => {
            const dbStatus = pendingInDB[r.Mã_KH];
            const isPending = dbStatus?.status === 'Chờ duyệt';
            const hasChange = pendingChanges[r.Mã_KH] && pendingChanges[r.Mã_KH] !== choPhoMap[r.Mã_KH];
            
            return {
              disabled: isPending || !hasChange,
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
        className="border border-gray-100 rounded-lg overflow-hidden shadow-sm bg-white"
        onRow={(record) => {
          const dbStatus = pendingInDB[record.Mã_KH];
          const isPending = dbStatus?.status === 'Chờ duyệt';
          const hasChange = pendingChanges[record.Mã_KH] && pendingChanges[record.Mã_KH] !== choPhoMap[record.Mã_KH];
          const isLocked = isPending || !hasChange;

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
