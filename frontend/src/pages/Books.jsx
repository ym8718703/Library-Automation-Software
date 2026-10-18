import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Edit3, 
  Trash2, 
  Eye, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  const [availability, setAvailability] = useState('all');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('Title');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookDetails, setBookDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Delete modal
  const [deleteBookTarget, setDeleteBookTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    ISBN: '',
    Title: '',
    AuthorName: '',
    PublisherID: '',
    Price: '',
    NoOfPages: '',
    Edition: '',
    TotalCopies: 1
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Load Publishers
  const loadPublishers = async () => {
    try {
      const res = await api.get('/publishers?limit=100');
      setPublishers(res.data.data);
    } catch (err) {
      console.error('Failed to load publishers', err);
    }
  };

  // Load Books
  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        publisherId: selectedPublisher || undefined,
        availability: availability !== 'all' ? availability : undefined,
        sortBy,
        sortOrder
      };
      const res = await api.get('/books', { params });
      setBooks(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || 'Error loading book catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublishers();
  }, []);

  useEffect(() => {
    loadBooks();
  }, [page, selectedPublisher, availability, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadBooks();
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      ISBN: '',
      Title: '',
      AuthorName: '',
      PublisherID: publishers.length > 0 ? publishers[0].PublisherID : '',
      Price: '',
      NoOfPages: '',
      Edition: '1st Edition',
      TotalCopies: 3
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (book) => {
    setSelectedBook(book);
    setFormData({
      ISBN: book.ISBN,
      Title: book.Title,
      AuthorName: book.AuthorName,
      PublisherID: book.PublisherID,
      Price: book.Price,
      NoOfPages: book.NoOfPages || '',
      Edition: book.Edition || '',
      TotalCopies: book.TotalCopies
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Open View Details Modal
  const handleOpenViewModal = async (book) => {
    setSelectedBook(book);
    setIsViewModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/books/${book.ISBN}`);
      setBookDetails(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Add Book Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.post('/books', formData);
      setIsAddModalOpen(false);
      setSuccessMessage(`Book "${formData.Title}" added successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadBooks();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Edit Book Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.put(`/books/${selectedBook.ISBN}`, formData);
      setIsEditModalOpen(false);
      setSuccessMessage(`Book "${formData.Title}" updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadBooks();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Book Submit
  const handleDeleteConfirm = async () => {
    if (!deleteBookTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/books/${deleteBookTarget.ISBN}`);
      setDeleteBookTarget(null);
      setSuccessMessage(`Book removed from catalog successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadBooks();
    } catch (err) {
      alert(`Deletion Error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Book Catalog & Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage library catalog, editions, pricing, and physical stock</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title, author, ISBN..."
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

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Publisher Filter */}
          <select
            value={selectedPublisher}
            onChange={(e) => { setSelectedPublisher(e.target.value); setPage(1); }}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Publishers</option>
            {publishers.map((p) => (
              <option key={p.PublisherID} value={p.PublisherID}>{p.PublisherName}</option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Availability</option>
            <option value="in-stock">In Stock (&gt; 0)</option>
            <option value="out-of-stock">Out of Stock (0)</option>
          </select>

          {/* Sort Column */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
          >
            <option value="Title">Sort by Title</option>
            <option value="AuthorName">Sort by Author</option>
            <option value="Price">Sort by Price</option>
            <option value="AvailableCopies">Sort by Availability</option>
            <option value="TotalCopies">Sort by Total Copies</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title="Toggle sort direction"
            className="px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50 text-xs font-mono"
          >
            {sortOrder.toUpperCase()}
          </button>

          <button
            onClick={loadBooks}
            title="Refresh"
            className="p-1.5 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600 mr-2" />
            Loading catalog records...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700 text-xs">{error}</div>
        ) : books.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No books found matching criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing search filters or add a new title.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ISBN</th>
                  <th className="px-4 py-3">Title & Edition</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Publisher</th>
                  <th className="px-4 py-3">Price (₹)</th>
                  <th className="px-4 py-3 text-center">Available / Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((book) => (
                  <tr key={book.ISBN} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">{book.ISBN}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{book.Title}</div>
                      <div className="text-[11px] text-slate-400">{book.Edition || 'Standard'} • {book.NoOfPages || '—'} pages</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{book.AuthorName}</td>
                    <td className="px-4 py-3 text-slate-600">{book.PublisherName}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      ₹{parseFloat(book.Price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold">
                      <span className={book.AvailableCopies > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {book.AvailableCopies}
                      </span>
                      <span className="text-slate-400"> / {book.TotalCopies}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                        book.AvailableCopies > 0 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {book.AvailableCopies > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenViewModal(book)}
                        title="View Details"
                        className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(book)}
                        title="Edit Book Details"
                        className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteBookTarget(book)}
                        title="Delete Book"
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

      {/* Add Book Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Book to Catalog</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ISBN *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 978-0131103627"
                    value={formData.ISBN}
                    onChange={(e) => setFormData({ ...formData, ISBN: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Publisher *</label>
                  <select
                    required
                    value={formData.PublisherID}
                    onChange={(e) => setFormData({ ...formData, PublisherID: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select Publisher</option>
                    {publishers.map((p) => (
                      <option key={p.PublisherID} value={p.PublisherID}>{p.PublisherName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database System Concepts"
                  value={formData.Title}
                  onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Author Name(s) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abraham Silberschatz, Henry F. Korth"
                  value={formData.AuthorName}
                  onChange={(e) => setFormData({ ...formData, AuthorName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="999.00"
                    value={formData.Price}
                    onChange={(e) => setFormData({ ...formData, Price: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Total Copies *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.TotalCopies}
                    onChange={(e) => setFormData({ ...formData, TotalCopies: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Edition</label>
                  <input
                    type="text"
                    placeholder="e.g. 7th Edition"
                    value={formData.Edition}
                    onChange={(e) => setFormData({ ...formData, Edition: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">No. of Pages</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1200"
                    value={formData.NoOfPages}
                    onChange={(e) => setFormData({ ...formData, NoOfPages: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
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
                  <span>Save Book</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Edit Book: {selectedBook?.ISBN}</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={formData.Title}
                  onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Author Name(s) *</label>
                <input
                  type="text"
                  required
                  value={formData.AuthorName}
                  onChange={(e) => setFormData({ ...formData, AuthorName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Publisher *</label>
                  <select
                    required
                    value={formData.PublisherID}
                    onChange={(e) => setFormData({ ...formData, PublisherID: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
                  >
                    {publishers.map((p) => (
                      <option key={p.PublisherID} value={p.PublisherID}>{p.PublisherName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.Price}
                    onChange={(e) => setFormData({ ...formData, Price: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Total Copies *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.TotalCopies}
                    onChange={(e) => setFormData({ ...formData, TotalCopies: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Issued: {selectedBook?.TotalCopies - selectedBook?.AvailableCopies}
                  </span>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Edition</label>
                  <input
                    type="text"
                    value={formData.Edition}
                    onChange={(e) => setFormData({ ...formData, Edition: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pages</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.NoOfPages}
                    onChange={(e) => setFormData({ ...formData, NoOfPages: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
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
                  <span>Update Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Book Details & History Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Book Details & Lending History</h3>
              </div>
              <button onClick={() => setIsViewModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {detailsLoading || !bookDetails ? (
                <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Loading details from MySQL...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{bookDetails.Title}</h4>
                      <p className="text-slate-600 mt-0.5">Author: <span className="font-medium text-slate-800">{bookDetails.AuthorName}</span></p>
                      <p className="text-slate-600">Publisher: <span className="font-medium text-slate-800">{bookDetails.PublisherName}</span></p>
                      <p className="font-mono text-slate-500 mt-1">ISBN: {bookDetails.ISBN}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-slate-500">Price: <span className="text-slate-900 font-bold font-mono">₹{parseFloat(bookDetails.Price).toFixed(2)}</span></p>
                      <p className="text-slate-500">Pages: <span className="text-slate-900 font-medium">{bookDetails.NoOfPages || '—'}</span></p>
                      <p className="text-slate-500">Edition: <span className="text-slate-900 font-medium">{bookDetails.Edition || '—'}</span></p>
                      <div className="mt-2 inline-block">
                        <span className="font-mono font-bold text-emerald-700">{bookDetails.AvailableCopies} available</span>
                        <span className="text-slate-400"> of {bookDetails.TotalCopies} copies</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Borrowing History & Active Loans</h4>
                    {bookDetails.borrowingHistory.length === 0 ? (
                      <p className="text-slate-400 italic py-4 text-center">This book has never been checked out.</p>
                    ) : (
                      <div className="border border-slate-200 rounded overflow-hidden max-h-56 overflow-y-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                            <tr>
                              <th className="px-3 py-1.5">Issue ID</th>
                              <th className="px-3 py-1.5">Borrower</th>
                              <th className="px-3 py-1.5">Issue Date</th>
                              <th className="px-3 py-1.5">Due Date</th>
                              <th className="px-3 py-1.5">Return Date</th>
                              <th className="px-3 py-1.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {bookDetails.borrowingHistory.map((h) => (
                              <tr key={h.IssueID} className="hover:bg-slate-50">
                                <td className="px-3 py-1.5 font-mono">#{h.IssueID}</td>
                                <td className="px-3 py-1.5 font-medium">{h.MemberName}</td>
                                <td className="px-3 py-1.5 text-slate-500">{h.IssueDate}</td>
                                <td className="px-3 py-1.5 text-slate-500">{h.DueDate}</td>
                                <td className="px-3 py-1.5 text-slate-500">{h.ReturnDate || '—'}</td>
                                <td className="px-3 py-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    h.Status === 'Issued' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {h.Status}
                                  </span>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteBookTarget)}
        title="Delete Book from Catalog"
        message={`Are you sure you want to delete "${deleteBookTarget?.Title}" (ISBN: ${deleteBookTarget?.ISBN})? If this book has past or current loans, the relational constraints will prevent deletion.`}
        confirmText="Yes, Delete"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteBookTarget(null)}
      />
    </div>
  );
}
