'use client';

import React from 'react';
import { Select, Checkbox, Button, Flex, Typography, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { THU_OPTIONS } from '@/constants';

const { Text } = Typography;

interface KPSDSFiltersProps {
  filters: {
    khuVuc?: string;
    nvbh?: string;
    kh?: string;
    thu: string[];
    tanSuat: string[];
    showAll: boolean;
  };
  options: {
    khuVuc: { label: string; value: string }[];
    nvbh: { label: string; value: string }[];
    kh: { label: string; value: string }[];
    thu: { label: string; value: string }[];
    tanSuat: { label: string; value: string }[];
  };
  onChange: (key: string, value: any) => void;
  onReload: () => void;
  loading?: boolean;
  hideShowAll?: boolean;
  requiredFilters?: string[]; // Các filter bắt buộc phải chọn (không cho phép bỏ trống)
}

export function KPSDSFilters({ filters, options, onChange, onReload, loading, hideShowAll, requiredFilters = [] }: KPSDSFiltersProps) {
  return (
    <Flex wrap="wrap" gap={16} align="end" className="py-2">
      <div className="flex-1 min-w-[150px]">
        <Text type="secondary" className="text-xs block mb-1">Khu vực</Text>
         <Select
          placeholder="Tất cả"
          value={filters.khuVuc}
          onChange={v => onChange('khuVuc', v)}
          allowClear={!requiredFilters.includes('khuVuc')}
          showSearch
          options={options.khuVuc}
          className="w-full"
        />
      </div>

      <div className="flex-1 min-w-[180px]">
        <Text type="secondary" className="text-xs block mb-1">NVBH</Text>
        <Select
          placeholder="Tất cả"
          value={filters.nvbh}
          onChange={v => onChange('nvbh', v)}
          allowClear={!requiredFilters.includes('nvbh')}
          showSearch
          options={options.nvbh}
          className="w-full"
        />
      </div>

      <div className="flex-[2] min-w-[250px]">
        <Text type="secondary" className="text-xs block mb-1">Mã - Tên KH</Text>
        <Select
          placeholder="Tìm kiếm khách hàng..."
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
          mode="multiple"
          placeholder="Tất cả"
          value={filters.thu}
          onChange={v => onChange('thu', v)}
          allowClear
          options={options.thu}
          className="w-full"
          maxTagCount="responsive"
        />
      </div>

      <div className="flex-1 min-w-[120px]">
        <Text type="secondary" className="text-xs block mb-1">Tần suất</Text>
        <Select
          mode="multiple"
          placeholder="Tất cả"
          value={filters.tanSuat}
          onChange={v => onChange('tanSuat', v)}
          allowClear
          options={options.tanSuat}
          className="w-full"
          maxTagCount="responsive"
        />
      </div>

      {!hideShowAll && (
        <div className="pb-2">
          <Checkbox
            checked={filters.showAll}
            onChange={e => onChange('showAll', e.target.checked)}
          >
            Tất cả KH
          </Checkbox>
        </div>
      )}
    </Flex>
  );
}
