import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Users, 
  UserCheck, 
  IndianRupee, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  RefreshCw 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/stats');
      setData(res.data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mb-3" />
        <p className="text-sm font-medium">Aggregating live MySQL metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm">
        <p className="font-semibold">Unable to load dashboard data</p>
        <p className="mt-1 text-xs">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-medium hover:bg-rose-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { summary, monthlyIssues, monthlyFines, popularBooks, publisherDistribution, recentActivity } = data;

  const statCards = [
    { label: 'Unique Titles', value: summary.totalTitles, icon: BookOpen, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Total Copies', value: summary.totalCopies, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Available Copies', value: summary.availableCopies, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Currently Issued', value: summary.currentlyIssuedBooks, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue Books', value: summary.overdueBooks, icon: AlertOctagon, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total Members', value: `${summary.activeMembers}/${summary.totalMembers} active`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Staff', value: summary.activeStaff, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Outstanding Fines', value: `₹${summary.totalOutstandingFines.toFixed(2)}`, icon: AlertOctagon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Fines Collected', value: `₹${summary.totalFineCollected.toFixed(2)}`, icon: IndianRupee, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Library Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time circulation metrics queried directly from MySQL 8.0</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/issue-book"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Issue Book</span>
          </Link>
          <Link
            to="/return-book"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Return Book</span>
          </Link>
          <button
            onClick={fetchStats}
            title="Refresh statistics"
            className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Grid (9 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-9 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500 truncate" title={card.label}>
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-md ${card.bg} ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg font-bold text-slate-900 tracking-tight">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Issue Activity Chart */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Monthly Book Issuance Trends</h3>
              <p className="text-xs text-slate-500">Number of books checked out per month</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyIssues} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="MonthLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Bar dataKey="IssueCount" name="Books Issued" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Fine Collection Trends */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Fine & Revenue Collections</h3>
              <p className="text-xs text-slate-500">Total payments collected in INR (₹)</p>
            </div>
            <IndianRupee className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFines} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fineColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="MonthLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val) => `₹${parseFloat(val).toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="TotalCollected" name="Collections (₹)" stroke="#10b981" fillOpacity={1} fill="url(#fineColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Borrowed Books */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Top 5 Most Borrowed Books</h3>
              <p className="text-xs text-slate-500">Highest circulation frequency</p>
            </div>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={popularBooks} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="Title" type="category" width={110} tick={{ fontSize: 10, fill: '#334155' }} />
                <Tooltip 
                  formatter={(val) => [`${val} times`, 'Borrowed']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="BorrowCount" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Publisher Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Publisher Inventory Distribution</h3>
              <p className="text-xs text-slate-500">Total physical copy stock by publishing house</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={publisherDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="PublisherName" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="TotalCopies" name="Total Copies" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Circulation Transactions Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Lending Activity</h3>
            <p className="text-xs text-slate-500">Latest borrowing transactions recorded in BookIssued table</p>
          </div>
          <Link
            to="/issue-book"
            className="text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors"
          >
            New Checkout &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Issue ID</th>
                <th className="px-4 py-2.5">Book Title</th>
                <th className="px-4 py-2.5">Member</th>
                <th className="px-4 py-2.5">Issue Date</th>
                <th className="px-4 py-2.5">Due Date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity.map((item) => (
                <tr key={item.IssueID} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">
                    #{item.IssueID}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate" title={item.BookTitle}>
                    {item.BookTitle}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.MemberName}</td>
                  <td className="px-4 py-3 text-slate-500">{item.IssueDate}</td>
                  <td className="px-4 py-3 text-slate-500">{item.DueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      item.Status === 'Issued' 
                        ? 'bg-amber-100 text-amber-800'
                        : item.Status === 'Returned'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.Status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.StaffName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
