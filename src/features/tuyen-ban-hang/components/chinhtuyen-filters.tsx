'use client';

import React from 'react';
import { Select, Flex, Typography } from 'antd';

const { Text } = Typography;

interface ChinhtuyenFiltersProps {
  filters: {
    khuVuc?: string;
    nvbh?: string;
    kh?: string;
    thu?: string;
    tanSuat?: string;
    trangThai?: string;
  };
  options: {
    khuVuc: { label: string; value: string }[];
    nvbh: { label: string; value: string }[];
    kh: { label: string; value: string }[];
    thu: { label: string; value: string }[];
    tanSuat: { label: string; value: string }[];
  };
  onChange: (key: string, value: any) => void;
}

export function ChinhtuyenFilters({ filters, options, onChange }: ChinhtuyenFiltersProps) {
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
      
      <div className="flex-1 min-w-[180px]">
        <Text type="secondary" className="text-xs block mb-1">NVBH Mới</Text>
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

      <div className="flex-[1.5] min-w-[250px]">
        <Text type="secondary" className="text-xs block mb-1">Khách hàng</Text>
        <Select
          placeholder="Tất cả"
          value={filters.kh}
          onChange={v => onChange('kh', v)}
          allowClear
          showSearch
          options={options.kh}
          className="w-full"
        />
      </div>

      <div className="flex-1 min-w-[120px]">
        <Text type="secondary" className="text-xs block mb-1">Thứ</Text>
        <Select
          placeholder="Tất cả"
          value={filters.thu}
          onChange={v => onChange('thu', v)}
          allowClear
          options={options.thu}
          className="w-full"
        />
      </div>

      <div className="flex-1 min-w-[120px]">
        <Text type="secondary" className="text-xs block mb-1">Tần suất</Text>
        <Select
          placeholder="Tất cả"
          value={filters.tanSuat}
          onChange={v => onChange('tanSuat', v)}
          allowClear
          options={options.tanSuat}
          className="w-full"
        />
      </div>

      <div className="w-[150px]">
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
