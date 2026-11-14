import React from 'react';
import { User } from '../types';
import { ShieldCheck, Eye, LogOut, CheckCircle2, Building2 } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      {/* Reviewer Quick-Switch Demo Bar */}
      {showDemoBar && (
        <div className="bg-slate-900 text-slate-100 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider">
                Demo Access:
              </span>
              <span className="text-slate-300">
                One-click role switching to evaluate Role-Based Access Control (RBAC):
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onLoginDemo('HR_ADMIN')}
                disabled={isLoading}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                  user?.role === 'HR_ADMIN'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Admin (HR_ADMIN)</span>
                {user?.role === 'HR_ADMIN' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-1" />
                )}
              </button>

              <button
                onClick={() => onLoginDemo('HR_VIEWER')}
                disabled={isLoading}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                  user?.role === 'HR_VIEWER'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                <span>Viewer (HR_VIEWER)</span>
                {user?.role === 'HR_VIEWER' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-1" />
                )}
              </button>

              {user && (
                <button
                  onClick={onLogout}
                  disabled={isLoading}
                  title="Log out"
                  className="ml-2 text-slate-400 hover:text-rose-400 transition-colors p-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              ACME Global Compensation
            </h1>
            <p className="text-xs text-slate-500">
              Multi-Currency Intelligence & Transactional Audit Trail
            </p>
          </div>
        </div>

        {/* User Status Badge */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-slate-700">{user.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    user.role === 'HR_ADMIN'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                disabled={isLoading}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Not signed in</span>
          )}
        </div>
      </div>
    </header>
  );
};
