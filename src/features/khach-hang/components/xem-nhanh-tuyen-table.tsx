'use client';

import React from 'react';
import { Table, Typography, Tooltip, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SummaryRow, SummaryCell } from './xem-nhanh-tuyen-container';
import { TABLE_CONFIG, TABLE_SCROLL_X } from '@/constants/table-config';

const { Text } = Typography;

interface Props {
  data: SummaryRow[];
  loading: boolean;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export function XemNhanhTuyenTable({ data, loading, pageSize, onPageSizeChange }: Props) {

  const renderCellContent = (val: SummaryCell) => {
    if (!val || val.total === 0) return <Text type="secondary">-</Text>;

    const isMarket = val.marketCount >= 1;
    const typeLabel = isMarket ? '[C]' : '[P]';
    const threshold = isMarket ? 36 : 32;
    const isLow = val.total < threshold;

    const tooltipContent = (
      <div className="p-1 min-w-[150px]">
        <div className="border-b border-white/20 mb-2 pb-1 font-bold text-xs">Chi tiết tần suất:</div>
        <div className="space-y-1">
          {Object.entries(val.details)
            .sort((a, b) => b[1] - a[1])
            .map(([ts, count]) => (
              <div key={ts} className="flex justify-between gap-4 text-xs">
                <span>{ts}:</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
        </div>
        <div className="border-t border-white/20 mt-2 pt-1 text-[10px] opacity-80">
          <div>Tỷ lệ Chợ: <b>{Math.round((val.marketCount / val.total) * 100)}%</b> ({val.marketCount}/{val.total})</div>
          <div>Loại: <b>{isMarket ? 'Chợ (Y/c >= 36)' : 'Phố (Y/c >= 32)'}</b></div>
        </div>
      </div>
    );

    return (
      <Tooltip title={tooltipContent} color="#1f2937" styles={{ container: { borderRadius: '8px' } } as any}>
        <Text
          strong
          className={`cursor-help flex items-center justify-center gap-1 ${isLow ? 'text-red-800' : 'text-blue-600'}`}
        >
          {val.total} <span className="text-[9px] opacity-60 font-normal">{typeLabel}</span>
        </Text>
      </Tooltip>
    );
  };

  const getCellClassName = (val: SummaryCell) => {
    if (!val || val.total === 0) return '';
    const isMarket = val.marketCount >= 1;
    const threshold = isMarket ? 36 : 32;
    if (val.total < threshold) return 'bg-red-100/40';
    return '';
  };

  const columns: ColumnsType<SummaryRow> = [
    {
      title: 'STT',
      key: 'stt',
      width: TABLE_CONFIG.COL_STT,
      align: 'center',
      fixed: 'left',
      render: (_, __, i) => <span className="text-gray-400 text-[11px]">{i + 1}</span>
    },
    {
      title: 'Khu vực',
      dataIndex: 'khuVuc',
      key: 'khuVuc',
      width: TABLE_CONFIG.COL_KHU_VUC_PIVOT,
      fixed: 'left',
      render: (v) => <span className="text-[11px] font-medium text-blue-700">{v}</span>
    },
    {
      title: 'Mã - Tên NVBH',
      dataIndex: 'nvbh',
      key: 'nvbh',
      width: TABLE_CONFIG.COL_NVBH_PIVOT,
      fixed: 'left',
      ellipsis: true,
      render: (v) => <span className="text-[11px] font-semibold text-gray-800">{v}</span>
    },
    {
      title: 'Tổng KH',
      dataIndex: 'tongKH',
      key: 'tongKH',
      width: TABLE_CONFIG.COL_TONG_KH,
      align: 'center',
      render: (v) => <Text strong className="text-[11px] text-gray-900">{v}</Text>
    },
    { title: 'Thứ 2', dataIndex: 't2', key: 't2', width: TABLE_CONFIG.COL_THU_PIVOT, align: 'center', onCell: (r) => ({ className: getCellClassName(r.t2) }), render: renderCellContent },
    { title: 'Thứ 3', dataIndex: 't3', key: 't3', width: TABLE_CONFIG.COL_THU_PIVOT, align: 'center', onCell: (r) => ({ className: getCellClassName(r.t3) }), render: renderCellContent },
    { title: 'Thứ 4', dataIndex: 't4', key: 't4', width: TABLE_CONFIG.COL_THU_PIVOT, align: 'center', onCell: (r) => ({ className: getCellClassName(r.t4) }), render: renderCellContent },
    { title: 'Thứ 5', dataIndex: 't5', key: 't5', width: TABLE_CONFIG.COL_THU_PIVOT, align: 'center', onCell: (r) => ({ className: getCellClassName(r.t5) }), render: renderCellContent },
    { title: 'Thứ 6', dataIndex: 't6', key: 't6', width: TABLE_CONFIG.COL_THU_PIVOT, align: 'center', onCell: (r) => ({ className: getCellClassName(r.t6) }), render: renderCellContent },
    { title: 'Thứ 7', dataIndex: 't7', key: 't7', width: TABLE_CONFIG.COL_THU_PIVOT, align: 'center', onCell: (r) => ({ className: getCellClassName(r.t7) }), render: renderCellContent },
    { title: 'Chủ nhật', dataIndex: 'cn', key: 'cn', width: TABLE_CONFIG.COL_CN_PIVOT, align: 'center', onCell: (r) => ({ className: getCellClassName(r.cn) }), render: renderCellContent },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .ant-table-wrapper .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
        }
        .ant-table-wrapper .ant-table-thead > tr > th,
        .ant-table-wrapper .ant-table-tbody > tr > td,
        .ant-table-cell {
          white-space: nowrap !important;
          padding: 6px 8px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .ant-table-row:hover > td {
          background-color: #f1f5f9 !important;
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
        rowKey="key"
        size="small"
        scroll={{ x: TABLE_SCROLL_X.PIVOT, y: TABLE_CONFIG.SCROLL_Y_PIVOT || 550 }}
        pagination={{
          pageSize: 300,
          showSizeChanger: false,
          showTotal: (total) => (
            <span>Tổng cộng: <b className="text-blue-600">{total}</b> dòng dữ liệu</span>
          ),
          placement: ['bottomRight'],
          size: 'small'
        }}
        virtual
      />
    </>
  );
}
