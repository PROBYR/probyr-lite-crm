import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { ContactsList } from './pages/ContactsList';
import { ContactProfile } from './pages/ContactProfile';
import { Pipeline } from './pages/Pipeline';
import { TasksDashboard } from './pages/TasksDashboard';
import { ImportWizard } from './pages/ImportWizard';
import { Settings } from './pages/Settings';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppInner() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/contacts" replace />} />
          <Route path="/contacts" element={<ContactsList />} />
          <Route path="/contacts/:id" element={<ContactProfile />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/tasks" element={<TasksDashboard />} />
          <Route path="/import" element={<ImportWizard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
