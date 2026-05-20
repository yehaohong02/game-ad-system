import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#0F172A',
      }}
    >
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

      {/* Main Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Bar */}
        <TopBar />

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
