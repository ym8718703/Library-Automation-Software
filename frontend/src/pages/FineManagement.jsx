import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import ReceiptModal from '../components/ReceiptModal';
import { 
  IndianRupee, 
  Search, 
  Filter, 
  CreditCard, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Printer 
} from 'lucide-react';

export default function FineManagement() {
  const [fines, setFines] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('outstanding'); // 'outstanding', 'unpaid', 'partially-paid', 'fully-paid', 'all'
  const [page, setPage] = useState(1);

  // Payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState(null);

  // Receipt popup state
  const [generatedReceipt, setGeneratedReceipt] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [finesRes, staffRes] = await Promise.all([
        api.get('/issues/fines', {
          params: {
            page,
            limit: 10,
            search: search.trim() || undefined,
            filter
          }
        }),
        api.get('/staff?active=true&limit=100')
      ]);

      setFines(finesRes.data.data);
      setPagination(finesRes.data.pagination);
      const staff = staffRes.data.data;
      setStaffList(staff);
      if (staff.length > 0 && !selectedStaffId) {
        setSelectedStaffId(String(staff[0].StaffID));
      }
    } catch (err) {
      setError(err.message || 'Error loading fine records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleOpenPayModal = (item) => {
    setSelectedIssue(item);
    const balance = parseFloat(item.OutstandingBalance);
    setPaymentAmount(balance.toFixed(2));
    setPaymentMethod('UPI');
    setPaymentRemarks(`Fine settlement for ${item.BookTitle}`);
    setPayError(null);
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPayError(null);

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayError('Please enter a valid positive payment amount.');
      return;
    }

    const currentBalance = parseFloat(selectedIssue.OutstandingBalance);
    if (amount > currentBalance) {
      setPayError(`Payment of ₹${amount.toFixed(2)} exceeds remaining balance of ₹${currentBalance.toFixed(2)}.`);
      return;
    }

    setPaySubmitting(true);
    try {
      const res = await api.post('/payments/fines', {
        IssueID: selectedIssue.IssueID,
        MemberID: selectedIssue.MemberID,
        StaffID: selectedStaffId,
        Amount: amount,
        PaymentMethod: paymentMethod,
        Remarks: paymentRemarks
      });

      setIsPayModalOpen(false);
      setSuccessMessage(`Payment of ₹${amount.toFixed(2)} recorded successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);

      // Fetch the generated receipt details for printable modal
      try {
        const receiptRes = await api.get(`/receipts/${res.data.data.ReceiptID}`);
        setGeneratedReceipt(receiptRes.data.data);
      } catch (rErr) {
        console.error('Could not load full receipt', rErr);
      }

      loadData();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaySubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            <span>Fine Management & Settlements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit assessed overdue penalties, record partial or full payments, and issue tamper-evident receipts
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="w-full sm:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by member, book title, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 font-medium focus:ring-1 focus:ring-sky-500"
          >
            <option value="outstanding">Outstanding Dues Only</option>
            <option value="unpaid">Unpaid Only (₹0 Paid)</option>
            <option value="partially-paid">Partially Paid</option>
            <option value="fully-paid">Fully Settled Fines</option>
            <option value="all">All Fine Transactions</option>
          </select>

          <button
            onClick={loadData}
            title="Refresh"
            className="p-1.5 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600 mr-2" />
            Querying fine balances...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700 text-xs">{error}</div>
        ) : fines.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
            <p className="text-sm font-medium">No fines found matching filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Issue ID</th>
                  <th className="px-4 py-3">Member (Borrower)</th>
                  <th className="px-4 py-3">Book Title</th>
                  <th className="px-4 py-3">Total Assessed</th>
                  <th className="px-4 py-3">Amount Paid</th>
                  <th className="px-4 py-3">Balance Due</th>
                  <th className="px-4 py-3">Payment State</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((f) => {
                  const balance = parseFloat(f.OutstandingBalance);
                  const isPending = balance > 0;

                  return (
                    <tr key={f.IssueID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-700">#{f.IssueID}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{f.MemberName}</div>
                        <div className="text-[11px] text-slate-500">ID: #{f.MemberID}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate" title={f.BookTitle}>
                        {f.BookTitle}
                      </td>
                      <td className="px-4 py-3 font-mono">₹{parseFloat(f.FineAmount).toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-emerald-700">₹{parseFloat(f.FinePaidAmount).toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={isPending ? 'text-rose-600' : 'text-slate-400'}>
                          ₹{balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          f.PaymentState === 'Fully Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : f.PaymentState === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {f.PaymentState}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPending ? (
                          <button
                            onClick={() => handleOpenPayModal(f)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-sm transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect Payment</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium">Cleared</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Record Payment Modal */}
      {isPayModalOpen && selectedIssue && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Record Fine Settlement</h3>
              <button onClick={() => setIsPayModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-3.5 text-xs">
              {payError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              {/* Settlement Context Summary */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Member:</span>
                  <span className="font-semibold text-slate-800">{selectedIssue.MemberName} (#{selectedIssue.MemberID})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Book:</span>
                  <span className="text-slate-800 truncate max-w-[200px]">{selectedIssue.BookTitle}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-medium">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    ₹{parseFloat(selectedIssue.OutstandingBalance).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedIssue.OutstandingBalance}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(parseFloat(selectedIssue.OutstandingBalance).toFixed(2))}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-[11px]"
                  >
                    Pay Full
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Collecting Staff *</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                  >
                    {staffList.map((s) => (
                      <option key={s.StaffID} value={s.StaffID}>{s.Name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Remarks / Reference Note</label>
                <input
                  type="text"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  {paySubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Record Payment & Issue Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Receipt Popup Modal */}
      <ReceiptModal
        receipt={generatedReceipt}
        onClose={() => setGeneratedReceipt(null)}
      />
    </div>
  );
}
