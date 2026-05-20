import { useState } from 'react';
import { Input, Badge, Avatar, Space, Drawer, Tooltip } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settings';
import Settings from '../../pages/Settings';

const ROUTE_TITLES: Record<string, string> = {
  '/': '总览仪表盘',
  '/data': '数据诊断',
  '/creative': '创意洞察',
  '/execution': '智能执行',
  '/safety': '安全防护',
  '/memory': '记忆沉淀',
  '/platform': '平台数据',
  '/workshop': '制作工坊',
  '/reports': '报告中心',
};

export default function TopBar() {
  const location = useLocation();
  const basePath = '/' + location.pathname.split('/')[1];
  const pageTitle = ROUTE_TITLES[basePath] || '买量个人数据分析平台--海外三组开发';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { aiEnabled } = useSettingsStore();

  return (
    <>
      <div
        style={{
          height: 56,
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
        }}
      >
        {/* Left: Page Title */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#e2e8f0',
          }}
        >
          {pageTitle}
        </div>

        {/* Right: Actions */}
        <Space size={16} align="center">
          <Input
            placeholder="搜索..."
            prefix={<SearchOutlined style={{ color: '#64748b' }} />}
            style={{
              width: 200,
              backgroundColor: '#1E293B',
              borderColor: '#334155',
              color: '#e2e8f0',
            }}
            variant="borderless"
          />
          <Badge count={3} size="small" offset={[-2, 2]}>
            <BellOutlined
              style={{ fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}
            />
          </Badge>
          <Tooltip title={aiEnabled ? 'AI 已激活 · 点击设置' : 'AI 未激活 · 点击配置'}>
            <Badge dot status={aiEnabled ? 'success' : 'error'} offset={[-4, 4]}>
              <SettingOutlined
                style={{ fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setSettingsOpen(true)}
              />
            </Badge>
          </Tooltip>
          <Avatar
            size={32}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#334155', cursor: 'pointer' }}
          />
        </Space>
      </div>

      <Drawer
        title="系统设置"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={860}
        styles={{
          header: { background: '#0F172A', borderBottom: '1px solid #334155' },
          body: { background: '#0F172A', padding: '16px 24px' },
        }}
      >
        <Settings />
      </Drawer>
    </>
  );
}
