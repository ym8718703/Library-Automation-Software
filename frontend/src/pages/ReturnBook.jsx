import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import { 
  ArrowDownLeft, 
  Search, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  IndianRupee, 
  RefreshCw, 
  AlertCircle, 
  BookOpen, 
  X 
} from 'lucide-react';

export default function ReturnBook() {
  const [activeIssues, setActiveIssues] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  // Search filter
  const [search, setSearch] = useState('');

  // Selected for return
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [confirmReturnTarget, setConfirmReturnTarget] = useState(null);
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [issuesRes, staffRes] = await Promise.all([
        api.get('/issues?status=Issued&limit=100'),
        api.get('/staff?active=true&limit=100')
      ]);

      setActiveIssues(issuesRes.data.data);
      const staff = staffRes.data.data;
      setStaffList(staff);
      if (staff.length > 0 && !selectedStaffId) {
        setSelectedStaffId(String(staff[0].StaffID));
      }
    } catch (err) {
      setError('Error loading active loan records: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered active issues
  const filteredIssues = activeIssues.filter(item =>
    item.BookTitle.toLowerCase().includes(search.toLowerCase()) ||
    item.MemberName.toLowerCase().includes(search.toLowerCase()) ||
    item.ISBN.includes(search) ||
    String(item.IssueID).includes(search)
  );

  // Calculate live fine for display
  const calculateFine = (dueDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return {
        daysOverdue: diffDays,
        fineAmount: diffDays * 5.0 // ₹5 per day
      };
    }
    return {
      daysOverdue: 0,
      fineAmount: 0.0
    };
  };

  const handleReturnInitiate = (issue) => {
    setSelectedIssue(issue);
    setConfirmReturnTarget(issue);
  };

  const handleConfirmReturn = async () => {
    if (!confirmReturnTarget || !selectedStaffId) return;

    setReturnSubmitting(true);
    try {
      const res = await api.post(`/issues/${confirmReturnTarget.IssueID}/return`, {
        StaffID: selectedStaffId
      });

      setSuccessResult({
        ...res.data.data,
        bookTitle: confirmReturnTarget.BookTitle,
        memberName: confirmReturnTarget.MemberName,
        message: res.data.message
      });

      setConfirmReturnTarget(null);
      setSelectedIssue(null);
      loadData();
    } catch (err) {
      alert(`Return Error: ${err.message}`);
    } finally {
      setReturnSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
          <span>Book Return & Fine Assessment Desk</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Process book returns, assess dynamic overdue penalties (₹5/day), and restore catalog inventory via <code className="font-mono text-emerald-700">sp_ReturnBook</code>
        </p>
      </div>

      {/* Success Notification */}
      {successResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-sm text-emerald-800">Return Processed Successfully!</span>
            </div>
            <button onClick={() => setSuccessResult(null)}>
              <X className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
          <p className="font-medium text-slate-700">{successResult.message}</p>
          <div className="flex gap-4 font-mono text-[11px] bg-white/70 p-2.5 rounded border border-emerald-100">
            <span>Issue ID: <strong>#{successResult.IssueID}</strong></span>
            <span>Book: <strong>{successResult.bookTitle}</strong></span>
            <span>Borrower: <strong>{successResult.memberName}</strong></span>
            <span>Fine Assessed: <strong>₹{parseFloat(successResult.FineAssessed).toFixed(2)}</strong></span>
          </div>
        </div>
      )}

      {/* Toolbar & Staff Selector */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search active issues by title, member, ISBN, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 shrink-0">Processing Staff:</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800 font-medium focus:ring-1 focus:ring-sky-500"
            >
              {staffList.map((s) => (
                <option key={s.StaffID} value={s.StaffID}>
                  {s.Name} ({s.Post})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadData}
            title="Refresh list"
            className="p-1.5 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Borrowing Transactions List */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Active Issued Loans Awaiting Return ({filteredIssues.length})
          </h3>
          <span className="text-[11px] text-slate-500">Fine Rate: ₹5.00 / day overdue</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600 mr-2" />
            Loading active loans...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700 text-xs">{error}</div>
        ) : filteredIssues.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No active borrowed books found</p>
            <p className="text-xs text-slate-400 mt-1">All borrowed books have been returned or match no search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Issue ID</th>
                  <th className="px-4 py-3">Book Title</th>
                  <th className="px-4 py-3">Borrower (Member)</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-center">Overdue Days</th>
                  <th className="px-4 py-3">Assessed Fine</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((issue) => {
                  const { daysOverdue, fineAmount } = calculateFine(issue.DueDate);
                  const isOverdue = daysOverdue > 0;

                  return (
                    <tr key={issue.IssueID} className={`transition-colors hover:bg-slate-50/80 ${isOverdue ? 'bg-rose-50/20' : ''}`}>
                      <td className="px-4 py-3 font-mono font-medium text-slate-700">#{issue.IssueID}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{issue.BookTitle}</div>
                        <div className="text-[11px] font-mono text-slate-400">ISBN: {issue.ISBN}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{issue.MemberName}</div>
                        <div className="text-[11px] text-slate-500">Member #{issue.MemberID}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{issue.IssueDate}</td>
                      <td className="px-4 py-3 font-medium">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {issue.DueDate}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        {isOverdue ? (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[11px]">
                            {daysOverdue} days
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">On Schedule</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {isOverdue ? (
                          <span className="font-bold text-rose-700">₹{fineAmount.toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">₹0.00</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleReturnInitiate(issue)}
                          className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition-colors"
                        >
                          Process Return
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Confirmation Modal */}
      {confirmReturnTarget && (
        <ConfirmModal
          isOpen={Boolean(confirmReturnTarget)}
          title={`Confirm Book Return: Issue #${confirmReturnTarget.IssueID}`}
          message={`Returning "${confirmReturnTarget.BookTitle}" borrowed by ${confirmReturnTarget.MemberName}. Overdue penalty: ₹${calculateFine(confirmReturnTarget.DueDate).fineAmount.toFixed(2)}. Authorizing staff ID: #${selectedStaffId}. Inventory will be automatically restored.`}
          confirmText="Confirm Return"
          confirmVariant="primary"
          loading={returnSubmitting}
          onConfirm={handleConfirmReturn}
          onClose={() => setConfirmReturnTarget(null)}
        />
      )}
    </div>
  );
}
