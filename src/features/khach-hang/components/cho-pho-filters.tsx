'use client';

import React, { useMemo } from 'react';
import { Flex, Select, Typography } from 'antd';
import { KHRecord } from '../types';
import { THU_OPTIONS } from '@/constants';

const { Text } = Typography;

interface ChoPhoFiltersProps {
  data: KHRecord[];
  filters: {
    khuVuc?: string;
    nvbh?: string;
    kh?: string;
    thu: string[];
  };
  onChange: (key: string, value: any) => void;
}

export function ChoPhoFilters({ data, filters, onChange }: ChoPhoFiltersProps) {
  const khuVucOptions = useMemo(() => {
    const list = [...new Set(data.map(r => r.Khu_Vực).filter(Boolean))].sort();
    return list.map(v => ({ label: v, value: v }));
  }, [data]);

  const nvbhOptions = useMemo(() => {
    let filtered = data;
    if (filters.khuVuc) filtered = filtered.filter(r => r.Khu_Vực === filters.khuVuc);
    const list = [...new Set(filtered.map(r => r.Mã_Tên_NVBH).filter(Boolean))].sort();
    return list.map(v => ({ label: v, value: v }));
  }, [data, filters.khuVuc]);

  const khOptions = useMemo(() => {
    let filtered = data;
    if (filters.khuVuc) filtered = filtered.filter(r => r.Khu_Vực === filters.khuVuc);
    if (filters.nvbh) filtered = filtered.filter(r => r.Mã_Tên_NVBH === filters.nvbh);
    
    const uniqueMap = new Map();
    filtered.forEach(r => {
      if (!uniqueMap.has(r.Mã_KH)) {
        uniqueMap.set(r.Mã_KH, { label: `${r.Mã_KH} - ${r.Tên_KH}`, value: r.Mã_KH });
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [data, filters.khuVuc, filters.nvbh]);

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
          options={khuVucOptions}
          className="w-full"
        />
      </div>

      <div className="flex-1 min-w-[180px]">
        <Text type="secondary" className="text-xs block mb-1">NVBH</Text>
        <Select
          placeholder="Tất cả"
          value={filters.nvbh}
          onChange={v => onChange('nvbh', v)}
          allowClear
          showSearch
          options={nvbhOptions}
          className="w-full"
        />
      </div>

      <div className="flex-1 min-w-[250px]">
        <Text type="secondary" className="text-xs block mb-1">Mã - Tên KH</Text>
        <Select
          placeholder="Tìm kiếm khách hàng..."
          value={filters.kh}
          onChange={v => onChange('kh', v)}
          allowClear
          showSearch
          options={khOptions}
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
          options={THU_OPTIONS}
          className="w-full"
          maxTagCount="responsive"
        />
      </div>
    </Flex>
  );
}
