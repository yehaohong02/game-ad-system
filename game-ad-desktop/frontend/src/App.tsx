import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <HashRouter>
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
