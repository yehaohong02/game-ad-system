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
import CheatDashboard from './pages/CheatDashboard';
import CheatScore from './pages/CheatScore';
import CheatPredict from './pages/CheatPredict';
import CheatRetro from './pages/CheatRetro';
import CheatRubric from './pages/CheatRubric';

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
          <Route path="/cheat" element={<CheatDashboard />} />
          <Route path="/cheat/score" element={<CheatScore />} />
          <Route path="/cheat/predict" element={<CheatPredict />} />
          <Route path="/cheat/retro" element={<CheatRetro />} />
          <Route path="/cheat/rubric" element={<CheatRubric />} />

          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/data" element={<ManagerDataDiagnosis />} />
          <Route path="/manager/creative" element={<ManagerCreativeInsight />} />
          <Route path="/manager/execution" element={<ManagerExecution />} />
          <Route path="/manager/safety" element={<ManagerSafety />} />
          <Route path="/manager/memory" element={<ManagerMemory />} />
          <Route path="/manager/reports" element={<ManagerReports />} />
          <Route path="/manager/platform" element={<PlatformData />} />
          <Route path="/manager/workshop" element={<Workshop />} />
          <Route path="/manager/cheat" element={<CheatDashboard />} />
          <Route path="/manager/cheat/score" element={<CheatScore />} />
          <Route path="/manager/cheat/predict" element={<CheatPredict />} />
          <Route path="/manager/cheat/retro" element={<CheatRetro />} />
          <Route path="/manager/cheat/rubric" element={<CheatRubric />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}