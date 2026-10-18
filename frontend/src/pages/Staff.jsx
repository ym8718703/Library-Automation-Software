import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit3, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldAlert, 
  Activity, 
  Receipt, 
  ArrowUpRight 
} from 'lucide-react';

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffDetails, setStaffDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    Name: '',
    Post: '',
    Email: '',
    ContactNo: '',
    Role: 'Librarian'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/staff', {
        params: {
          page,
          limit: 10,
          search: search.trim() || undefined,
          active: activeFilter === 'active' ? 'true' : activeFilter === 'inactive' ? 'false' : undefined
        }
      });
      setStaffList(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || 'Error fetching staff records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [page, activeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadStaff();
  };

  const handleToggleStatus = async (staff) => {
    try {
      const newStatus = !staff.IsActive;
      await api.patch(`/staff/${staff.StaffID}/status`, { isActive: newStatus });
      setSuccessMessage(`Staff member "${staff.Name}" is now ${newStatus ? 'Active' : 'Inactive'}. Historical transactions preserved.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadStaff();
    } catch (err) {
      alert(`Error toggling status: ${err.message}`);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      Name: '',
      Post: '',
      Email: '',
      ContactNo: '',
      Role: 'Librarian'
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setSelectedStaff(s);
    setFormData({
      Name: s.Name,
      Post: s.Post,
      Email: s.Email,
      ContactNo: s.ContactNo,
      Role: s.Role || 'Librarian'
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenView = async (s) => {
    setSelectedStaff(s);
    setIsViewModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/staff/${s.StaffID}`);
      setStaffDetails(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.post('/staff', formData);
      setIsAddModalOpen(false);
      setSuccessMessage(`Staff "${formData.Name}" added successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadStaff();
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
      await api.put(`/staff/${selectedStaff.StaffID}`, formData);
      setIsEditModalOpen(false);
      setSuccessMessage(`Staff profile updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadStaff();
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Library Staff Roster</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage library personnel, operational roles, and performance metrics</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
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
              placeholder="Search by name, designation, email..."
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
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Personnel</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            onClick={loadStaff}
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
            Loading staff roster from database...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700 text-xs">{error}</div>
        ) : staffList.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No staff members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Staff ID</th>
                  <th className="px-4 py-3">Staff Name & Email</th>
                  <th className="px-4 py-3">Designation (Post)</th>
                  <th className="px-4 py-3 text-center">Books Issued</th>
                  <th className="px-4 py-3 text-center">Returns Handled</th>
                  <th className="px-4 py-3 text-center">Receipts Processed</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s) => (
                  <tr key={s.StaffID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">#{s.StaffID}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{s.Name}</div>
                      <div className="text-[11px] text-slate-500">{s.Email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{s.Post}</span>
                      <span className="text-[10px] text-slate-400 block">{s.Role}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-sky-700">
                      {s.TotalBooksIssued}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                      {s.TotalBooksReturned}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700">
                      {s.TotalReceiptsProcessed} (₹{parseFloat(s.TotalAmountCollected).toFixed(2)})
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        title="Click to toggle active status"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          s.IsActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.IsActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <span>{s.IsActive ? 'Active' : 'Deactivated'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenView(s)}
                        title="View Staff Activity"
                        className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        title="Edit Staff Details"
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

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Staff Member</h3>
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
                  placeholder="e.g. Sunita Deshmukh"
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Designation / Post *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Librarian"
                  value={formData.Post}
                  onChange={(e) => setFormData({ ...formData, Post: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email (Unique) *</label>
                  <input
                    type="email"
                    required
                    placeholder="sunita@ccet.edu.in"
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.ContactNo}
                    onChange={(e) => setFormData({ ...formData, ContactNo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Role Permission</label>
                <select
                  value={formData.Role}
                  onChange={(e) => setFormData({ ...formData, Role: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Librarian">Librarian (Issue, Return, Catalog)</option>
                  <option value="Admin">Admin (Full System Access)</option>
                  <option value="Staff">Staff (Circulation Desk)</option>
                </select>
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
                  <span>Save Staff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Edit Staff #{selectedStaff?.StaffID}</h3>
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
                <label className="block font-medium text-slate-700 mb-1">Designation / Post *</label>
                <input
                  type="text"
                  required
                  value={formData.Post}
                  onChange={(e) => setFormData({ ...formData, Post: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact No. *</label>
                  <input
                    type="text"
                    required
                    value={formData.ContactNo}
                    onChange={(e) => setFormData({ ...formData, ContactNo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Role Permission</label>
                <select
                  value={formData.Role}
                  onChange={(e) => setFormData({ ...formData, Role: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Librarian">Librarian</option>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                </select>
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
                  <span>Update Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Activity Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Staff Operational Activity Audit</h3>
              </div>
              <button onClick={() => setIsViewModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {detailsLoading || !staffDetails ? (
                <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Loading activity summary...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{staffDetails.Name}</h4>
                      <p className="text-slate-600 font-medium">{staffDetails.Post} • {staffDetails.Role}</p>
                      <p className="text-slate-500 mt-1">{staffDetails.Email}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-slate-600">Total Books Issued: <span className="font-bold font-mono text-sky-700">{staffDetails.TotalBooksIssued}</span></p>
                      <p className="text-slate-600">Total Returns: <span className="font-bold font-mono text-emerald-700">{staffDetails.TotalBooksReturned}</span></p>
                      <p className="text-slate-600">Receipts Processed: <span className="font-bold font-mono text-slate-900">{staffDetails.TotalReceiptsProcessed}</span></p>
                      <p className="text-slate-600 font-semibold">Total Revenue Collected: <span className="font-mono text-emerald-700">₹{parseFloat(staffDetails.TotalAmountCollected).toFixed(2)}</span></p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">Recent Books Issued by this Staff</h5>
                    {staffDetails.recentIssues.length === 0 ? (
                      <p className="text-slate-400 italic py-2">No book issues recorded.</p>
                    ) : (
                      <div className="border border-slate-200 rounded overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-slate-600">
                            <tr>
                              <th className="px-3 py-1.5">Issue ID</th>
                              <th className="px-3 py-1.5">Book Title</th>
                              <th className="px-3 py-1.5">Member</th>
                              <th className="px-3 py-1.5">Issue Date</th>
                              <th className="px-3 py-1.5">Due Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {staffDetails.recentIssues.map((iss) => (
                              <tr key={iss.IssueID}>
                                <td className="px-3 py-1.5 font-mono">#{iss.IssueID}</td>
                                <td className="px-3 py-1.5 font-medium">{iss.Title}</td>
                                <td className="px-3 py-1.5 text-slate-600">{iss.MemberName}</td>
                                <td className="px-3 py-1.5 text-slate-500">{iss.IssueDate}</td>
                                <td className="px-3 py-1.5 text-slate-500">{iss.DueDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">Recent Receipts Processed</h5>
                    {staffDetails.recentReceipts.length === 0 ? (
                      <p className="text-slate-400 italic py-2">No receipts handled yet.</p>
                    ) : (
                      <div className="border border-slate-200 rounded overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-slate-600">
                            <tr>
                              <th className="px-3 py-1.5">Transaction ID</th>
                              <th className="px-3 py-1.5">Member</th>
                              <th className="px-3 py-1.5">Type</th>
                              <th className="px-3 py-1.5">Mode</th>
                              <th className="px-3 py-1.5 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {staffDetails.recentReceipts.map((r) => (
                              <tr key={r.ReceiptID}>
                                <td className="px-3 py-1.5 font-mono">{r.TransactionID}</td>
                                <td className="px-3 py-1.5 font-medium">{r.MemberName}</td>
                                <td className="px-3 py-1.5">{r.TransactionType}</td>
                                <td className="px-3 py-1.5 text-slate-500">{r.PaymentMethod}</td>
                                <td className="px-3 py-1.5 font-mono font-bold text-right text-slate-900">₹{parseFloat(r.Amount).toFixed(2)}</td>
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
