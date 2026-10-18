import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const routeTitles = {
  '/': 'Dashboard Overview',
  '/books': 'Books Catalog & Inventory',
  '/publishers': 'Publishers Management',
  '/members': 'Members Directory',
  '/staff': 'Library Staff Roster',
  '/issue-book': 'Issue Book (Circulation)',
  '/return-book': 'Return Book & Fine Assessment',
  '/fines': 'Fine Management & Settlements',
  '/receipts': 'Transaction Receipts & Invoices',
  '/reports': 'Analytical Reports & Audits',
  '/explorer': 'Database Explorer & SQL Insights',
  '/settings': 'LMS Lending Rules & Configuration',
};

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentTitle = routeTitles[location.pathname] || 'Library Management System';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Persistent Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Navbar setMobileOpen={setMobileOpen} pageTitle={currentTitle} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
