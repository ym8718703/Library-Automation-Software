import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Publishers from './pages/Publishers';
import Members from './pages/Members';
import Staff from './pages/Staff';
import IssueBook from './pages/IssueBook';
import ReturnBook from './pages/ReturnBook';
import FineManagement from './pages/FineManagement';
import Receipts from './pages/Receipts';
import Reports from './pages/Reports';
import DatabaseExplorer from './pages/DatabaseExplorer';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="books" element={<Books />} />
          <Route path="publishers" element={<Publishers />} />
          <Route path="members" element={<Members />} />
          <Route path="staff" element={<Staff />} />
          <Route path="issue-book" element={<IssueBook />} />
          <Route path="return-book" element={<ReturnBook />} />
          <Route path="fines" element={<FineManagement />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="explorer" element={<DatabaseExplorer />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
