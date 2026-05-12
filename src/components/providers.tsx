'use client';

import React from 'react';
import { ConfigProvider, theme, App } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import viVN from 'antd/locale/vi_VN';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={viVN}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#4f46e5', // Indigo-600 gần với OKLCH(55% 0.18 250)
            borderRadius: 8,
            fontFamily: 'var(--font-geist-sans)',
          },
          components: {
            Button: {
              borderRadius: 8,
              controlHeight: 36,
            },
            Table: {
              borderRadius: 8,
              fontSize: 13,
            },
          },
        }}
      >
        <App>
          {children}
        </App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
