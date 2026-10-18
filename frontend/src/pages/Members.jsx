import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Clock, 
  IndianRupee, 
  BookOpen, 
  Receipt 
} from 'lucide-react';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    Name: '',
    Email: '',
    ContactNo: '',
    MembershipStatus: 'Active',
    Address: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/members', {
        params: {
          page,
          limit: 10,
          search: search.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });
      setMembers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || 'Error fetching members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadMembers();
  };

  const handleOpenAdd = () => {
    setFormData({
      Name: '',
      Email: '',
      ContactNo: '',
      MembershipStatus: 'Active',
      Address: ''
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setSelectedMember(m);
    setFormData({
      Name: m.Name,
      Email: m.Email,
      ContactNo: m.ContactNo,
      MembershipStatus: m.MembershipStatus,
      Address: m.Address || ''
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenView = async (m) => {
    setSelectedMember(m);
    setIsViewModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/members/${m.MemberID}`);
      setMemberDetails(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (memberId, newStatus) => {
    try {
      await api.patch(`/members/${memberId}/status`, { status: newStatus });
      setSuccessMessage(`Member status changed to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      loadMembers();
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.post('/members', formData);
      setIsAddModalOpen(false);
      setSuccessMessage(`Member "${formData.Name}" registered successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadMembers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.put(`/members/${selectedMember.MemberID}`, formData);
      setIsEditModalOpen(false);
      setSuccessMessage(`Member profile updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadMembers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Member Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage library patron accounts, borrowing permissions, and dues</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Member</span>
        </button>
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
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="w-full sm:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
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
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            onClick={loadMembers}
            title="Refresh list"
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
            Loading member profiles...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700 text-xs">{error}</div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Member ID</th>
                  <th className="px-4 py-3">Full Name & Email</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-center">Active Loans</th>
                  <th className="px-4 py-3 text-center">Overdue</th>
                  <th className="px-4 py-3">Unpaid Fines</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.MemberID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">#{m.MemberID}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{m.Name}</div>
                      <div className="text-[11px] text-slate-500">{m.Email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{m.ContactNo}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                      {m.ActiveLoans}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      {m.OverdueLoans > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                          {m.OverdueLoans}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {parseFloat(m.TotalUnpaidFines) > 0 ? (
                        <span className="font-bold text-rose-600">₹{parseFloat(m.TotalUnpaidFines).toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">₹0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={m.MembershipStatus}
                        onChange={(e) => handleStatusChange(m.MemberID, e.target.value)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded border focus:ring-1 focus:ring-sky-500 ${
                          m.MembershipStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : m.MembershipStatus === 'Suspended'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenView(m)}
                        title="View Full Profile & Borrowing History"
                        className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(m)}
                        title="Edit Member"
                        className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
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

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Register New Member</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-3 text-xs">
              {formError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Patel"
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Email Address (Unique) *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aarav.patel@student.ccet.edu.in"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.ContactNo}
                    onChange={(e) => setFormData({ ...formData, ContactNo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={formData.MembershipStatus}
                    onChange={(e) => setFormData({ ...formData, MembershipStatus: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Address / Hostel Department</label>
                <input
                  type="text"
                  placeholder="Room 102, Boys Hostel 1"
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Register</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Edit Member #{selectedMember?.MemberID}</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-3 text-xs">
              {formError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.ContactNo}
                    onChange={(e) => setFormData({ ...formData, ContactNo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.MembershipStatus}
                    onChange={(e) => setFormData({ ...formData, MembershipStatus: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Address / Hostel Department</label>
                <input
                  type="text"
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Update Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Full Details & Audit View */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Member History & Financial Audit</h3>
              </div>
              <button onClick={() => setIsViewModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {detailsLoading || !memberDetails ? (
                <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Loading complete profile from database...</span>
                </div>
              ) : (
                <>
                  {/* Demographic & Status Summary */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{memberDetails.Name}</h4>
                      <p className="text-slate-600">{memberDetails.Email}</p>
                      <p className="text-slate-500 font-mono text-[11px] mt-0.5">{memberDetails.ContactNo}</p>
                      <p className="text-slate-400 text-[11px] mt-1">Joined: {memberDetails.JoinDate}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        memberDetails.MembershipStatus === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : memberDetails.MembershipStatus === 'Suspended'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        Status: {memberDetails.MembershipStatus}
                      </span>
                      <p className="text-slate-500 mt-2">Active Loans: <span className="font-bold text-slate-800">{memberDetails.activeLoans.length}</span></p>
                    </div>
                  </div>

                  {/* Active Loans */}
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                      <span>Currently Borrowed Books ({memberDetails.activeLoans.length})</span>
                    </h5>
                    {memberDetails.activeLoans.length === 0 ? (
                      <p className="text-slate-400 italic py-2">No active books currently checked out.</p>
                    ) : (
                      <div className="border border-slate-200 rounded overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-slate-600">
                            <tr>
                              <th className="px-3 py-1.5">Issue ID</th>
                              <th className="px-3 py-1.5">Book Title</th>
                              <th className="px-3 py-1.5">Due Date</th>
                              <th className="px-3 py-1.5">Loan State</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {memberDetails.activeLoans.map((l) => (
                              <tr key={l.IssueID}>
                                <td className="px-3 py-1.5 font-mono">#{l.IssueID}</td>
                                <td className="px-3 py-1.5 font-medium">{l.Title}</td>
                                <td className="px-3 py-1.5 text-slate-500">{l.DueDate}</td>
                                <td className="px-3 py-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    l.LoanStatus === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {l.LoanStatus === 'Overdue' ? `${l.DaysOverdue}d Overdue` : 'Active'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Outstanding Fines */}
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-rose-600" />
                      <span>Unpaid Fines ({memberDetails.outstandingFines.length})</span>
                    </h5>
                    {memberDetails.outstandingFines.length === 0 ? (
                      <p className="text-emerald-600 font-medium py-1">No outstanding fines on record.</p>
                    ) : (
                      <div className="border border-rose-200 rounded overflow-hidden bg-rose-50/30">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-rose-50 text-rose-800">
                            <tr>
                              <th className="px-3 py-1.5">Issue ID</th>
                              <th className="px-3 py-1.5">Book Title</th>
                              <th className="px-3 py-1.5">Assessed</th>
                              <th className="px-3 py-1.5">Paid</th>
                              <th className="px-3 py-1.5 text-right">Balance Due</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-100">
                            {memberDetails.outstandingFines.map((f) => (
                              <tr key={f.IssueID}>
                                <td className="px-3 py-1.5 font-mono">#{f.IssueID}</td>
                                <td className="px-3 py-1.5">{f.Title}</td>
                                <td className="px-3 py-1.5 font-mono">₹{parseFloat(f.FineAmount).toFixed(2)}</td>
                                <td className="px-3 py-1.5 font-mono">₹{parseFloat(f.FinePaidAmount).toFixed(2)}</td>
                                <td className="px-3 py-1.5 font-mono font-bold text-rose-700 text-right">
                                  ₹{parseFloat(f.OutstandingBalance).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Complete Historical Borrowing Records via Stored Procedure */}
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Historical Transactions (Stored Procedure: sp_GetMemberBorrowingHistory)</span>
                    </h5>
                    {memberDetails.borrowingHistory.length === 0 ? (
                      <p className="text-slate-400 italic py-2">No historical transactions found.</p>
                    ) : (
                      <div className="border border-slate-200 rounded overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-slate-600 sticky top-0">
                            <tr>
                              <th className="px-3 py-1.5">Issue ID</th>
                              <th className="px-3 py-1.5">Book</th>
                              <th className="px-3 py-1.5">Issue Date</th>
                              <th className="px-3 py-1.5">Return Date</th>
                              <th className="px-3 py-1.5">Status</th>
                              <th className="px-3 py-1.5">Fine</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {memberDetails.borrowingHistory.map((h) => (
                              <tr key={h.IssueID}>
                                <td className="px-3 py-1.5 font-mono">#{h.IssueID}</td>
                                <td className="px-3 py-1.5 font-medium">{h.Title}</td>
                                <td className="px-3 py-1.5 text-slate-500">{h.IssueDate}</td>
                                <td className="px-3 py-1.5 text-slate-500">{h.ReturnDate || '—'}</td>
                                <td className="px-3 py-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    h.Status === 'Returned' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {h.Status}
                                  </span>
                                </td>
                                <td className="px-3 py-1.5 font-mono">
                                  {parseFloat(h.FineAmount) > 0 ? `₹${parseFloat(h.FineAmount).toFixed(2)}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-3.5 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
