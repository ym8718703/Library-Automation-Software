import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Building2, 
  Users, 
  UserCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  IndianRupee, 
  Receipt, 
  BarChart3, 
  Database, 
  Settings,
  Library
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Books', path: '/books', icon: BookOpen },
  { name: 'Publishers', path: '/publishers', icon: Building2 },
  { name: 'Members', path: '/members', icon: Users },
  { name: 'Staff', path: '/staff', icon: UserCheck },
  { name: 'Issue Book', path: '/issue-book', icon: ArrowUpRight },
  { name: 'Return Book', path: '/return-book', icon: ArrowDownLeft },
  { name: 'Fine Management', path: '/fines', icon: IndianRupee },
  { name: 'Receipts', path: '/receipts', icon: Receipt },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Database Explorer', path: '/explorer', icon: Database },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Persistent Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-white tracking-tight leading-tight">LibraryMS</h1>
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              MySQL 8.0 Engine
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-sky-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Database Status Footer */}
        <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400 bg-slate-950/20">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium text-slate-300">RDBMS Storage</span>
            <span className="text-emerald-400 font-mono text-[11px]">InnoDB</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            Strict ACID • Normalized 3NF
          </p>
        </div>
      </aside>
    </>
  );
}
