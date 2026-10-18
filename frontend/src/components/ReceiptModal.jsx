import React from 'react';
import { X, Printer, CheckCircle, IndianRupee } from 'lucide-react';

export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receipt.TransactionDateTime 
    ? new Date(receipt.TransactionDateTime).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header toolbar (Hidden in print) */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Official Transaction Slip</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 text-slate-800 space-y-5 bg-white">
          {/* Institutional Heading */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              {receipt.libraryName || 'College Library Management System'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Central College of Engineering & Technology</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Automated Circulation & Financial Audit Desk</p>
          </div>

          {/* Receipt & Transaction Key Identifiers */}
          <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded border border-slate-100 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Receipt No.</span>
              <span className="font-bold text-slate-800">REC-#{String(receipt.ReceiptID).padStart(5, '0')}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase">Transaction ID</span>
              <span className="font-semibold text-slate-800 text-[11px]">{receipt.TransactionID}</span>
            </div>
          </div>

          {/* Member & Staff Summary */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-medium">Billed To (Member)</span>
              <p className="font-semibold text-slate-800">{receipt.MemberName}</p>
              <p className="text-slate-500 text-[11px] font-mono">ID: #{receipt.MemberID}</p>
              {receipt.MemberEmail && <p className="text-slate-500 text-[11px] truncate">{receipt.MemberEmail}</p>}
            </div>
            <div className="space-y-1 text-right">
              <span className="text-slate-400 text-[10px] uppercase font-medium">Authorized Staff</span>
              <p className="font-semibold text-slate-800">{receipt.StaffName}</p>
              <p className="text-slate-500 text-[11px]">Staff ID: #{receipt.StaffID}</p>
              <p className="text-slate-400 text-[11px]">{formattedDate}</p>
            </div>
          </div>

          {/* Context Item (Associated Book / Fee) */}
          <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
            <div className="bg-slate-100 px-3 py-2 font-semibold text-slate-700 flex justify-between">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="p-3 space-y-1">
              <div className="flex justify-between font-medium text-slate-800">
                <span>{receipt.TransactionType}</span>
                <span className="font-mono">₹{parseFloat(receipt.Amount).toFixed(2)}</span>
              </div>
              {receipt.BookTitle && (
                <p className="text-[11px] text-slate-500">
                  Book: <span className="italic">{receipt.BookTitle}</span> (ISBN: {receipt.ISBN})
                </p>
              )}
              {receipt.Remarks && (
                <p className="text-[11px] text-slate-400">Note: {receipt.Remarks}</p>
              )}
            </div>
          </div>

          {/* Payment Details & Total */}
          <div className="border-t border-dashed border-slate-300 pt-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Payment Mode</span>
              <span className="font-semibold text-slate-800">{receipt.PaymentMethod}</span>
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                {receipt.PaymentStatus || 'Completed'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px] uppercase block">Total Paid</span>
              <span className="text-lg font-bold text-slate-900 font-mono">
                ₹{parseFloat(receipt.Amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Verification Footer */}
          <div className="text-center pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Computer-generated official receipt. Recorded in MySQL database.</span>
          </div>
        </div>

        {/* Modal Close Button (Hidden in print) */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
