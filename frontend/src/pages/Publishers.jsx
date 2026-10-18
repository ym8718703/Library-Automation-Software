import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  BookOpen, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X 
} from 'lucide-react';

export default function Publishers() {
  const [publishers, setPublishers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState(null);
  const [publisherDetails, setPublisherDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form
  const [publisherName, setPublisherName] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadPublishers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/publishers', {
        params: {
          page,
          limit: 10,
          search: search.trim() || undefined
        }
      });
      setPublishers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || 'Error fetching publishers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublishers();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadPublishers();
  };

  const handleOpenAdd = () => {
    setPublisherName('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (pub) => {
    setSelectedPublisher(pub);
    setPublisherName(pub.PublisherName);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenView = async (pub) => {
    setSelectedPublisher(pub);
    setIsViewModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/publishers/${pub.PublisherID}`);
      setPublisherDetails(res.data.data);
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
      await api.post('/publishers', { PublisherName: publisherName.trim() });
      setIsAddModalOpen(false);
      setSuccessMessage(`Publisher "${publisherName}" added successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadPublishers();
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
      await api.put(`/publishers/${selectedPublisher.PublisherID}`, { PublisherName: publisherName.trim() });
      setIsEditModalOpen(false);
      setSuccessMessage(`Publisher updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadPublishers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/publishers/${deleteTarget.PublisherID}`);
      setDeleteTarget(null);
      setSuccessMessage('Publisher deleted successfully');
      setTimeout(() => setSuccessMessage(null), 4000);
      loadPublishers();
    } catch (err) {
      alert(`Deletion Error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Publisher Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Maintain publishing houses and track catalog title representations</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Publisher</span>
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

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
        <form onSubmit={handleSearch} className="w-full sm:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search publisher name..."
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

        <button
          onClick={loadPublishers}
          title="Refresh list"
          className="p-1.5 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600 mr-2" />
            Loading publishers from database...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700 text-xs">{error}</div>
        ) : publishers.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No publishers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Publisher ID</th>
                  <th className="px-4 py-3">Publisher Name</th>
                  <th className="px-4 py-3 text-center">Catalog Titles</th>
                  <th className="px-4 py-3 text-center">Total Physical Stock</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {publishers.map((pub) => (
                  <tr key={pub.PublisherID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">#{pub.PublisherID}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{pub.PublisherName}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-sky-700">
                      {pub.BookCount}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700">
                      {pub.AvailableCopies} avail / {pub.TotalCopies} total
                    </td>
                    <td className="px-4 py-3 text-slate-500">{pub.CreatedAt?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenView(pub)}
                        title="View Published Books"
                        className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(pub)}
                        title="Edit Publisher"
                        className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(pub)}
                        title="Delete Publisher"
                        className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Publisher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Publisher</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Publisher Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cambridge University Press"
                  value={publisherName}
                  onChange={(e) => setPublisherName(e.target.value)}
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
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Publisher Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Edit Publisher #{selectedPublisher?.PublisherID}</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Publisher Name *</label>
                <input
                  type="text"
                  required
                  value={publisherName}
                  onChange={(e) => setPublisherName(e.target.value)}
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
                  <span>Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Publisher Books Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Books by {selectedPublisher?.PublisherName}
              </h3>
              <button onClick={() => setIsViewModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-5 text-xs">
              {detailsLoading || !publisherDetails ? (
                <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Loading titles...</span>
                </div>
              ) : publisherDetails.books.length === 0 ? (
                <p className="text-slate-400 italic text-center py-4">No books currently cataloged under this publisher.</p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {publisherDetails.books.map((b) => (
                    <div key={b.ISBN} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{b.Title}</p>
                        <p className="text-[11px] text-slate-500">{b.AuthorName} • {b.Edition || 'Standard'}</p>
                        <p className="text-[10px] font-mono text-slate-400">ISBN: {b.ISBN}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-medium text-slate-800 block">₹{parseFloat(b.Price).toFixed(2)}</span>
                        <span className="text-[11px] text-emerald-700 font-medium">{b.AvailableCopies} avail</span>
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Publisher"
        message={`Are you sure you want to delete "${deleteTarget?.PublisherName}"? If there are any books referencing this publisher, foreign key constraints will reject the deletion.`}
        confirmText="Delete Publisher"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
