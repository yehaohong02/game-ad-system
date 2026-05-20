import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#4F46E5',
          borderRadius: 8,
          colorBgContainer: '#1E293B',
          colorBgLayout: '#0F172A',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
