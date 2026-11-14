import React, { useEffect, useState } from 'react';
import { Employee, SalaryHistory } from '../types';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { X, History, ArrowUpRight, ArrowDownRight, Clock, UserCheck, AlertCircle } from 'lucide-react';

interface AuditDrawerProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<SalaryHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee && isOpen) {
      setIsLoading(true);
      setError(null);
      api
        .getSalaryHistory(employee.id)
        .then((data) => setHistory(data))
        .catch((err) => setError(err.message || 'Failed to load audit history'))
        .finally(() => setIsLoading(false));
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Compensation Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Immutable record history (ADR-04)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee Summary Card */}
        <div className="px-6 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-blue-600">
                {employee.employeeId}
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {employee.firstName} {employee.lastName}
              </h3>
              <p className="text-xs text-slate-500">
                {employee.jobTitle} • {employee.department} ({employee.level})
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Current Salary
              </span>
              <span className="text-sm font-bold text-slate-900">
                {formatCurrency(employee.baseSalaryMinor, employee.currency)}
              </span>
              <span className="text-[11px] text-slate-500 block">
                ≈ {formatCurrency(employee.baseSalaryUsdMinor, 'USD')}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-600">No revisions on record</p>
              <p className="mt-1">
                Employee is currently compensated at their initial hire agreement.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
              {history.map((record) => {
                const diff = record.newSalaryMinor - record.previousSalaryMinor;
                const isIncrease = diff >= 0;
                const pct = record.previousSalaryMinor > 0
                  ? ((diff / record.previousSalaryMinor) * 100).toFixed(1)
                  : '0';

                return (
                  <div key={record.id} className="relative pl-6">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-2.5 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] shadow-xs ${
                        isIncrease ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      {isIncrease ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                    </div>

                    {/* Record Card */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          {formatDate(record.effectiveDate)}
                        </span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            isIncrease
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isIncrease ? '+' : ''}
                          {pct}%
                        </span>
                      </div>

                      {/* Salary Change Numbers */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Previous</span>
                          <span className="text-slate-600 line-through">
                            {formatCurrency(record.previousSalaryMinor, record.currency)}
                          </span>
                        </div>
                        <span className="text-slate-400 font-bold">→</span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Revised</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(record.newSalaryMinor, record.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Normalized USD */}
                      <p className="text-[11px] text-slate-500 text-right">
                        Normalized: {formatCurrency(record.newSalaryUsdMinor, 'USD')}
                      </p>

                      {/* Justification Reason */}
                      <div className="bg-white border border-slate-200/70 rounded-lg p-2 text-xs text-slate-700 italic">
                        "{record.reason}"
                      </div>

                      {/* Changed By Signature */}
                      {record.changedBy && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                          <UserCheck className="w-3 h-3 text-slate-500" />
                          <span>Authorized by: {record.changedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-2 bg-white border border-slate-300 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
