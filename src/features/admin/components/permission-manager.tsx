'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, Tabs, Tree, Button, App, Spin, Select, Typography, Divider, Space, Tag, Alert
} from 'antd';
import { 
  SaveOutlined, TeamOutlined, UserOutlined, LockOutlined, 
  SafetyCertificateOutlined, InfoCircleOutlined 
} from '@ant-design/icons';
import { getPermissions, savePermissions, getAllUsers } from '../actions/permissions';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

// Định nghĩa cấu trúc cây quyền (Menu + Nút)
const PERMISSION_TREE = [
  {
    title: 'Dashboard (Tổng quan)',
    key: 'menu:/dashboard',
  },
  {
    title: 'Khối Khách hàng',
    key: 'group:khach-hang',
    children: [
      { title: 'Khách hàng KPSDS', key: 'menu:/dashboard/khach-hang/kpsds' },
      { title: 'Khách hàng Chợ - Phố', key: 'menu:/dashboard/khach-hang/cho-pho' },
      { 
        title: 'Duyệt Chợ - Phố', 
        key: 'menu:/dashboard/khach-hang/duyet-cho-pho',
        children: [
          { title: 'Nút: Duyệt hồ sơ', key: 'action:duyet-cho-pho:approve' },
          { title: 'Nút: Xuất Excel', key: 'action:duyet-cho-pho:export' },
        ]
      },
      { 
        title: 'Duyệt tạm ngưng', 
        key: 'menu:/dashboard/khach-hang/tam-ngung',
        children: [
          { title: 'Nút: Duyệt tạm ngưng', key: 'action:tam-ngung:approve' },
        ]
      },
    ]
  },
  {
    title: 'Khối Tuyến bán hàng',
    key: 'group:tuyen-ban-hang',
    children: [
      { title: 'Xem nhanh tuyến', key: 'menu:/dashboard/tuyen-ban-hang/xem-nhanh' },
      { title: 'Điều chỉnh tuyến', key: 'menu:/dashboard/tuyen-ban-hang/dieu-chinh' },
      { 
        title: 'Duyệt chỉnh tuyến', 
        key: 'menu:/dashboard/tuyen-ban-hang/duyet-chinh',
        children: [
          { title: 'Nút: Duyệt chỉnh tuyến', key: 'action:duyet-chinh:approve' },
        ]
      },
    ]
  },
  {
    title: 'Khối Báo cáo',
    key: 'group:bao-cao',
    children: [
      { title: 'Báo cáo bao phủ', key: 'menu:/dashboard/cau-hinh' },
      { title: 'Báo cáo mở mới', key: 'menu:/dashboard/bao-cao-mo-moi' },
    ]
  },
  {
    title: 'Hệ thống Quản trị',
    key: 'group:admin',
    children: [
      { title: 'Quản lý Phân quyền', key: 'menu:/dashboard/admin/permissions' },
    ]
  }
];

export default function PermissionManager({ adminUsername }: { adminUsername: string }) {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<'ROLE' | 'USER'>('ROLE');
  const [selectedRole, setSelectedRole] = useState<string>('GSBH');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const ROLES = ['RSM', 'ASM', 'GSBH'];

  // Load danh sách users cho Tab Cá nhân
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await getAllUsers();
      if (res.success) setUsers(res.data || []);
    };
    fetchUsers();
  }, []);

  // Load quyền khi đổi Tab hoặc đối tượng
  useEffect(() => {
    const fetchPerms = async () => {
      const targetVal = activeTab === 'ROLE' ? selectedRole : selectedUser;
      if (!targetVal) {
        setCheckedKeys([]);
        return;
      }
      
      setLoading(true);
      const res = await getPermissions(activeTab, targetVal);
      if (res.success) {
        setCheckedKeys(res.data || []);
      }
      setLoading(false);
    };
    fetchPerms();
  }, [activeTab, selectedRole, selectedUser]);

  const handleSave = async () => {
    const targetVal = activeTab === 'ROLE' ? selectedRole : selectedUser;
    if (!targetVal) return message.error('Vui lòng chọn đối tượng!');

    setSaveLoading(true);
    // Chỉ lưu các key thực tế (menu:... hoặc action:...), bỏ qua các key group:...
    const actualKeys = checkedKeys.filter((k: string) => !k.startsWith('group:'));
    
    const res = await savePermissions(activeTab, targetVal, actualKeys, adminUsername);
    if (res.success) {
      message.success(res.message);
    } else {
      message.error(res.error);
    }
    setSaveLoading(false);
  };

  return (
    <Card 
      className="shadow-md rounded-xl"
      title={
        <Space>
          <SafetyCertificateOutlined className="text-blue-600" />
          <span>Hệ thống Quản lý Phân quyền</span>
        </Space>
      }
    >
      <Alert 
        title="Lưu ý quan trọng"
        description="Quyền của Nhóm (Role) sẽ áp dụng cho tất cả nhân viên thuộc nhóm đó. Quyền của Cá nhân (User) sẽ ghi đè lên quyền của nhóm nếu có thiết lập riêng."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        className="mb-6 rounded-lg"
      />

      <Tabs 
        activeKey={activeTab} 
        onChange={(k) => setActiveTab(k as any)}
        className="custom-tabs"
      >
        <TabPane 
          tab={<span><TeamOutlined /> Phân theo Nhóm (Role)</span>} 
          key="ROLE"
        >
          <div className="flex items-center gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
            <Text strong>Chọn Nhóm Quyền:</Text>
            <Select 
              value={selectedRole} 
              onChange={setSelectedRole} 
              style={{ width: 200 }}
              options={ROLES.map(r => ({ label: r, value: r }))}
            />
            <Tag color="blue">{selectedRole} sẽ được hưởng các quyền bên dưới</Tag>
          </div>
        </TabPane>

        <TabPane 
          tab={<span><UserOutlined /> Phân theo Cá nhân (User)</span>} 
          key="USER"
        >
          <div className="flex items-center gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
            <Text strong>Chọn Người Dùng:</Text>
            <Select 
              showSearch
              placeholder="Tìm theo Username..."
              value={selectedUser} 
              onChange={setSelectedUser} 
              style={{ width: 300 }}
              options={users.map(u => ({ label: `${u.ID} (${u.Quyen_QL})`, value: u.ID }))}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
            {selectedUser && (
              <Tag color="orange">Quyền riêng của {selectedUser} sẽ ghi đè quyền nhóm</Tag>
            )}
          </div>
        </TabPane>
      </Tabs>

      <Divider>Danh sách Menu & Tính năng</Divider>

      <div className="bg-white border rounded-xl p-6 min-h-[400px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <Spin size="large" tip="Đang tải dữ liệu quyền..." />
          </div>
        ) : (activeTab === 'USER' && !selectedUser) ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
            <UserOutlined style={{ fontSize: 48 }} />
            <p className="mt-4">Vui lòng chọn người dùng để bắt đầu phân quyền</p>
          </div>
        ) : (
          <Tree
            checkable
            defaultExpandAll
            checkedKeys={checkedKeys}
            onCheck={(keys) => setCheckedKeys(keys)}
            treeData={PERMISSION_TREE}
            className="text-base"
          />
        )}
      </div>

      <div className="mt-8 text-right">
        <Button 
          type="primary" 
          size="large" 
          icon={<SaveOutlined />} 
          loading={saveLoading}
          onClick={handleSave}
          className="bg-blue-600 rounded-lg px-8 h-12 font-bold shadow-lg shadow-blue-500/20"
        >
          LƯU CẬP NHẬT QUYỀN
        </Button>
      </div>
    </Card>
  );
}
