import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import ReceiptModal from '../components/ReceiptModal';
import { 
  Receipt as ReceiptIcon, 
  Search, 
  Filter, 
  Printer, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye 
} from 'lucide-react';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  // New Fee Modal
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [feeForm, setFeeForm] = useState({
    MemberID: '',
    StaffID: '',
    TransactionType: 'Other Fee',
    Amount: '',
    PaymentMethod: 'UPI',
    Remarks: ''
  });
  const [feeSubmitting, setFeeSubmitting] = useState(false);
  const [feeError, setFeeError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        transactionType: transactionType || undefined,
        paymentMethod: paymentMethod || undefined,
        paymentStatus: paymentStatus || undefined
      };

      const [receiptsRes, staffRes, membersRes] = await Promise.all([
        api.get('/receipts', { params }),
        api.get('/staff?active=true&limit=100'),
        api.get('/members?limit=100')
      ]);

      setReceipts(receiptsRes.data.data);
      setPagination(receiptsRes.data.pagination);
      setStaffList(staffRes.data.data);
      setMembersList(membersRes.data.data);

      if (staffRes.data.data.length > 0 && !feeForm.StaffID) {
        setFeeForm(prev => ({ ...prev, StaffID: String(staffRes.data.data[0].StaffID) }));
      }
      if (membersRes.data.data.length > 0 && !feeForm.MemberID) {
        setFeeForm(prev => ({ ...prev, MemberID: String(membersRes.data.data[0].MemberID) }));
      }
    } catch (err) {
      setError(err.message || 'Error fetching receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, transactionType, paymentMethod, paymentStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleOpenReceipt = async (receiptId) => {
    setReceiptLoading(true);
    try {
      const res = await api.get(`/receipts/${receiptId}`);
      setSelectedReceipt(res.data.data);
    } catch (err) {
      alert('Failed to load full receipt details: ' + err.message);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    setFeeSubmitting(true);
    setFeeError(null);

    const amount = parseFloat(feeForm.Amount);
    if (isNaN(amount) || amount <= 0) {
      setFeeError('Please enter a valid amount.');
      setFeeSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/receipts/fee', feeForm);
      setIsAddFeeOpen(false);
      // Open receipt modal for the created fee
      handleOpenReceipt(res.data.data.ReceiptID);
      loadData();
    } catch (err) {
      setFeeError(err.message);
    } finally {
      setFeeSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ReceiptIcon className="w-5 h-5 text-sky-600" />
            <span>Transaction Receipts & Payment Slips</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable financial audit trail recorded in MySQL <code className="font-mono text-sky-700">Receipt</code> table
          </p>
        </div>

        <button
          onClick={() => {
            setFeeForm(prev => ({ ...prev, Amount: '', Remarks: '' }));
            setFeeError(null);
            setIsAddFeeOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Fee Receipt</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="w-full lg:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Member..."
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

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <select
            value={transactionType}
            onChange={(e) => { setTransactionType(e.target.value); setPage(1); }}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Types</option>
            <option value="Fine Payment">Fine Payment</option>
            <option value="Other Fee">Other Fee</option>
            <option value="Refund">Refund</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Modes</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
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
            Loading transaction logs...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700 text-xs">{error}</div>
        ) : receipts.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <ReceiptIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No receipts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Receipt No.</th>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Type & Context</th>
                  <th className="px-4 py-3 font-mono">Amount (₹)</th>
                  <th className="px-4 py-3">Payment Mode</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((r) => (
                  <tr key={r.ReceiptID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      REC-#{String(r.ReceiptID).padStart(5, '0')}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-[11px]">
                      {r.TransactionID}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{r.MemberName}</div>
                      <div className="text-[11px] text-slate-400">ID: #{r.MemberID}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{r.TransactionType}</div>
                      {r.BookTitle && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{r.BookTitle}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ₹{parseFloat(r.Amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">{r.PaymentMethod}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {r.TransactionDateTime?.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        r.PaymentStatus === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.PaymentStatus === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.PaymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenReceipt(r.ReceiptID)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Record Fee Modal */}
      {isAddFeeOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Record Fee Receipt</h3>
              <button onClick={() => setIsAddFeeOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleFeeSubmit} className="p-5 space-y-3.5 text-xs">
              {feeError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feeError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Member *</label>
                <select
                  required
                  value={feeForm.MemberID}
                  onChange={(e) => setFeeForm({ ...feeForm, MemberID: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                >
                  {membersList.map((m) => (
                    <option key={m.MemberID} value={m.MemberID}>
                      #{m.MemberID} - {m.Name} ({m.Email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Fee Type *</label>
                  <select
                    value={feeForm.TransactionType}
                    onChange={(e) => setFeeForm({ ...feeForm, TransactionType: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Other Fee">Registration / Card Fee</option>
                    <option value="Refund">Refund Adjustment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="100.00"
                    value={feeForm.Amount}
                    onChange={(e) => setFeeForm({ ...feeForm, Amount: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={feeForm.PaymentMethod}
                    onChange={(e) => setFeeForm({ ...feeForm, PaymentMethod: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Authorizing Staff *</label>
                  <select
                    value={feeForm.StaffID}
                    onChange={(e) => setFeeForm({ ...feeForm, StaffID: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                  >
                    {staffList.map((s) => (
                      <option key={s.StaffID} value={s.StaffID}>{s.Name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Annual library card renewal"
                  value={feeForm.Remarks}
                  onChange={(e) => setFeeForm({ ...feeForm, Remarks: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFeeOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feeSubmitting}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  {feeSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Generate Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
