import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Badge } from 'antd';
import {
  DashboardOutlined,
  ExperimentOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  RocketOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 220;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: '/data',
    icon: <ExperimentOutlined />,
    label: '买量表格数据',
  },
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '数据诊断',
  },
  {
    key: '/creative',
    icon: <BulbOutlined />,
    label: '创意洞察',
  },
  {
    key: '/execution',
    icon: <ThunderboltOutlined />,
    label: '智能执行',
  },
  {
    key: '/safety',
    icon: <SafetyOutlined />,
    label: '安全防护',
  },
  {
    key: '/memory',
    icon: <DatabaseOutlined />,
    label: '记忆沉淀',
  },
  { type: 'divider' },
  {
    key: '/platform',
    icon: <GlobalOutlined />,
    label: '平台数据',
  },
  {
    key: '/workshop',
    icon: <RocketOutlined />,
    label: '制作工坊',
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: '报告中心',
  },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isManagerMode = location.pathname.startsWith('/manager');

  const selectedKey = isManagerMode
    ? (location.pathname === '/manager' ? '/manager' : location.pathname)
    : '/' + location.pathname.split('/')[1];

  const managerExcludedKeys = ['/platform', '/workshop'];
  const effectiveMenuItems = isManagerMode
    ? menuItems.map(item => {
        if (!item) return item;
        if ('type' in item && item.type === 'divider') return item;
        const originalKey = item.key as string;
        if (managerExcludedKeys.includes(originalKey)) return item;
        const newKey = originalKey === '/' ? '/manager' : `/manager${originalKey}`;
        return { ...item, key: newKey };
      })
    : menuItems;

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  return (
    <div
      style={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        minWidth: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        height: '100vh',
        backgroundColor: '#0F172A',
        borderRight: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s, min-width 0.2s',
        overflow: 'hidden',
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid #1E293B',
          flexShrink: 0,
          cursor: 'pointer',
          gap: 10,
        }}
        onClick={() => onCollapse(!collapsed)}
      >
      </div>

      {/* Navigation Menu */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={effectiveMenuItems}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
          style={{
            backgroundColor: 'transparent',
            borderRight: 'none',
          }}
        />
      </div>

      {/* Bottom Status */}
      <div
        style={{
          padding: collapsed ? '12px 0' : '12px 16px',
          borderTop: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
        }}
      >
        <Badge
          status="success"
          text={
            collapsed ? undefined : (
              <span style={{ color: '#94a3b8', fontSize: 12 }}>
                全部服务正常
              </span>
            )
          }
        />
      </div>
    </div>
  );
}
