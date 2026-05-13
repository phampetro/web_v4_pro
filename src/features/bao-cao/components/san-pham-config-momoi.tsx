'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Spin, Typography, Button, Space, Row, Col,
  App, Card, Flex, Select, Checkbox, Table
} from 'antd';
import {
  SaveOutlined,
  SearchOutlined,
  HolderOutlined,
  ReloadOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  PlusCircleOutlined
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
import { getProductConfigMomoi } from '../actions/get-products-momoi';
import { saveProductConfigMomoi } from '../actions/save-product-config-momoi';

const { Title, Text } = Typography;

const COMPACT_STYLE = `
  .compact-table .ant-table-cell {
    padding: 4px 8px !important;
    font-size: 13px !important;
    white-space: nowrap !important;
  }
  .compact-table .ant-table-thead .ant-table-cell {
    background-color: #fafafa !important;
    padding: 8px !important;
  }
  .compact-table .ant-btn-text.ant-btn-icon-only {
    width: 24px;
    height: 24px;
  }
`;

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

export function SanPhamConfigMomoi() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved'>('idle');
  const [exporting, setExporting] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [reportType, setReportType] = useState('pt_diem_ban');
  const [filterAreas, setFilterAreas] = useState<string[]>([]);
  const [areaOptions, setAreaOptions] = useState<{ label: string, value: string }[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProductConfigMomoi();
      if (!result.success || !result.data) {
        message.error(result.error || 'Lỗi tải dữ liệu');
        setSaveStatus('idle');
      } else {
        setAllProducts(result.data.allProducts);
        setSelectedProducts(result.data.userConfig);
        if (result.data.areas) {
          setAreaOptions(result.data.areas.map(a => ({ label: a, value: a })));
        }
        setSaveStatus('idle');
      }
    } catch {
      message.error('Lỗi tải dữ liệu');
      setSaveStatus('idle');
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
        setSaveStatus('unsaved');
      }
    } else {
      const removedId = currentIds.find(id => !newValues.includes(id));
      setSelectedProducts(prev => prev.filter(p => p.MA_SPQD !== removedId).map((p, i) => ({ ...p, Thu_tu_sap_xep: i + 1 })));
      setSaveStatus('unsaved');
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setSelectedProducts((prev) => {
        const activeIndex = prev.findIndex((i) => i.MA_SPQD === active.id);
        const overIndex = prev.findIndex((i) => i.MA_SPQD === over?.id);
        setSaveStatus('unsaved');
        return arrayMove(prev, activeIndex, overIndex).map((p, i) => ({ ...p, Thu_tu_sap_xep: i + 1 }));
      });
    }
  };

  const handleSave = async (showToast = true) => {
    setSaveStatus('saving');
    try {
      const result = await saveProductConfigMomoi(selectedProducts);
      if (!result.success) {
        if (showToast) message.error(result.error || 'Lỗi lưu cấu hình');
        setSaveStatus('unsaved');
      } else {
        if (showToast) message.success(result.message || 'Đã lưu danh sách sản phẩm mở mới');
        setSaveStatus('saved');
      }
    } catch {
      if (showToast) message.error('Lỗi hệ thống khi lưu');
      setSaveStatus('unsaved');
    }
  };

  useEffect(() => {
    if (saveStatus === 'unsaved') {
      const timer = setTimeout(() => {
        handleSave(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus, selectedProducts]);

  const handleExport = async () => {
    if (selectedProducts.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 sản phẩm');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/bao-cao-mo-moi/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: selectedProducts,
          reportType,
          areas: filterAreas.length > 0 ? filterAreas : areaOptions.map(o => o.value),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Lỗi xuất báo cáo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = reportType === 'pt_diem_ban' ? 'bao_cao_phan_tich_do_phu' : 'bao_cao_mo_moi';
      a.download = `${fileName}_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success('Xuất báo cáo thành công');
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setExporting(false);
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
    { title: 'Mã SP', dataIndex: 'MA_SPQD', width: 150, ellipsis: true },
    { title: 'Tên Sản Phẩm', dataIndex: 'TEN_SPQD', ellipsis: true },
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
          onClick={() => {
            setSelectedProducts(prev => prev.filter(p => p.MA_SPQD !== r.MA_SPQD));
            setSaveStatus('unsaved');
          }}
        />
      )
    },
  ];

  const searchOptions = useMemo(() => {
    const selectedIds = new Set(selectedProducts.map(p => p.MA_SPQD));
    return allProducts.map(p => {
      const isSame = p.MA_SPQD === p.TEN_SPQD;
      return {
        value: p.MA_SPQD,
        label: (
          <Flex gap={8} align="center">
            <Checkbox checked={selectedIds.has(p.MA_SPQD)} />
            <span>{isSame ? p.TEN_SPQD : `${p.MA_SPQD} - ${p.TEN_SPQD}`}</span>
          </Flex>
        ),
        search: isSame ? p.TEN_SPQD.toLowerCase() : `${p.MA_SPQD} ${p.TEN_SPQD}`.toLowerCase()
      };
    });
  }, [allProducts, selectedProducts]);

  return (
    <Flex vertical gap={16} className="h-full">
      <Row gutter={24} className="flex-1 min-h-0">
        <Col span={14} className="h-full flex flex-col">
          <style>{COMPACT_STYLE}</style>
          <Card
            title={<Title level={5} className="!m-0">Cấu hình sản phẩm Mở mới ({selectedProducts.length})</Title>}
            className="flex-1 flex flex-col min-h-0 shadow-sm"
            styles={{ body: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '24px', padding: '20px' } }}
          >
            <Select
              mode="multiple"
              showSearch
              className="w-full"
              placeholder="Tìm kiếm sản phẩm để thêm vào danh sách..."
              value={selectedProducts.map(p => p.MA_SPQD)}
              onChange={handleSelectChange}
              options={searchOptions}
              filterOption={(input, option) => (option?.search ?? '').includes(input.toLowerCase())}
              maxTagCount={0}
              maxTagPlaceholder={() => `Đã chọn ${selectedProducts.length} sản phẩm`}
              suffixIcon={<SearchOutlined />}
            />

            <div className="flex-1 border border-gray-100 rounded-md">
              <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                <SortableContext items={selectedProducts.map(p => p.MA_SPQD)} strategy={verticalListSortingStrategy}>
                  <Table
                    components={{ body: { row: SortableRow } }}
                    dataSource={selectedProducts}
                    columns={columns}
                    rowKey="MA_SPQD"
                    pagination={false}
                    size="small"
                    scroll={{ y: 400 }}
                    className="compact-table"
                  />
                </SortableContext>
              </DndContext>
            </div>

            <Flex justify="start" align="center" gap={12} className="pt-4 border-t border-gray-100">
              <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} className="px-6">
                Tải lại
              </Button>
              <Button type="primary" icon={<SaveOutlined />} loading={saveStatus === 'saving'} onClick={() => handleSave(true)} className="px-6">
                Lưu cấu hình
              </Button>

              {saveStatus === 'unsaved' && (
                <Text type="warning" className="animate-pulse flex items-center gap-1">
                  <ExclamationCircleOutlined /> Có thay đổi chưa lưu...
                </Text>
              )}
              {saveStatus === 'saving' && (
                <Text type="secondary" className="flex items-center gap-1">
                  <SyncOutlined spin /> Đang tự động lưu...
                </Text>
              )}
              {saveStatus === 'saved' && (
                <Text type="success" className="flex items-center gap-1">
                  <CheckCircleOutlined /> Đã lưu cấu hình
                </Text>
              )}
            </Flex>
          </Card>
        </Col>

        <Col span={10}>
          <Card title="Xuất báo cáo mở mới" className="shadow-sm">
            <Flex vertical gap={24}>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <Text type="secondary">
                  Giao diện này cho phép bạn thiết lập danh mục sản phẩm mục tiêu cho báo cáo mở mới. 
                  Dữ liệu sẽ được lưu riêng biệt so với báo cáo bao phủ.
                </Text>
              </div>

              <div>
                <Text strong className="block mb-2">1. Loại báo cáo</Text>
                <Select
                  className="w-full"
                  value={reportType}
                  onChange={setReportType}
                  options={[
                    { label: 'Phân tích điểm bán độ phủ', value: 'pt_diem_ban' },
                    { label: 'Mở mới sản phẩm (Sắp ra mắt)', value: 'mo_moi_sp', disabled: true },
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
                  options={areaOptions}
                  allowClear
                  maxTagCount="responsive"
                />
              </div>

              <div className="mt-4">
                <Button
                  type="primary"
                  size="large"
                  icon={<FileExcelOutlined />}
                  loading={exporting}
                  onClick={handleExport}
                  disabled={selectedProducts.length === 0}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-semibold text-base disabled:bg-gray-300 disabled:border-transparent"
                >
                  XUẤT BÁO CÁO EXCEL
                </Button>
                {selectedProducts.length === 0 && (
                  <Text type="danger" className="block text-center mt-2 animate-pulse">
                    * Vui lòng chọn ít nhất 1 sản phẩm vào danh sách để xuất báo cáo
                  </Text>
                )}
              </div>
            </Flex>
          </Card>
        </Col>
      </Row>
    </Flex>
  );
}
