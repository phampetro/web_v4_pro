'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flex, App, Button, Space, Modal, Form, Select, Typography } from 'antd';
import {
  ReloadOutlined,
  EnvironmentOutlined,
  SendOutlined
} from '@ant-design/icons';
import { KPSDSTable } from '@/features/khach-hang/components/kpsds-table';
import { KPSDSFilters } from '@/features/khach-hang/components/kpsds-filters';
import { KHRecord } from '@/features/khach-hang/types';
import { getKPSDS } from '@/features/khach-hang/actions/get-kpsds';
import { registerChinhtuyen } from '../actions/register-chinhtuyen';
import { DEFAULT_PAGE_SIZE, THU_OPTIONS, THU_LIST } from '@/constants';

import { DangkyTuyenTable } from './dangky-tuyen-table';
import { getChinhtuyen } from '../actions/get-chinhtuyen';

const { Title, Text } = Typography;

export function DangkyTuyenContainer() {
  const { message, modal } = App.useApp();
  const [data, setData] = useState<KHRecord[]>([]);
  const [pendingStatus, setPendingStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [changes, setChanges] = useState<Record<string, any>>({});

  // Mặc định chọn Thứ hôm nay giống KPSDS
  const dayIdx = new Date().getDay();
  const todayThu = THU_LIST[(dayIdx + 6) % 7];

  const [filters, setFilters] = useState({
    khuVuc: undefined as string | undefined,
    nvbh: undefined as string | undefined,
    kh: undefined as string | undefined,
    thu: [todayThu],
    tanSuat: [] as string[],
    showAll: true,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      // Khi đổi Khu vực -> Auto-select NVBH đầu tiên của khu vực mới
      if (key === 'khuVuc') {
        const nvbhList = Array.from(new Set(
          data.filter(r => r.Khu_Vực === value).map(r => r.Mã_Tên_NVBH)
        )).filter(Boolean).sort();
        next.nvbh = nvbhList[0] || undefined;
        next.kh = undefined;
      } 
      // Khi đổi NVBH -> Reset Khách hàng
      else if (key === 'nvbh') {
        next.kh = undefined;
      }
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resKpsds, resPending] = await Promise.all([
        getKPSDS(),
        getChinhtuyen()
      ]);

      if ('error' in resKpsds) {
        message.error(resKpsds.error);
      } else {
        const records = resKpsds.data;
        setData(records);

        // Auto-select Khu vực đầu tiên + NVBH đầu tiên (chỉ khi lần đầu load)
        if (records.length > 0 && !filters.khuVuc) {
          const khuVucList = Array.from(new Set(records.map(r => r.Khu_Vực))).filter(Boolean).sort();
          const firstKhuVuc = khuVucList[0];
          if (firstKhuVuc) {
            const nvbhList = Array.from(new Set(
              records.filter(r => r.Khu_Vực === firstKhuVuc).map(r => r.Mã_Tên_NVBH)
            )).filter(Boolean).sort();
            const firstNVBH = nvbhList[0];

            setFilters(prev => ({
              ...prev,
              khuVuc: firstKhuVuc,
              nvbh: firstNVBH || undefined,
            }));
          }
        }
      }

      if (!('error' in resPending)) {
        const map: Record<string, any> = {};
        resPending.data.forEach(item => {
          if (!map[item.Ma_KH]) {
            map[item.Ma_KH] = {
              status: item.Trang_thai_duyet,
              nvbh: item.Ma_ten_nvbh_MOI,
              thu: item.Thu_MOI,
              ts: item.Tan_suat_MOI
            };
          }
        });
        setPendingStatus(map);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering logic
  const filteredData = useMemo(() => {
    return data.filter(r => {
      if (filters.khuVuc && r.Khu_Vực !== filters.khuVuc) return false;
      if (filters.nvbh && r.Mã_Tên_NVBH !== filters.nvbh) return false;
      if (filters.kh && r.Mã_KH !== filters.kh) return false;
      if (filters.thu.length > 0 && !filters.thu.some(t => r.Thứ.includes(t))) return false;
      if (filters.tanSuat.length > 0 && !filters.tanSuat.includes(r.Tần_Suất)) return false;
      return true;
    });
  }, [data, filters]);

  const handleUpdate = (maKH: string, field: string, value: any, original: KHRecord) => {
    setChanges(prev => {
      const currentChanges = { ...(prev[maKH] || {}), [field]: value };

      // Tự động gán tần suất theo số ngày (Thứ)
      if (field === 'thu_moi') {
        const days = value.split(',').filter(Boolean);
        if (days.length >= 2) currentChanges.ts_moi = 'F8';
        else if (days.length === 1) currentChanges.ts_moi = 'F4';
      }

      const finalNVBH = currentChanges.nvbh_moi || original.Mã_Tên_NVBH;
      const finalThu = currentChanges.thu_moi !== undefined ? currentChanges.thu_moi : original.Thứ;
      const finalTS = currentChanges.ts_moi || original.Tần_Suất;

      const isChanged =
        finalNVBH !== original.Mã_Tên_NVBH ||
        finalThu !== original.Thứ ||
        finalTS !== original.Tần_Suất;

      // Tự động tick nếu có thay đổi, bỏ tick nếu về như cũ
      setSelectedRowKeys(prevKeys => {
        const exists = prevKeys.includes(maKH);
        if (isChanged && !exists) return [...prevKeys, maKH];
        if (!isChanged && exists) return prevKeys.filter(k => k !== maKH);
        return prevKeys;
      });

      if (!isChanged) {
        const newChanges = { ...prev };
        delete newChanges[maKH];
        return newChanges;
      }
      return { ...prev, [maKH]: currentChanges };
    });
  };

  // Options for filters
  const options = useMemo(() => {
    // 1. Khu vực luôn lấy từ toàn bộ data
    const khuVucOptions = Array.from(new Set(data.map(r => r.Khu_Vực))).filter(Boolean).sort().map(v => ({ label: v, value: v }));
    
    // 2. NVBH phụ thuộc vào Khu vực được chọn
    let filteredForNVBH = data;
    if (filters.khuVuc) filteredForNVBH = data.filter(r => r.Khu_Vực === filters.khuVuc);
    const nvbhOptions = Array.from(new Set(filteredForNVBH.map(r => r.Mã_Tên_NVBH))).filter(Boolean).sort().map(v => ({ label: v, value: v }));

    // 3. Khách hàng phụ thuộc vào NVBH được chọn
    let filteredForKH = filteredForNVBH;
    if (filters.nvbh) filteredForKH = filteredForNVBH.filter(r => r.Mã_Tên_NVBH === filters.nvbh);
    const khOptions = Array.from(new Set(filteredForKH.map(r => `${r.Mã_KH} - ${r.Tên_KH}`))).sort().map(v => ({ label: v, value: v.split(' - ')[0] }));

    // 4. Thứ và Tần suất phụ thuộc vào Khách hàng (hoặc các cấp trên)
    let filteredForThuTS = filteredForKH;
    if (filters.kh) filteredForThuTS = filteredForKH.filter(r => r.Mã_KH === filters.kh);
    
    const thuOptions = Array.from(new Set(filteredForThuTS.flatMap(r => r.Thứ.split(',').map(t => t.trim())))).filter(Boolean).sort().map(v => ({ label: v, value: v }));
    const tanSuatOptions = Array.from(new Set(filteredForThuTS.map(r => r.Tần_Suất))).filter(Boolean).sort().map(v => ({ label: v, value: v }));

    // Sử dụng Map để loại bỏ trùng lặp thay vì JSON.stringify/parse (hiệu năng gấp ~10x)
    const nvbhMap = new Map<string, { label: string, value: string, khuVuc: string }>();
    data.forEach(r => {
      if (!nvbhMap.has(r.Mã_Tên_NVBH)) {
        nvbhMap.set(r.Mã_Tên_NVBH, { label: r.Mã_Tên_NVBH, value: r.Mã_Tên_NVBH, khuVuc: r.Khu_Vực });
      }
    });
    const nvbhAllOptions = Array.from(nvbhMap.values());

    return { 
      khuVuc: khuVucOptions, 
      nvbh: nvbhOptions, 
      kh: khOptions, 
      thu: thuOptions,
      tanSuat: tanSuatOptions,
      nvbhAll: nvbhAllOptions
    };
  }, [data, filters.khuVuc, filters.nvbh, filters.kh]);

  const handleRegister = async () => {
    if (selectedRowKeys.length === 0) return;

    modal.confirm({
      title: 'Xác nhận gửi đăng ký',
      content: `Bạn đang gửi yêu cầu điều chỉnh cho ${selectedRowKeys.length} khách hàng.`,
      onOk: async () => {
        setRegistering(true);
        try {
          const selectedRows = data.filter(r => selectedRowKeys.includes(r.Mã_KH));
          const rows = selectedRows.map(r => {
            const change = changes[r.Mã_KH] || {};
            return {
              Khu_vuc: r.Khu_Vực,
              Ma_KH: r.Mã_KH,
              Ten_KH: r.Tên_KH,
              DC: r.Địa_Chỉ,
              Ma_ten_nvbh_CU: r.Mã_Tên_NVBH,
              Thu_CU: r.Thứ,
              Tan_suat_CU: r.Tần_Suất,
              Ma_ten_nvbh_MOI: change.nvbh_moi || r.Mã_Tên_NVBH,
              Thu_MOI: change.thu_moi !== undefined ? change.thu_moi : r.Thứ,
              Tan_suat_MOI: change.ts_moi || r.Tần_Suất,
            };
          });

          const result = await registerChinhtuyen({
            rows,
            nguoi_dang_ky: 'Admin',
          });
 
          if (!result.success) {
            message.error(result.error || 'Lỗi hệ thống');
          } else {
            message.success(result.message || 'Đã gửi yêu cầu điều chỉnh thành công');
            setChanges({});
            setSelectedRowKeys([]);
            fetchData();
          }
        } catch (error) {
          message.error('Lỗi hệ thống');
        } finally {
          setRegistering(false);
        }
      }
    });
  };

  return (
    <Flex vertical gap={16} className="h-full">
      <div>
        <KPSDSFilters 
          filters={filters}
          options={options}
          onChange={handleFilterChange}
          onReload={fetchData}
          loading={loading}
          hideShowAll={true}
          requiredFilters={['khuVuc', 'nvbh']}
        />
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-1" />

      <div className="flex-1 overflow-hidden">
        <DangkyTuyenTable
          data={filteredData}
          loading={loading}
          pendingStatus={pendingStatus}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={setSelectedRowKeys}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          changes={changes}
          onUpdate={handleUpdate}
          nvbhOptions={options.nvbhAll}
        />
      </div>

      <Flex justify="start" align="center" className="mt-auto py-3 px-2 border-t border-gray-50 action-bar-container bg-white/50 backdrop-blur-sm">
        <Space size={12}>
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchData}
            loading={loading}
            className="rounded-lg shadow-sm"
          >
            Làm mới
          </Button>

          <Button
            icon={<SendOutlined />}
            type="primary"
            disabled={selectedRowKeys.length === 0}
            onClick={handleRegister}
            loading={registering}
            className={`rounded-lg shadow-sm border-none ${selectedRowKeys.length > 0 ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
          >
            Gửi yêu cầu điều chỉnh {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
          </Button>
        </Space>
      </Flex>
    </Flex>
  );
}
