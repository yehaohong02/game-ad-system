import { HashRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import DataDiagnosis from './pages/DataDiagnosis';
import CreativeInsightNew from './pages/CreativeInsightNew';
import Execution from './pages/Execution';
import Safety from './pages/Safety';
import Memory from './pages/Memory';
import PlatformData from './pages/PlatformData';
import Workshop from './pages/Workshop';
import Reports from './pages/Reports';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerDataDiagnosis from './pages/manager/ManagerDataDiagnosis';
import ManagerCreativeInsight from './pages/manager/ManagerCreativeInsight';
import ManagerExecution from './pages/manager/ManagerExecution';
import ManagerSafety from './pages/manager/ManagerSafety';
import ManagerMemory from './pages/manager/ManagerMemory';
import ManagerReports from './pages/manager/ManagerReports';

function NotFound() {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <h1>404</h1>
      <p>页面不存在</p>
      <a href="#/">返回首页</a>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/data" element={<DataDiagnosis />} />
          <Route path="/creative" element={<CreativeInsightNew />} />
          <Route path="/execution" element={<Execution />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/platform" element={<PlatformData />} />
          <Route path="/workshop" element={<Workshop />} />
          <Route path="/reports" element={<Reports />} />

          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/data" element={<ManagerDataDiagnosis />} />
          <Route path="/manager/creative" element={<ManagerCreativeInsight />} />
          <Route path="/manager/execution" element={<ManagerExecution />} />
          <Route path="/manager/safety" element={<ManagerSafety />} />
          <Route path="/manager/memory" element={<ManagerMemory />} />
          <Route path="/manager/reports" element={<ManagerReports />} />
          <Route path="/manager/platform" element={<PlatformData />} />
          <Route path="/manager/workshop" element={<Workshop />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}