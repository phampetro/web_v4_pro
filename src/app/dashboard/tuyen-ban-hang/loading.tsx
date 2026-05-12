'use client';

import React from 'react';
import { Skeleton, Card, Space, Flex } from 'antd';

export default function Loading() {
  return (
    <div className="p-4 h-full flex flex-col gap-4">
      {/* Header Skeleton */}
      <Card size="small" className="shadow-sm">
        <Flex justify="space-between" align="center">
          <Space orientation="vertical" size={4}>
            <Skeleton.Input active size="small" style={{ width: 200 }} />
            <Skeleton.Input active size="small" style={{ width: 300 }} />
          </Space>
          <Space>
            <Skeleton.Button active size="small" />
            <Skeleton.Button active size="small" />
          </Space>
        </Flex>
      </Card>

      {/* Filters Skeleton */}
      <Card size="small" className="shadow-sm">
        <Space size={16} wrap>
          <Skeleton.Input active style={{ width: 150 }} />
          <Skeleton.Input active style={{ width: 150 }} />
          <Skeleton.Input active style={{ width: 150 }} />
          <Skeleton.Input active style={{ width: 120 }} />
          <Skeleton.Button active />
        </Space>
      </Card>

      {/* Table Skeleton */}
      <Card className="flex-1 shadow-sm overflow-hidden">
        <div className="p-4">
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      </Card>

      {/* Footer Skeleton */}
      <Card size="small" className="mt-auto shadow-sm">
        <Flex justify="start" align="center">
          <Space>
            <Skeleton.Button active />
            <Skeleton.Button active style={{ width: 150 }} />
          </Space>
        </Flex>
      </Card>
    </div>
  );
}
