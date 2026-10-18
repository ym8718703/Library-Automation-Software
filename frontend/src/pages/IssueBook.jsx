import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ArrowUpRight, 
  Search, 
  BookOpen, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  RefreshCw, 
  Layers, 
  ShieldAlert 
} from 'lucide-react';

export default function IssueBook() {
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [settings, setSettings] = useState({
    loan_duration_days: '14',
    max_books_per_member: '3'
  });

  // Selected entities
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedISBN, setSelectedISBN] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Selected object caches for instant UI feedback
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  // Search filters for select lists
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  // Form State
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Load initial dropdown data
  const loadPrerequisites = async () => {
    try {
      const [membersRes, booksRes, staffRes, settingsRes] = await Promise.all([
        api.get('/members?limit=100'),
        api.get('/books?limit=100'),
        api.get('/staff?active=true&limit=100'),
        api.get('/settings')
      ]);

      setMembers(membersRes.data.data);
      setBooks(booksRes.data.data);
      const activeStaff = staffRes.data.data;
      setStaffList(activeStaff);
      if (activeStaff.length > 0) {
        setSelectedStaffId(String(activeStaff[0].StaffID));
      }
      if (settingsRes.data.data) {
        setSettings(settingsRes.data.data);
      }
    } catch (err) {
      setError('Failed to load library circulation records: ' + err.message);
    }
  };

  useEffect(() => {
    loadPrerequisites();
  }, []);

  // Compute Due Date automatically
  useEffect(() => {
    if (issueDate) {
      const duration = parseInt(settings.loan_duration_days || '14', 10);
      const d = new Date(issueDate);
      d.setDate(d.getDate() + duration);
      setDueDate(d.toISOString().slice(0, 10));
    }
  }, [issueDate, settings.loan_duration_days]);

  // When Member changes, update selectedMember cache
  useEffect(() => {
    if (selectedMemberId) {
      const m = members.find(item => String(item.MemberID) === String(selectedMemberId));
      setSelectedMember(m || null);
    } else {
      setSelectedMember(null);
    }
  }, [selectedMemberId, members]);

  // When Book changes, update selectedBook cache
  useEffect(() => {
    if (selectedISBN) {
      const b = books.find(item => item.ISBN === selectedISBN);
      setSelectedBook(b || null);
    } else {
      setSelectedBook(null);
    }
  }, [selectedISBN, books]);

  // Filtered members for dropdown
  const filteredMembers = members.filter(m => 
    m.Name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.Email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    String(m.MemberID).includes(memberSearch)
  );

  // Filtered books for dropdown
  const filteredBooks = books.filter(b =>
    b.Title.toLowerCase().includes(bookSearch.toLowerCase()) ||
    b.AuthorName.toLowerCase().includes(bookSearch.toLowerCase()) ||
    b.ISBN.includes(bookSearch)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    if (!selectedMemberId || !selectedISBN || !selectedStaffId) {
      setError('Please select a Member, a Book, and an Authorizing Staff member.');
      return;
    }

    if (selectedMember && selectedMember.MembershipStatus !== 'Active') {
      setError(`Cannot issue book: Member status is ${selectedMember.MembershipStatus}. Only Active members can borrow.`);
      return;
    }

    if (selectedBook && selectedBook.AvailableCopies <= 0) {
      setError(`Cannot issue book: "${selectedBook.Title}" is currently out of stock (0 copies available).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/issues', {
        MemberID: selectedMemberId,
        ISBN: selectedISBN,
        StaffID: selectedStaffId
      });

      setSuccessData({
        ...res.data.data,
        bookTitle: selectedBook?.Title,
        memberName: selectedMember?.Name
      });

      // Refresh books & members to update copy counts immediately
      loadPrerequisites();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedMemberId('');
    setSelectedISBN('');
    setSelectedMember(null);
    setSelectedBook(null);
    setSuccessData(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-sky-600" />
          <span>Book Checkout & Issuance Desk</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Execute transactional book borrowing backed by MySQL ACID stored procedures (<code className="font-mono text-sky-700">sp_IssueBook</code>)
        </p>
      </div>

      {/* Confirmation Card upon successful issue */}
      {successData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 text-xs text-emerald-900 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <h3 className="text-sm font-bold text-emerald-800">Book Issued Successfully!</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/70 p-3 rounded border border-emerald-100 font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Issue ID</span>
              <span className="font-bold text-slate-900 text-sm">#{successData.IssueID}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Due Date</span>
              <span className="font-bold text-slate-900">{successData.DueDate}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Member</span>
              <span className="font-medium text-slate-800 truncate block">{successData.memberName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">ISBN</span>
              <span className="font-medium text-slate-800">{successData.ISBN}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm transition-colors"
            >
              Issue Another Book
            </button>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Issuance Transaction Rejected</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Issuance Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Member Selection & Eligibility Verification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                1. Select Member (Borrower) *
              </label>
              {selectedMember && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  selectedMember.MembershipStatus === 'Active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  Status: {selectedMember.MembershipStatus}
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Type to filter members list..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <select
              required
              size="5"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full text-xs p-2 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 font-sans"
            >
              {filteredMembers.map((m) => (
                <option key={m.MemberID} value={m.MemberID} className="py-1">
                  #{m.MemberID} - {m.Name} ({m.Email}) [{m.MembershipStatus}]
                </option>
              ))}
            </select>

            {/* Member Eligibility Card */}
            {selectedMember && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-mono text-slate-800">{selectedMember.ContactNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Active Loans:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedMember.ActiveLoans} / {settings.max_books_per_member || 3} limit
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unpaid Fines:</span>
                  <span className={`font-mono font-bold ${parseFloat(selectedMember.TotalUnpaidFines) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{parseFloat(selectedMember.TotalUnpaidFines || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Book Selection & Inventory Verification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                2. Select Book to Issue *
              </label>
              {selectedBook && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  selectedBook.AvailableCopies > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {selectedBook.AvailableCopies > 0 ? `${selectedBook.AvailableCopies} Copies Available` : 'Out of Stock'}
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Type to filter books list..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <select
              required
              size="5"
              value={selectedISBN}
              onChange={(e) => setSelectedISBN(e.target.value)}
              className="w-full text-xs p-2 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 font-sans"
            >
              {filteredBooks.map((b) => (
                <option key={b.ISBN} value={b.ISBN} className="py-1">
                  {b.Title} ({b.AvailableCopies > 0 ? `${b.AvailableCopies} avail` : '0 avail'}) [{b.ISBN}]
                </option>
              ))}
            </select>

            {/* Book Info Card */}
            {selectedBook && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Author:</span>
                  <span className="font-medium text-slate-800">{selectedBook.AuthorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Publisher:</span>
                  <span className="text-slate-800">{selectedBook.PublisherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Edition / Price:</span>
                  <span className="font-mono text-slate-800">{selectedBook.Edition || '1st'} • ₹{parseFloat(selectedBook.Price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Inventory Stock:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedBook.AvailableCopies} available / {selectedBook.TotalCopies} total
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Transaction Meta: Date, Staff, Loan Duration */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Issue Date *</label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Due Date (Auto-calculated: {settings.loan_duration_days || 14} days)
            </label>
            <input
              type="date"
              disabled
              value={dueDate}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-slate-100 text-slate-600 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Authorizing Staff Member *</label>
            <select
              required
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500"
            >
              {staffList.map((s) => (
                <option key={s.StaffID} value={s.StaffID}>
                  {s.Name} ({s.Post})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            * Transactions decrement <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">Books.AvailableCopies</code> atomically inside a MySQL transaction with row lock.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm & Issue Book</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
