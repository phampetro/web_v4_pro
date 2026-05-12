'use client';

import React from 'react';
import { Select, Flex, Typography } from 'antd';

const { Text } = Typography;

interface TamNgungFiltersProps {
  filters: {
    khuVuc?: string;
    nvbh?: string;
    trangThai?: string;
  };
  options: {
    khuVuc: { label: string; value: string }[];
    nvbh: { label: string; value: string }[];
  };
  onChange: (key: string, value: any) => void;
  onReload: () => void;
  loading?: boolean;
}

export function TamNgungFilters({ filters, options, onChange }: TamNgungFiltersProps) {
  return (
    <Flex wrap="wrap" gap={16} align="end" className="py-2">
      <div className="flex-1 min-w-[150px]">
        <Text type="secondary" className="text-xs block mb-1">Khu vực</Text>
        <Select
          placeholder="Tất cả"
          value={filters.khuVuc}
          onChange={v => onChange('khuVuc', v)}
          allowClear
          showSearch
          options={options.khuVuc}
          className="w-full"
        />
      </div>
      
      <div className="flex-1 min-w-[200px]">
        <Text type="secondary" className="text-xs block mb-1">NVBH</Text>
        <Select
          placeholder="Tất cả"
          value={filters.nvbh}
          onChange={v => onChange('nvbh', v)}
          allowClear
          showSearch
          options={options.nvbh}
          className="w-full"
        />
      </div>

      <div className="flex-1 min-w-[150px]">
        <Text type="secondary" className="text-xs block mb-1">Trạng thái</Text>
        <Select
          placeholder="Tất cả"
          value={filters.trangThai}
          onChange={v => onChange('trangThai', v)}
          allowClear
          options={[
            { label: 'Chờ duyệt', value: 'Chờ duyệt' },
            { label: 'Đã duyệt', value: 'Đã duyệt' },
            { label: 'Từ chối', value: 'Từ chối' },
          ]}
          className="w-full"
        />
      </div>
    </Flex>
  );
}
