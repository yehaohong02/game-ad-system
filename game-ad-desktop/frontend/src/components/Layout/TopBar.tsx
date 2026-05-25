import { useState } from 'react';
import { Input, Badge, Avatar, Space, Drawer, Dropdown, Button, Modal, message } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settings';
import { useManagerModeStore } from '../../stores/managerMode';
import Settings from '../../pages/Settings';

function isManagerAuthorized(): boolean {
  return localStorage.getItem('manager_authorized') === '1';
}

export default function TopBar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [authError, setAuthError] = useState(false);
  const { aiEnabled } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isManagerMode = location.pathname.startsWith('/manager');

  const handleManagerAccess = () => {
    if (isManagerAuthorized()) {
      useManagerModeStore.getState().setMode('manager');
      navigate('/manager');
    } else {
      setSecretKey('');
      setAuthError(false);
      setAuthModalOpen(true);
    }
  };

  const handleAuthSubmit = () => {
    if (secretKey === '789') {
      localStorage.setItem('manager_authorized', '1');
      setAuthModalOpen(false);
      useManagerModeStore.getState().setMode('manager');
      navigate('/manager');
      message.success('权限验证通过，欢迎进入管理者模式');
    } else {
      setAuthError(true);
    }
  };

  return (
    <>
      <div
        style={{
          height: 56,
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Left: empty */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
          买量个人数据分析平台--海外三组开发
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
          {isManagerMode && (
            <Button size="small" icon={<TeamOutlined />} onClick={() => { useManagerModeStore.getState().setMode('designer'); navigate('/'); }}
              style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
              切换回设计师模式
            </Button>
          )}
          <Dropdown menu={{
            items: [
              { key: 'settings', label: '系统设置', icon: <SettingOutlined /> },
              ...(!isManagerMode ? [{ key: 'manager', label: '管理者模式', icon: <TeamOutlined /> }] : []),
            ],
            onClick: ({ key }) => {
              if (key === 'settings') setSettingsOpen(true);
              if (key === 'manager') { handleManagerAccess(); }
            }
          }}>
            <Badge dot status={aiEnabled ? 'success' : 'error'} offset={[-4, 4]}>
              <SettingOutlined style={{ fontSize: 18, color: '#94a3b8', cursor: 'pointer' }} />
            </Badge>
          </Dropdown>
          <Avatar
            size={32}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#334155', cursor: 'pointer' }}
          />
        </Space>
      </div>

      <Modal
        title={<span style={{ color: '#e2e8f0' }}><LockOutlined /> 管理者权限验证</span>}
        open={authModalOpen}
        onCancel={() => setAuthModalOpen(false)}
        footer={null}
        width={400}
        styles={{
          header: { background: '#1E293B', borderBottom: '1px solid #334155' },
          body: { background: '#1E293B', padding: '20px 24px' },
          mask: { backdropFilter: 'blur(4px)' },
        }}
      >
        <div style={{ color: '#f59e0b', fontSize: 13, marginBottom: 16, background: 'rgba(245,158,11,0.1)', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)' }}>
          管理者模式包含敏感数据，请联系管理员提升权限后访问
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>请输入授权秘钥</div>
          <Input.Password
            value={secretKey}
            onChange={e => { setSecretKey(e.target.value); setAuthError(false); }}
            onPressEnter={handleAuthSubmit}
            placeholder="请输入秘钥"
            status={authError ? 'error' : undefined}
            style={{
              backgroundColor: '#0F172A',
              borderColor: authError ? '#ef4444' : '#334155',
              color: '#e2e8f0',
            }}
          />
          {authError && (
            <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>秘钥错误，请重试</div>
          )}
        </div>
        <Button
          type="primary"
          block
          onClick={handleAuthSubmit}
          style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
        >
          验证并进入
        </Button>
      </Modal>

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
