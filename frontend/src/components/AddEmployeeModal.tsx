import React, { useState, useMemo } from 'react';
import { CreateEmployeeInput, CurrencyCode, UserRole, ExchangeRate } from '../types';
import { formatCurrency } from '../lib/utils';
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateEmployeeInput) => Promise<void>;
  userRole?: UserRole;
  currencies?: ExchangeRate[];
}

const COUNTRIES = ['United States', 'India', 'United Kingdom', 'Germany', 'Singapore'] as const;
const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
] as const;
const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const;
const FALLBACK_CURRENCIES: CurrencyCode[] = ['USD', 'INR', 'GBP', 'EUR', 'SGD'];

const FALLBACK_FX_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  SGD: 0.74,
  INR: 0.012,
};

const DEFAULT_JOB_TITLES: Record<string, string> = {
  Engineering: 'Software Engineer',
  Product: 'Product Manager',
  Design: 'Product Designer',
  Sales: 'Account Executive',
  Marketing: 'Marketing Specialist',
  'Human Resources': 'HR Business Partner',
  Finance: 'Financial Analyst',
  Operations: 'Operations Coordinator',
};

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userRole = 'HR_VIEWER',
  currencies,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<string>('United States');
  const [department, setDepartment] = useState<string>('Engineering');
  const [level, setLevel] = useState<string>('L3');
  const [jobTitle, setJobTitle] = useState('Senior Software Engineer');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [salaryMajor, setSalaryMajor] = useState<string>('');
  const [hireDate, setHireDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableCurrencies = useMemo(() => {
    if (currencies && currencies.length > 0) {
      return currencies.filter((c) => c.isActive).map((c) => c.code);
    }
    return FALLBACK_CURRENCIES;
  }, [currencies]);

  const ratesMap = useMemo(() => {
    const map: Record<string, number> = { ...FALLBACK_FX_RATES };
    if (currencies) {
      currencies.forEach((c) => {
        map[c.code] = Number(c.rateToUsd);
      });
    }
    return map;
  }, [currencies]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setCountry('United States');
    setDepartment('Engineering');
    setLevel('L3');
    setJobTitle(DEFAULT_JOB_TITLES['Engineering'] || 'Senior Software Engineer');
    setCurrency('USD');
    setSalaryMajor('');
    setHireDate(new Date().toISOString().split('T')[0]);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const isAdmin = userRole === 'HR_ADMIN';
  const parsedSalaryMajor = parseFloat(salaryMajor) || 0;
  const salaryMinor = Math.round(parsedSalaryMajor * 100);
  const rate = ratesMap[currency] || 1.0;
  const previewUsdMinor = Math.round(salaryMinor * rate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAdmin) {
      setErrorMessage('Forbidden: Requires HR_ADMIN role to onboard employees.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please provide both first and last name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid work email.');
      return;
    }

    if (salaryMinor <= 0) {
      setErrorMessage('Starting salary must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        country,
        department,
        level,
        jobTitle: jobTitle.trim(),
        currency,
        baseSalaryMinor: salaryMinor,
        hireDate,
      });
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to onboard employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Onboard New Employee</h3>
              <p className="text-xs text-slate-500">
                Create new hire profile, sequential ID, and initial compensation offer.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Sarah"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Connor"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah.connor@acme.com"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Country & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location *
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setJobTitle(DEFAULT_JOB_TITLES[e.target.value] || 'Specialist');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Level & Job Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seniority Level *
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Currency & Base Salary */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pay Currency *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableCurrencies.map((cur) => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Starting Base Salary ({currency}) *
              </label>
              <input
                type="number"
                required
                min="1000"
                step="500"
                value={salaryMajor}
                onChange={(e) => setSalaryMajor(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* USD Normalized Preview Card */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
            <span className="text-blue-700 font-medium">Normalized USD Equivalent:</span>
            <span className="font-mono font-bold text-blue-900 text-sm">
              {formatCurrency(previewUsdMinor, 'USD')}
            </span>
          </div>

          {/* Hire Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hire Date *
            </label>
            <input
              type="date"
              required
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isAdmin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Onboarding...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Onboard Employee</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
