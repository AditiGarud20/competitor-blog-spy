import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CompetitorsPage } from './pages/CompetitorsPage';
import { AddCompetitorPage } from './pages/AddCompetitorPage';
import { CompetitorDetailPage } from './pages/CompetitorDetailPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { MonitoringLogsPage } from './pages/MonitoringLogsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ScaleTestPage } from './pages/ScaleTestPage';
import { DemoLabPage } from './pages/DemoLabPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { ChecklistPage } from './pages/ChecklistPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/competitors" element={<CompetitorsPage />} />
          <Route path="/competitors/new" element={<AddCompetitorPage />} />
          <Route path="/competitors/:id" element={<CompetitorDetailPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
          <Route path="/monitoring" element={<LiveMonitoringPage />} />
          <Route path="/logs" element={<MonitoringLogsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/scale-test" element={<ScaleTestPage />} />
          <Route path="/demo-lab" element={<DemoLabPage />} />
          <Route path="/system-health" element={<SystemHealthPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
