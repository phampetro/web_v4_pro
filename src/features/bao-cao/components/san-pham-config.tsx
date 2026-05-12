'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Spin, Typography, Button, Space, Row, Col, 
  message, Card, Flex, Select, Checkbox, Table 
} from 'antd';
import {
  SaveOutlined,
  SearchOutlined,
  HolderOutlined,
  ReloadOutlined,
  DeleteOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product } from '../types';
import { getProductConfig } from '../actions/get-products';
import { saveProductConfig } from '../actions/save-product-config';

const { Title, Text } = Typography;

// Row component for DnD
const SortableRow = (props: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: isDragging ? 'grabbing' : 'auto',
    ...(isDragging ? { position: 'relative', zIndex: 999, background: '#f0f7ff' } : {}),
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />
  );
};

export function SanPhamConfig() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [reportType, setReportType] = useState('khach_hang');
  const [filterAreas, setFilterAreas] = useState<string[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProductConfig('Admin'); // Mock username
      if ('error' in result) {
        message.error(result.error);
      } else {
        setAllProducts(result.allProducts);
        setSelectedProducts(result.userConfig);
      }
    } catch {
      message.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectChange = (newValues: string[]) => {
    const currentIds = selectedProducts.map(p => p.MA_SPQD);
    if (newValues.length > currentIds.length) {
      const addedId = newValues.find(id => !currentIds.includes(id));
      const product = allProducts.find(p => p.MA_SPQD === addedId);
      if (product) {
        setSelectedProducts(prev => [...prev, product].map((p, i) => ({ ...p, Thu_tu_sap_xep: i + 1 })));
      }
    } else {
      const removedId = currentIds.find(id => !newValues.includes(id));
      setSelectedProducts(prev => prev.filter(p => p.MA_SPQD !== removedId).map((p, i) => ({ ...p, Thu_tu_sap_xep: i + 1 })));
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setSelectedProducts((prev) => {
        const activeIndex = prev.findIndex((i) => i.MA_SPQD === active.id);
        const overIndex = prev.findIndex((i) => i.MA_SPQD === over?.id);
        return arrayMove(prev, activeIndex, overIndex).map((p, i) => ({ ...p, Thu_tu_sap_xep: i + 1 }));
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveProductConfig('Admin', selectedProducts);
      if ('error' in result) {
        message.error(result.error);
      } else {
        message.success('Đã lưu cấu hình sản phẩm');
      }
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { 
      title: '', 
      key: 'drag', 
      width: 40, 
      align: 'center' as const, 
      render: () => <HolderOutlined className="text-gray-400 cursor-grab" /> 
    },
    { title: 'STT', key: 'stt', width: 50, align: 'center' as const, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Mã SP', dataIndex: 'MA_SPQD', width: 120 },
    { title: 'Tên Sản Phẩm', dataIndex: 'TEN_SPQD' },
    {
      title: 'Xóa',
      key: 'action',
      width: 60,
      align: 'center' as const,
      render: (_: any, r: Product) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => setSelectedProducts(prev => prev.filter(p => p.MA_SPQD !== r.MA_SPQD))} 
        />
      )
    },
  ];

  const searchOptions = useMemo(() => {
    const selectedIds = new Set(selectedProducts.map(p => p.MA_SPQD));
    return allProducts.map(p => ({
      value: p.MA_SPQD,
      label: (
        <Flex gap={8} align="center">
          <Checkbox checked={selectedIds.has(p.MA_SPQD)} />
          <span>{p.MA_SPQD} - {p.TEN_SPQD}</span>
        </Flex>
      ),
      search: `${p.MA_SPQD} ${p.TEN_SPQD}`.toLowerCase()
    }));
  }, [allProducts, selectedProducts]);

  return (
    <Flex vertical gap={16} className="h-full">
      <Row gutter={24} className="flex-1 min-h-0">
        <Col span={14} className="h-full flex flex-col">
          <Card 
            title={<Title level={5} className="!m-0">Cấu hình sản phẩm hiển thị ({selectedProducts.length})</Title>}
            extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Tải lại</Button>}
            className="flex-1 flex flex-col min-h-0 shadow-sm"
            styles={{ body: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '16px' } }}
          >
            <Select
              mode="multiple"
              showSearch
              className="w-full mb-4"
              placeholder="Tìm kiếm sản phẩm để thêm vào danh sách..."
              value={selectedProducts.map(p => p.MA_SPQD)}
              onChange={handleSelectChange}
              options={searchOptions}
              filterOption={(input, option) => (option?.search ?? '').includes(input.toLowerCase())}
              maxTagCount={0}
              maxTagPlaceholder={() => `Đã chọn ${selectedProducts.length} sản phẩm`}
              suffixIcon={<SearchOutlined />}
            />

            <div className="flex-1 overflow-auto border border-gray-100 rounded-md">
              <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                <SortableContext items={selectedProducts.map(p => p.MA_SPQD)} strategy={verticalListSortingStrategy}>
                  <Table
                    components={{ body: { row: SortableRow } }}
                    dataSource={selectedProducts}
                    columns={columns}
                    rowKey="MA_SPQD"
                    pagination={false}
                    size="small"
                    className="compact-table"
                  />
                </SortableContext>
              </DndContext>
            </div>

            <Flex justify="start" className="mt-4">
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                Lưu cấu hình
              </Button>
            </Flex>
          </Card>
        </Col>

        <Col span={10}>
          <Card title="Xuất báo cáo bao phủ" className="shadow-sm">
            <Flex vertical gap={24}>
              <div>
                <Text strong className="block mb-2">1. Loại báo cáo</Text>
                <Select
                  className="w-full"
                  value={reportType}
                  onChange={setReportType}
                  options={[
                    { label: 'Bao phủ theo khách hàng', value: 'khach_hang' },
                    { label: 'Bao phủ theo tuyến', value: 'tuyen' },
                    { label: 'Bao phủ theo khu vực', value: 'khu_vuc' },
                  ]}
                />
              </div>

              <div>
                <Text strong className="block mb-2">2. Lọc theo Khu vực</Text>
                <Select
                  mode="multiple"
                  className="w-full"
                  placeholder="Tất cả khu vực"
                  value={filterAreas}
                  onChange={setFilterAreas}
                  options={[]} // Sẽ bổ sung sau
                />
              </div>

              <Button
                type="primary"
                size="large"
                icon={<FileExcelOutlined />}
                className="w-full h-12 bg-green-600 hover:bg-green-700 mt-4 font-semibold text-base"
              >
                XUẤT BÁO CÁO EXCEL
              </Button>
            </Flex>
          </Card>
        </Col>
      </Row>
    </Flex>
  );
}
