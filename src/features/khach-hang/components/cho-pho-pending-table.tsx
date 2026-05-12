'use client';

import React from 'react';
import { Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  SwapRightOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { PendingChoPhoItem as ChoPhoPendingRecord } from '../actions/get-cho-pho-pending';
import { TABLE_CONFIG, TABLE_SCROLL_X } from '@/constants/table-config';

const { Text } = Typography;

interface ChoPhoPendingTableProps {
  data: ChoPhoPendingRecord[];
  loading: boolean;
  selectedRowKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export function ChoPhoPendingTable({
  data,
  loading,
  selectedRowKeys,
  onSelectionChange,
  pageSize,
  onPageSizeChange
}: ChoPhoPendingTableProps) {
  const columns: ColumnsType<ChoPhoPendingRecord> = [
    {
      title: 'STT',
      dataIndex: 'stt',
      key: 'stt',
      width: TABLE_CONFIG.COL_STT,
      align: 'center',
      render: (_: any, __: any, index: number) => <span className="text-gray-400 text-[11px]">{index + 1}</span>
    },
    {
      title: 'Khu vực',
      dataIndex: 'Khu_vuc',
      key: 'khu_vuc',
      width: TABLE_CONFIG.COL_KHU_VUC,
      render: (v) => <span className="text-[11px] font-medium text-blue-700">{v}</span>
    },
    {
      title: 'NVBH',
      dataIndex: 'NVBH',
      key: 'nvbh',
      width: TABLE_CONFIG.COL_NVBH,
      ellipsis: true,
      render: (v) => <Tooltip title={v}><span className="text-[11px] truncate block">{v}</span></Tooltip>
    },
    {
      title: 'Mã KH',
      dataIndex: 'Ma_KH',
      key: 'ma_kh',
      width: TABLE_CONFIG.COL_MA_KH,
      render: (v) => <span className="text-[11px] font-bold text-gray-700">{v}</span>
    },
    {
      title: 'Tên KH',
      dataIndex: 'Ten_KH',
      key: 'ten_kh',
      width: TABLE_CONFIG.COL_TEN_KH,
      ellipsis: true,
      render: (v) => <Tooltip title={v}><span className="text-[11px] font-medium truncate block">{v}</span></Tooltip>
    },
    {
      title: 'Loại thay đổi',
      dataIndex: 'Loai_thay_doi',
      key: 'loai_thay_doi',
      width: TABLE_CONFIG.COL_LOAI_CP,
      render: (v) => <Tag color="blue" className="text-[11px]">{v}</Tag>
    },
    {
      title: 'Giá trị thay đổi',
      key: 'gia_tri',
      width: TABLE_CONFIG.COL_CHANGE_VALUE,
      render: (_, r) => (
        <span className="text-[11px]">
          <span className="text-gray-400 line-through mr-1">{r.Gia_tri_cu}</span>
          <ArrowRightOutlined className="text-gray-300 mx-1 scale-75" />
          <span className="text-blue-600 font-bold ml-1">{r.Gia_tri_moi}</span>
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Trang_thai_duyet',
      key: 'trang_thai',
      width: TABLE_CONFIG.COL_TRANG_THAI,
      align: 'center',
      render: (status) => {
        if (status === 'Chờ duyệt') return <Tag color="orange" icon={<ClockCircleOutlined />} className="m-0 px-2 py-0.5 rounded-md font-medium text-[11px]">Chờ duyệt</Tag>;
        if (status === 'Đã duyệt') return <Tag color="green" icon={<CheckCircleOutlined />} className="m-0 px-2 py-0.5 rounded-md font-medium text-[11px]">Đã duyệt</Tag>;
        if (status === 'Từ chối') return <Tag color="red" icon={<CloseCircleOutlined />} className="m-0 px-2 py-0.5 rounded-md font-medium text-[11px]">Từ chối</Tag>;
        return <Tag className="m-0 px-2 py-0.5 rounded-md font-medium text-[11px]">{status}</Tag>;
      }
    },
    {
      title: 'Ngày ĐK',
      dataIndex: 'Ngay_dang_ky',
      key: 'ngay_dk',
      width: TABLE_CONFIG.COL_NGAY,
      align: 'center',
      render: (val) => <span className="text-[11px] text-gray-500">{val || '-'}</span>
    },
    {
      title: 'Người ĐK',
      dataIndex: 'Nguoi_dang_ky',
      key: 'nguoi_dk',
      width: TABLE_CONFIG.COL_NGUOI_DK,
      render: (v) => <span className="text-[11px] font-medium">{v}</span>
    },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ant-table-wrapper .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .ant-table-wrapper .ant-table-thead > tr > th,
        .ant-table-wrapper .ant-table-tbody > tr > td,
        .ant-table-cell {
          white-space: nowrap !important;
          padding: 6px 8px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td {
          background: #f0f7ff !important;
        }
        .ant-table-pagination.ant-pagination {
          justify-content: center !important;
          width: 100% !important;
          margin: 10px 0 !important;
        }
      `}} />
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="ID"
        scroll={{ x: TABLE_SCROLL_X.STANDARD, y: TABLE_CONFIG.SCROLL_Y_STANDARD }}
        size="small"
        virtual
        rowSelection={{
          selectedRowKeys,
          onChange: onSelectionChange,
          columnWidth: TABLE_CONFIG.COL_SELECT,
          getCheckboxProps: (record) => ({
            disabled: record.Trang_thai_duyet !== 'Chờ duyệt',
          }),
        }}
        pagination={false}
        footer={() => (
          <div className="py-2 px-4 bg-gray-50/50 border-t border-gray-100 rounded-b-lg">
            <span className="text-gray-500 text-[11px]">
              Tổng cộng: <b>{data.length}</b> yêu cầu duyệt
            </span>
          </div>
        )}
        className="border border-gray-100 rounded-lg overflow-hidden shadow-sm bg-white"
        onRow={(record) => {
          const isLocked = record.Trang_thai_duyet !== 'Chờ duyệt';
          return {
            onClick: () => {
              if (isLocked) return;
              const key = record.ID;
              const newKeys = [...selectedRowKeys];
              const idx = newKeys.indexOf(key);
              if (idx >= 0) newKeys.splice(idx, 1);
              else newKeys.push(key);
              onSelectionChange(newKeys);
            },
            className: !isLocked 
              ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' 
              : 'bg-gray-50/50 cursor-not-allowed',
          };
        }}
      />
    </>
  );
}
