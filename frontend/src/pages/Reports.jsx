import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart3, 
  Download, 
  Printer, 
  RefreshCw, 
  Calendar, 
  FileSpreadsheet, 
  CheckCircle2, 
  Layers, 
  Users, 
  BookOpen, 
  IndianRupee, 
  UserCheck 
} from 'lucide-react';

const reportOptions = [
  { id: 'inventory', name: 'Catalog Inventory & Stock Valuation', icon: Layers, endpoint: '/reports/inventory' },
  { id: 'available', name: 'Available Books (In Stock)', icon: BookOpen, endpoint: '/reports/available' },
  { id: 'current-issues', name: 'Current Active Borrowings', icon: BookOpen, endpoint: '/reports/current-issues' },
  { id: 'overdue', name: 'Overdue Books & Accrued Fines', icon: IndianRupee, endpoint: '/reports/overdue' },
  { id: 'member-borrowing', name: 'Member Borrowing Summary', icon: Users, endpoint: '/reports/member-borrowing' },
  { id: 'staff-activity', name: 'Staff Operational Performance', icon: UserCheck, endpoint: '/reports/staff-activity' },
  { id: 'publisher-inventory', name: 'Publisher Stock Distribution', icon: Layers, endpoint: '/reports/publisher-inventory' },
  { id: 'fine-collection', name: 'Fine & Revenue Collections', icon: IndianRupee, endpoint: '/reports/fine-collection' },
  { id: 'popular-books', name: 'Most Borrowed Books Roster', icon: BarChart3, endpoint: '/reports/popular-books' }
];

export default function Reports() {
  const [activeReportId, setActiveReportId] = useState('inventory');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeOption = reportOptions.find(r => r.id === activeReportId);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(activeOption.endpoint);
      setReportData(res.data);
    } catch (err) {
      setError(err.message || 'Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReportId]);

  // Export to CSV function
  const handleExportCSV = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      alert('No data available to export');
      return;
    }

    const rows = reportData.data;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(field => {
          const val = row[field] === null || row[field] === undefined ? '' : String(row[field]);
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeReportId}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>Analytical Reports & Administrative Audits</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SQL joins, aggregate computations, subqueries, and database views power all reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!reportData || !reportData.data || reportData.data.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Categories Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
        {reportOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = opt.id === activeReportId;
          return (
            <button
              key={opt.id}
              onClick={() => setActiveReportId(opt.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.name}</span>
            </button>
          );
        })}
      </div>

      {/* Report Content Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        {/* Title & Metadata bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">{activeOption.name}</h2>
            <p className="text-xs text-slate-400">
              Generated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
          <button
            onClick={fetchReport}
            title="Refresh Report Data"
            className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 border border-slate-200 rounded hover:bg-slate-50"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh SQL Query</span>
          </button>
        </div>

        {/* Summary highlights if present */}
        {reportData && reportData.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
            {Object.entries(reportData.summary).map(([key, val]) => (
              <div key={key}>
                <span className="text-[11px] text-slate-500 uppercase tracking-wide block">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{String(val)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Report Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600 mr-2" />
            Executing report queries against MySQL...
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
            {error}
          </div>
        ) : !reportData || (!reportData.data && !reportData.transactions) ? (
          <div className="py-12 text-center text-slate-400 text-xs">No records returned.</div>
        ) : (
          <div className="overflow-x-auto">
            {reportData.data ? (
              <table className="w-full text-left text-xs border border-slate-200 rounded">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    {Object.keys(reportData.data[0] || {}).map((col) => (
                      <th key={col} className="px-3.5 py-2.5 whitespace-nowrap">
                        {col.replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      {Object.keys(row).map((col) => (
                        <td key={col} className="px-3.5 py-2 whitespace-nowrap text-slate-700 font-sans">
                          {typeof row[col] === 'number' && col.toLowerCase().includes('price') 
                            ? `₹${row[col].toFixed(2)}` 
                            : typeof row[col] === 'number' && (col.toLowerCase().includes('fine') || col.toLowerCase().includes('valuation') || col.toLowerCase().includes('total'))
                            ? String(row[col])
                            : row[col] === null ? '—' : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : reportData.transactions ? (
              /* Specific Fine Collection report view */
              <table className="w-full text-left text-xs border border-slate-200 rounded">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="px-3.5 py-2.5">Transaction ID</th>
                    <th className="px-3.5 py-2.5">Member</th>
                    <th className="px-3.5 py-2.5">Staff</th>
                    <th className="px-3.5 py-2.5">Type</th>
                    <th className="px-3.5 py-2.5">Mode</th>
                    <th className="px-3.5 py-2.5 font-mono">Amount (₹)</th>
                    <th className="px-3.5 py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.transactions.map((t) => (
                    <tr key={t.ReceiptID} className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-mono">{t.TransactionID}</td>
                      <td className="px-3.5 py-2 font-medium">{t.MemberName}</td>
                      <td className="px-3.5 py-2 text-slate-600">{t.StaffName}</td>
                      <td className="px-3.5 py-2">{t.TransactionType}</td>
                      <td className="px-3.5 py-2">{t.PaymentMethod}</td>
                      <td className="px-3.5 py-2 font-mono font-bold text-slate-900">₹{parseFloat(t.Amount).toFixed(2)}</td>
                      <td className="px-3.5 py-2 text-slate-500">{t.TransactionDateTime?.slice(0, 16).replace('T', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
