import React from 'react';
import { User } from '../types';
import { ShieldCheck, Eye, LogOut, CheckCircle2, Building2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  user: User | null;
  onLoginDemo: (role: 'HR_ADMIN' | 'HR_VIEWER') => void;
  onLogout: () => void;
  isLoading: boolean;
  showDemoBar?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLoginDemo,
  onLogout,
  isLoading,
  showDemoBar = true,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-150">
      {/* Reviewer Quick-Switch Demo Bar */}
      {showDemoBar && (
        <div className="bg-slate-900 text-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] sm:text-xs shrink-0">
                Demo:
              </span>
              <span className="text-slate-300 hidden md:inline truncate">
                One-click role switching to evaluate Role-Based Access Control (RBAC):
              </span>
              <span className="text-slate-300 md:hidden text-[11px] truncate">
                Switch demo role:
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => onLoginDemo('HR_ADMIN')}
                disabled={isLoading}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-md font-medium text-[11px] sm:text-xs transition-colors ${user?.role === 'HR_ADMIN'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="sm:hidden">Admin</span>
                <span className="hidden sm:inline">Admin (HR_ADMIN)</span>
                {user?.role === 'HR_ADMIN' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-0.5 sm:ml-1 shrink-0" />
                )}
              </button>

              <button
                onClick={() => onLoginDemo('HR_VIEWER')}
                disabled={isLoading}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-md font-medium text-[11px] sm:text-xs transition-colors ${user?.role === 'HR_VIEWER'
                  ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
              >
                <Eye className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="sm:hidden">Viewer</span>
                <span className="hidden sm:inline">Viewer (HR_VIEWER)</span>
                {user?.role === 'HR_VIEWER' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-0.5 sm:ml-1 shrink-0" />
                )}
              </button>

              {user && (
                <button
                  onClick={onLogout}
                  disabled={isLoading}
                  title="Sign out"
                  aria-label="Sign out"
                  className="text-slate-400 hover:text-rose-400 transition-colors p-1 rounded-md hover:bg-slate-800"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-lg shadow-xs shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
              ACME <span className="hidden xs:inline">Global </span>Compensation
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
              Multi-Currency Intelligence &amp; Transactional Audit Trail
            </p>
          </div>
        </div>

        {/* User Status Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs">
                  {user.name}
                </span>
              </div>

              {/* Theme Toggle Button (before logout) */}
              <ThemeToggle />

              <button
                onClick={onLogout}
                disabled={isLoading}
                title="Sign out"
                aria-label="Sign out"
                className="p-1.5 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">Not signed in</span>
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
