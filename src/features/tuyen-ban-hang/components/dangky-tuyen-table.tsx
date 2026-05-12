'use client';

import React, { useMemo } from 'react';
import { Table, Tag, Tooltip, Typography, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { KHRecord } from '@/features/khach-hang/types';
import { THU_OPTIONS, TAN_SUAT_OPTIONS } from '@/constants';
import { TABLE_CONFIG, TABLE_SCROLL_X } from '@/constants/table-config';

const { Text } = Typography;

interface DangkyTuyenTableProps {
  data: KHRecord[];
  loading: boolean;
  pendingStatus: Record<string, { status: string, nvbh: string, thu: string, ts: string }>;
  selectedRowKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  changes: Record<string, any>;
  onUpdate: (maKH: string, field: string, value: any, original: KHRecord) => void;
  nvbhOptions: { label: string, value: string, khuVuc: string }[];
}

export function DangkyTuyenTable({
  data,
  loading,
  pendingStatus,
  selectedRowKeys,
  onSelectionChange,
  changes,
  onUpdate,
  nvbhOptions
}: DangkyTuyenTableProps) {
  const columns: ColumnsType<KHRecord> = useMemo(() => [
    {
      title: 'STT',
      key: 'stt',
      width: TABLE_CONFIG.COL_STT,
      align: 'center',
      render: (_, __, i) => <Text className="text-[11px] text-gray-500">{i + 1}</Text>
    },
    {
      title: 'Mã KH',
      dataIndex: 'Mã_KH',
      key: 'Mã_KH',
      width: TABLE_CONFIG.COL_MA_KH,
      render: (v) => <div className="truncate whitespace-nowrap"><Text strong className="text-blue-600 text-[13px]">{v}</Text></div>
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'Tên_KH',
      key: 'Tên_KH',
      width: TABLE_CONFIG.COL_TEN_KH,
      ellipsis: true,
      render: (v) => (
        <Tooltip title={v} mouseEnterDelay={0.5}>
          <div className="truncate whitespace-nowrap"><Text className="text-[12px] text-gray-700">{v}</Text></div>
        </Tooltip>
      )
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'Địa_Chỉ',
      key: 'Địa_Chỉ',
      ellipsis: true,
      render: (v) => (
        <Tooltip title={v} mouseEnterDelay={0.5}>
          <div className="truncate whitespace-nowrap"><Text className="text-[11px] text-gray-400 font-light">{v}</Text></div>
        </Tooltip>
      )
    },
    {
      title: 'NVBH',
      key: 'Mã_Tên_NVBH',
      width: TABLE_CONFIG.COL_NVBH + 150,
      render: (_, r) => {
        const dbStatus = pendingStatus[r.Mã_KH];

        if (dbStatus && dbStatus.status === 'Chờ duyệt') {
          return (
            <Tooltip title="Đang chờ duyệt thay đổi">
              <div className="truncate whitespace-nowrap">
                <Text className="text-[12px] text-orange-600 font-medium italic">
                  {dbStatus.nvbh}
                </Text>
              </div>
            </Tooltip>
          );
        }

        if (dbStatus && dbStatus.status === 'Đã duyệt') {
          return (
            <Tooltip title="Vừa được duyệt thay đổi">
              <div className="truncate whitespace-nowrap">
                <Text className="text-[12px] text-orange-500 font-medium italic">
                  {dbStatus.nvbh}
                </Text>
              </div>
            </Tooltip>
          );
        }

        const rowChanges = (changes && changes[r.Mã_KH]) || {};
        const currentVal = rowChanges.nvbh_moi || r.Mã_Tên_NVBH;
        const isChanged = !!rowChanges.nvbh_moi;
        const filteredOptions = (nvbhOptions || []).filter(opt => opt.khuVuc === r.Khu_Vực);

        return (
          <Select
            variant="borderless"
            size="small"
            className={`w-full text-[12px] h-[24px] ${isChanged ? 'bg-orange-50 font-medium italic' : ''}`}
            value={currentVal}
            onChange={(val) => onUpdate(r.Mã_KH, 'nvbh_moi', val, r)}
            showSearch
            options={filteredOptions}
            popupMatchSelectWidth={false}
            status={isChanged ? 'warning' : ''}
          />
        );
      }
    },
    {
      title: 'Thứ',
      key: 'Thứ',
      width: TABLE_CONFIG.COL_THU + 80,
      render: (_, r) => {
        const dbStatus = pendingStatus[r.Mã_KH];

        if (dbStatus && dbStatus.status === 'Chờ duyệt') {
          return (
            <div className="truncate whitespace-nowrap">
              <Text className="text-[12px] text-orange-600 font-medium italic">
                {dbStatus.thu}
              </Text>
            </div>
          );
        }

        if (dbStatus && dbStatus.status === 'Đã duyệt') {
          return (
            <div className="truncate whitespace-nowrap">
              <Text className="text-[12px] text-orange-500 font-medium italic">
                {dbStatus.thu}
              </Text>
            </div>
          );
        }

        const rowChanges = (changes && changes[r.Mã_KH]) || {};
        const rawVal = rowChanges.thu_moi !== undefined ? rowChanges.thu_moi : r.Thứ;
        const currentVal = rawVal.split(',').map((s: string) => s.trim()).filter(Boolean);
        const isChanged = rowChanges.thu_moi !== undefined;

        return (
          <Select
            mode="multiple"
            variant="borderless"
            size="small"
            className={`w-full text-[12px] h-[24px] ${isChanged ? 'bg-orange-50 font-medium italic' : ''}`}
            value={currentVal}
            onChange={(vals) => {
              if (vals.length === 0) return;
              onUpdate(r.Mã_KH, 'thu_moi', vals.join(', '), r);
            }}
            options={THU_OPTIONS}
            maxCount={2}
            maxTagCount="responsive"
            status={isChanged ? 'warning' : ''}
          />
        );
      }
    },
    {
      title: 'Tần suất',
      key: 'Tần_Suất',
      width: TABLE_CONFIG.COL_TAN_SUAT + 30,
      render: (_, r) => {
        const dbStatus = pendingStatus[r.Mã_KH];

        if (dbStatus && dbStatus.status === 'Chờ duyệt') {
          return (
            <div className="truncate whitespace-nowrap">
              <Text className="text-[12px] text-orange-600 font-medium italic">
                {dbStatus.ts}
              </Text>
            </div>
          );
        }

        if (dbStatus && dbStatus.status === 'Đã duyệt') {
          return (
            <div className="truncate whitespace-nowrap">
              <Text className="text-[12px] text-orange-500 font-medium italic">
                {dbStatus.ts}
              </Text>
            </div>
          );
        }

        const rowChanges = (changes && changes[r.Mã_KH]) || {};
        const currentVal = rowChanges.ts_moi || r.Tần_Suất;
        const isChanged = !!rowChanges.ts_moi;

        const currentThu = rowChanges.thu_moi !== undefined ? rowChanges.thu_moi : r.Thứ;
        const thuCount = currentThu.split(',').filter(Boolean).length;

        return (
          <Select
            variant="borderless"
            size="small"
            className={`w-full text-[12px] h-[24px] ${isChanged ? 'bg-orange-50 font-medium italic' : ''}`}
            value={currentVal}
            onChange={(val) => onUpdate(r.Mã_KH, 'ts_moi', val, r)}
            options={thuCount >= 2 ? TAN_SUAT_OPTIONS : TAN_SUAT_OPTIONS.filter(o => o.value !== 'F8')}
            status={isChanged ? 'warning' : ''}
            disabled={thuCount >= 2}
          />
        );
      }
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: TABLE_CONFIG.COL_TRANG_THAI,
      align: 'center',
      render: (_, r) => {
        const item = pendingStatus[r.Mã_KH];
        if (!item) return null;

        const config: Record<string, { color: string, icon: any }> = {
          'Chờ duyệt': { color: 'orange', icon: <ClockCircleOutlined /> },
          'Đã duyệt': { color: 'green', icon: <CheckCircleOutlined /> },
        };
        const { color, icon } = config[item.status] || { color: 'default', icon: null };

        return (
          <Tag variant="filled" color={color} icon={icon} className="m-0 text-[10px] px-2 py-0.5 rounded-md font-medium">
            {item.status}
          </Tag>
        );
      }
    },
    { title: 'Khu vực', dataIndex: 'Khu_Vực', key: 'Khu_Vực', width: TABLE_CONFIG.COL_KHU_VUC, align: 'center', render: (v) => <div className="truncate whitespace-nowrap"><Text className="text-[11px] text-gray-500">{v}</Text></div> },
  ], [pendingStatus, changes, nvbhOptions, onUpdate]);

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
          text-align: center !important;
          padding: 8px 4px !important;
        }
        .ant-table-wrapper .ant-table-tbody > tr > td {
          white-space: nowrap !important;
          padding: 4px 8px !important;
          vertical-align: middle !important;
        }
        .read-only-selection .ant-table-selection-column {
          pointer-events: none !important;
          opacity: 0.8;
        }
        .read-only-selection .ant-table-selection-column .ant-checkbox-input {
          display: none !important;
        }
      `}} />
      <Table
        className="border border-gray-100 rounded-lg overflow-hidden flex-1 read-only-selection"
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="Mã_KH"
        scroll={{ y: TABLE_CONFIG.SCROLL_Y_STANDARD }}
        size="small"
        rowSelection={{
          selectedRowKeys,
          columnWidth: TABLE_CONFIG.COL_SELECT,
          getCheckboxProps: (r) => ({
            disabled: !!(pendingStatus[r.Mã_KH] && pendingStatus[r.Mã_KH].status === 'Chờ duyệt'),
          }),
        }}
        pagination={false}
        footer={() => (
          <div className="py-2 px-4 bg-gray-50/50 border-t border-gray-100 rounded-b-lg">
            <span className="text-gray-500 text-[11px]">
              Tổng cộng: <b>{data.length}</b> khách hàng
              {selectedRowKeys.length > 0 && <> | Đã chọn: <b className="text-blue-600">{selectedRowKeys.length}</b></>}
            </span>
          </div>
        )}
      />
    </>
  );
}
