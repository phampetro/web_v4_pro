'use client';

import React from 'react';
import { Select, Flex, Typography } from 'antd';

const { Text } = Typography;

interface Props {
  options: {
    khuVuc: { label: string; value: string }[];
  };
  filters: {
    khuVuc?: string;
  };
  onChange: (key: string, value: any) => void;
  onReload: () => void;
  loading: boolean;
}

export function XemNhanhTuyenFilters({ options, filters, onChange }: Props) {
  return (
    <Flex gap={16} align="end" className="py-2">
      <div className="w-[160px]">
        <Text type="secondary" className="text-xs block mb-1">Khu vực</Text>
        <Select
          placeholder="Tất cả khu vực"
          allowClear
          showSearch
          className="w-full"
          options={options.khuVuc}
          value={filters.khuVuc}
          onChange={v => onChange('khuVuc', v)}
        />
      </div>
      <div className="flex-1"></div>
    </Flex>
  );
}
