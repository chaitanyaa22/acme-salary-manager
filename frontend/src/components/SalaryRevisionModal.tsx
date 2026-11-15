import React, { useState, useEffect } from 'react';
import { Employee, UserRole } from '../types';
import { formatCurrency } from '../lib/utils';
import { X, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';

interface SalaryRevisionModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { newSalaryMinor: number; effectiveDate: string; reason: string }) => Promise<void>;
  userRole?: UserRole;
}

// Client-side analytical rates to preview USD equivalent in real-time
const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  SGD: 0.74,
  INR: 0.012,
};

export const SalaryRevisionModal: React.FC<SalaryRevisionModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSave,
  userRole = 'HR_VIEWER',
}) => {
  const [newSalaryMajor, setNewSalaryMajor] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setNewSalaryMajor((employee.baseSalaryMinor / 100).toString());
      setEffectiveDate(new Date().toISOString().split('T')[0]);
      setReason('');
      setErrorMessage(null);
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const isAdmin = userRole === 'HR_ADMIN';

  const currentMinor = employee.baseSalaryMinor;
  const currentMajor = currentMinor / 100;
  const parsedNewMajor = parseFloat(newSalaryMajor) || 0;
  const newMinor = Math.round(parsedNewMajor * 100);

  // Live preview of normalized USD equivalent
  const rate = FX_RATES_TO_USD[employee.currency] || 1.0;
  const previewUsdMinor = Math.round(newMinor * rate);
  const percentageChange = currentMinor > 0
    ? (((newMinor - currentMinor) / currentMinor) * 100).toFixed(1)
    : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMessage('Forbidden: Only users with the HR_ADMIN role can adjust employee compensation.');
      return;
    }

    if (newMinor <= 0) {
      setErrorMessage('Salary must be greater than zero.');
      return;
    }

    if (newMinor === currentMinor) {
      setErrorMessage('New salary must be different from current salary.');
      return;
    }

    if (!reason || reason.trim().length < 3) {
      setErrorMessage('Please provide a descriptive reason for this compensation adjustment.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSave({
        newSalaryMinor: newMinor,
        effectiveDate,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to revise salary.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Revise Compensation</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {employee.firstName} {employee.lastName} ({employee.employeeId}) • {employee.jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RBAC Warning for Viewers */}
        {!isAdmin && (
          <div className="m-6 mb-0 p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Read-Only Mode (HR_VIEWER):</span> You are viewing this
              record with read-only permissions. Switch to the <strong>HR_ADMIN</strong> demo account
              in the top bar to perform compensation adjustments.
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current vs New Salary Comparison Cards */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/80 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                Current Salary
              </span>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {formatCurrency(currentMinor, employee.currency)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ≈ {formatCurrency(employee.baseSalaryUsdMinor, 'USD')} normalized
              </p>
            </div>

            <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
              <span className="text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px] font-semibold">
                New Preview ({employee.currency})
              </span>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {formatCurrency(newMinor, employee.currency)}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>≈ {formatCurrency(previewUsdMinor, 'USD')}</span>
                {newMinor !== currentMinor && (
                  <span
                    className={`font-semibold ml-1 ${
                      Number(percentageChange) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    ({Number(percentageChange) > 0 ? '+' : ''}
                    {percentageChange}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Input: New Base Salary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Base Salary ({employee.currency} Major Units)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                disabled={!isAdmin || isSubmitting}
                value={newSalaryMajor}
                onChange={(e) => setNewSalaryMajor(e.target.value)}
                placeholder={`e.g. ${currentMajor}`}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                {employee.currency}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Entered in major units (e.g. dollars/rupees); stored safely as integer minor units in PostgreSQL.
            </p>
          </div>

          {/* Input: Effective Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Effective Date
            </label>
            <input
              type="date"
              disabled={!isAdmin || isSubmitting}
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
              required
            />
          </div>

          {/* Input: Business Justification / Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Adjustment Reason (Audit Trail)
            </label>
            <textarea
              rows={2}
              disabled={!isAdmin || isSubmitting}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual merit increase, promotion to Senior Engineer, cost of living adjustment..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 resize-none"
              required
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isAdmin || isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Recording Audit...</span>
              ) : (
                <>
                  <span>Commit Revision</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
