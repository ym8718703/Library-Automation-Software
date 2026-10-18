import React from 'react';
import { Menu, Database, ShieldCheck, Clock } from 'lucide-react';

export default function Navbar({ setMobileOpen, pageTitle }) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-slate-800 tracking-tight">{pageTitle}</h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium px-3 py-1.5 bg-slate-100 rounded-full">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDate}</span>
        </div>

        {/* Database Live Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline">MySQL Database:</span>
          <span className="font-semibold font-mono text-[11px]">Connected</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>
    </header>
  );
}
