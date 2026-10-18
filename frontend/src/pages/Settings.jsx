import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  IndianRupee, 
  Calendar, 
  BookOpen, 
  Building 
} from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    max_books_per_member: '3',
    loan_duration_days: '14',
    daily_fine_rate: '5.00',
    grace_period_days: '0',
    library_name: 'Central College of Engineering & Technology Library',
    contact_email: 'library@ccet.edu.in'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/settings');
      if (res.data.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (err) {
      setError(err.message || 'Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.put('/settings', settings);
      setSuccessMessage('Library lending policies and rules updated successfully in MySQL!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-600 mr-2" />
        Loading library configurations...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-sky-600" />
          <span>LMS Lending Rules & Configuration</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure circulation limits, default loan duration, overdue fine calculation, and institutional branding
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6 text-xs">
        {/* Circulation Lending Policy */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-sky-600" />
            <span>Circulation & Lending Policy Parameters</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Max Active Books Per Member</span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={settings.max_books_per_member}
                onChange={(e) => setSettings({ ...settings, max_books_per_member: e.target.value })}
                className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Enforced by <code className="font-mono">sp_IssueBook</code> on every checkout
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Standard Loan Duration (Days)</span>
              </label>
              <input
                type="number"
                min="1"
                max="90"
                required
                value={settings.loan_duration_days}
                onChange={(e) => setSettings({ ...settings, loan_duration_days: e.target.value })}
                className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Determines <code className="font-mono">DueDate = IssueDate + INTERVAL N DAY</code>
              </span>
            </div>
          </div>
        </div>

        {/* Fine & Penalty Structure */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>Overdue Penalty & Fine Policy</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Daily Overdue Fine Rate (₹ per day)
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                value={settings.daily_fine_rate}
                onChange={(e) => setSettings({ ...settings, daily_fine_rate: e.target.value })}
                className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Applied dynamically on return: <code className="font-mono">DaysOverdue × Rate</code>
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Grace Period (Days)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                required
                value={settings.grace_period_days}
                onChange={(e) => setSettings({ ...settings, grace_period_days: e.target.value })}
                className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Number of days allowed past due date before penalties start
              </span>
            </div>
          </div>
        </div>

        {/* Institutional Branding */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-slate-600" />
            <span>Institutional Details (Printed on Invoices & Receipts)</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Library Name</label>
              <input
                type="text"
                required
                value={settings.library_name}
                onChange={(e) => setSettings({ ...settings, library_name: e.target.value })}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Contact Email</label>
              <input
                type="email"
                required
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Configuration Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
