import React, { useState } from 'react';
import { Employee, UserRole } from '../types';
import { formatCurrency } from '../lib/utils';
import { AlertTriangle, UserMinus, X, Loader2, ShieldAlert } from 'lucide-react';

interface DeactivateEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (employee: Employee) => Promise<void>;
  userRole?: UserRole;
}

export const DeactivateEmployeeModal: React.FC<DeactivateEmployeeModalProps> = ({
  employee,
  isOpen,
  onClose,
  onConfirm,
  userRole = 'HR_VIEWER',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !employee) return null;

  const isAdmin = userRole === 'HR_ADMIN';

  const handleConfirm = async () => {
    if (!isAdmin) {
      setErrorMessage('Forbidden: Requires HR_ADMIN role to offboard employees.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onConfirm(employee);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to offboard employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col transition-colors">
        {/* Header with Danger Warning Styling */}
        <div className="px-6 py-4 border-b border-rose-100 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Confirm Offboarding</h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Deactivate employee profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Employee Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {employee.firstName} {employee.lastName}
              </span>
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold rounded">
                {employee.employeeId}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
              <p>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{employee.jobTitle}</span> &bull; {employee.department} ({employee.level})
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {employee.country} &bull; Base Salary:{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatCurrency(employee.baseSalaryMinor, employee.currency)}
                </span>
              </p>
            </div>
          </div>

          {/* Regulatory & Audit Note */}
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Soft-Deletion & Audit Compliance (ADR-06)
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                This employee will be deactivated (<code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">isActive = false</code>) and removed from active directory queries and organizational headcount metrics.
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                All historical salary records will be strictly preserved for audit integrity.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !isAdmin}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Offboarding...</span>
              </>
            ) : (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                <span>Confirm Offboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
