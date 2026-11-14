import React, { useState } from 'react';
import { ExchangeRate, UserRole, CreateCurrencyInput, UpdateCurrencyInput } from '../types';
import {
  Coins,
  X,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  TrendingUp,
} from 'lucide-react';

interface CurrencyRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: ExchangeRate[];
  onUpdateRate: (code: string, data: UpdateCurrencyInput) => Promise<void>;
  onCreateCurrency: (data: CreateCurrencyInput) => Promise<void>;
  userRole?: UserRole;
}

export const CurrencyRatesModal: React.FC<CurrencyRatesModalProps> = ({
  isOpen,
  onClose,
  currencies,
  onUpdateRate,
  onCreateCurrency,
  userRole = 'HR_VIEWER',
}) => {
  const isAdmin = userRole === 'HR_ADMIN';

  // State for updating rates
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // State for adding a new currency
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newSymbol, setNewSymbol] = useState<string>('');
  const [newRate, setNewRate] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const startEdit = (curr: ExchangeRate) => {
    if (!isAdmin) return;
    setEditingCode(curr.code);
    setEditRate(curr.rateToUsd.toString());
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSaveRate = async (code: string) => {
    const parsed = parseFloat(editRate);
    if (!parsed || parsed <= 0) {
      setErrorMessage('Rate to USD must be a positive number greater than 0.');
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage(null);
      await onUpdateRate(code, { rateToUsd: parsed });
      setEditingCode(null);
      setSuccessMessage(`Exchange rate for ${code} updated to ${parsed}. Employee salaries recalibrated.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update exchange rate.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const code = newCode.trim().toUpperCase();
    const name = newName.trim();
    const parsedRate = parseFloat(newRate);

    if (!code || code.length < 3) {
      setErrorMessage('Please provide a valid 3-letter currency code.');
      return;
    }

    if (!name) {
      setErrorMessage('Please provide a currency name.');
      return;
    }

    if (!parsedRate || parsedRate <= 0) {
      setErrorMessage('Exchange rate to USD must be greater than 0.');
      return;
    }

    try {
      setIsCreating(true);
      setErrorMessage(null);
      await onCreateCurrency({
        code,
        name,
        symbol: newSymbol.trim() || '$',
        rateToUsd: parsedRate,
        isActive: true,
      });

      setNewCode('');
      setNewName('');
      setNewSymbol('');
      setNewRate('');
      setIsAdding(false);
      setSuccessMessage(`Successfully added ${code} (${name}) with rate ${parsedRate}.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add currency.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Corporate Exchange Rates (ADR-07)
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic corporate planning FX rates to USD for multi-currency contracts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Policy Note */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Dynamic USD Normalization Policy</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              When an exchange rate is updated, the system automatically recalculates normalized USD compensation for all active employees contracted in that currency and evicts cached organization analytics in real-time.
            </p>
          </div>

          {/* Currencies Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Currency</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3 text-right">Rate to USD</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currencies.map((curr) => {
                  const isEditing = editingCode === curr.code;
                  return (
                    <tr key={curr.code} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {curr.code}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {curr.name}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-500">
                        {curr.symbol}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.000001"
                            min="0.000001"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            className="w-24 px-2 py-1 text-right text-xs border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <span>${Number(curr.rateToUsd).toFixed(4)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isAdmin ? (
                          isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveRate(curr.code)}
                                disabled={isUpdating}
                                className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                              >
                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingCode(null)}
                                disabled={isUpdating}
                                className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] hover:bg-slate-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(curr)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              Edit Rate
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add New Currency Section (HR_ADMIN only) */}
          {isAdmin && (
            <div className="pt-2">
              {!isAdding ? (
                <button
                  onClick={() => {
                    setIsAdding(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Supported Currency</span>
                </button>
              ) : (
                <form
                  onSubmit={handleCreate}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Register New Currency
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Code (e.g. CAD) *
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        required
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="CAD"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Currency Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Canadian Dollar"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Symbol
                      </label>
                      <input
                        type="text"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value)}
                        placeholder="CA$"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Rate to USD *
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        required
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        placeholder="0.73"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Currency</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>{currencies.length} active currencies supported</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
