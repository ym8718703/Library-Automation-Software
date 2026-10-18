import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  confirmVariant = 'danger',
  onConfirm, 
  onClose,
  loading = false 
}) {
  if (!isOpen) return null;

  const buttonStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
    primary: 'bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full shrink-0 ${confirmVariant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5 ${buttonStyles[confirmVariant] || buttonStyles.primary}`}
          >
            {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
