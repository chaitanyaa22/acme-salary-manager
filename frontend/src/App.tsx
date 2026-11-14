import { useEffect, useState, useCallback } from 'react';
import {
  User,
  Employee,
  CreateEmployeeInput,
  QueryEmployeesParams,
  PaginationMeta,
  AnalyticsSummary,
  CountryAnalytics,
  DepartmentAnalytics,
  LevelAnalytics,
} from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { EmployeeTable } from './components/EmployeeTable';
import { SalaryRevisionModal } from './components/SalaryRevisionModal';
import { AuditDrawer } from './components/AuditDrawer';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { LoginForm } from './components/LoginForm';

export function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Analytics state
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [analyticsCountry, setAnalyticsCountry] = useState<CountryAnalytics[]>([]);
  const [analyticsDept, setAnalyticsDept] = useState<DepartmentAnalytics[]>([]);
  const [analyticsLevel, setAnalyticsLevel] = useState<LevelAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  // Directory state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [queryParams, setQueryParams] = useState<QueryEmployeesParams>({
    page: 1,
    limit: 20,
    sortBy: 'employeeId',
    sortOrder: 'ASC',
  });
  const [tableLoading, setTableLoading] = useState<boolean>(false);

  // Modals & Drawers state
  const [selectedReviseEmployee, setSelectedReviseEmployee] = useState<Employee | null>(null);
  const [selectedHistoryEmployee, setSelectedHistoryEmployee] = useState<Employee | null>(null);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Demo access configuration: set VITE_ENABLE_DEMO=false to disable
  const isDemoEnabled = import.meta.env.VITE_ENABLE_DEMO !== 'false';

  // Demo user credentials per AGENT_CONTEXT
  const handleLoginDemo = async (role: 'HR_ADMIN' | 'HR_VIEWER') => {
    try {
      setAuthLoading(true);
      setGlobalError(null);
      const email = role === 'HR_ADMIN' ? 'admin@acme.com' : 'viewer@acme.com';
      const password = role === 'HR_ADMIN' ? 'admin123' : 'viewer123';

      const response = await api.login(email, password);
      setCurrentUser(response.user);
    } catch (err: any) {
      setGlobalError(`Login failed: ${err.message}. (Ensure backend is running and database is seeded)`);
    } finally {
      setAuthLoading(false);
    }
  };

  // Custom user credentials login
  const handleCustomLogin = async (email: string, password: string) => {
    try {
      setAuthLoading(true);
      setGlobalError(null);
      const response = await api.login(email, password);
      setCurrentUser(response.user);
    } catch (err: any) {
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  // Fetch Analytics data
  const loadAnalytics = useCallback(async () => {
    if (!currentUser) return;
    try {
      setAnalyticsLoading(true);
      const [summary, byCountry, byDept, byLvl] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getAnalyticsByCountry(),
        api.getAnalyticsByDepartment(),
        api.getAnalyticsByLevel(),
      ]);
      setAnalyticsSummary(summary);
      setAnalyticsCountry(byCountry);
      setAnalyticsDept(byDept);
      setAnalyticsLevel(byLvl);
    } catch (err: any) {
      console.warn('Analytics fetch error:', err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [currentUser]);

  // Fetch Employees directory
  const loadEmployees = useCallback(async () => {
    if (!currentUser) return;
    try {
      setTableLoading(true);
      const response = await api.getEmployees(queryParams);
      setEmployees(response.data);
      setPaginationMeta(response.meta);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to load employees.');
    } finally {
      setTableLoading(false);
    }
  }, [currentUser, queryParams]);

  // Initial authentication check: try existing token or auto-login with HR_ADMIN (if demo enabled)
  useEffect(() => {
    const initAuth = async () => {
      const existingToken = api.getToken();
      if (existingToken) {
        try {
          const user = await api.getMe();
          setCurrentUser(user);
          setAuthLoading(false);
          return;
        } catch {
          api.logout();
        }
      }
      if (isDemoEnabled) {
        // Out-of-the-box convenience for reviewer: auto-login as Admin
        await handleLoginDemo('HR_ADMIN');
      } else {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, [isDemoEnabled]);

  // Fetch Analytics data on login/user switch
  useEffect(() => {
    if (currentUser) {
      loadAnalytics();
    }
  }, [currentUser, loadAnalytics]);

  // Fetch Employees directory when user or query parameters (filters, page, sort) change
  useEffect(() => {
    if (currentUser) {
      loadEmployees();
    }
  }, [currentUser, loadEmployees]);

  // Callback on parameter update from table
  const handleParamsChange = useCallback((newParams: Partial<QueryEmployeesParams>) => {
    setQueryParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  const handleReviseEmployee = useCallback((emp: Employee) => {
    setSelectedReviseEmployee(emp);
  }, []);

  const handleViewHistory = useCallback((emp: Employee) => {
    setSelectedHistoryEmployee(emp);
  }, []);

  // Handle salary revision mutation
  const handleSaveSalaryRevision = async (data: {
    newSalaryMinor: number;
    effectiveDate: string;
    reason: string;
  }) => {
    if (!selectedReviseEmployee) return;

    await api.updateSalary(selectedReviseEmployee.id, data);
    // Refresh directory and busted analytics cache
    await Promise.all([loadEmployees(), loadAnalytics()]);
  };

  // Handle employee onboarding mutation
  const handleOnboardEmployee = async (data: CreateEmployeeInput) => {
    await api.createEmployee(data);
    await Promise.all([loadEmployees(), loadAnalytics()]);
  };

  // Handle employee deactivation (offboarding) mutation
  const handleDeactivateEmployee = async (employee: Employee) => {
    try {
      await api.deactivateEmployee(employee.id);
      await Promise.all([loadEmployees(), loadAnalytics()]);
    } catch (err: any) {
      setGlobalError(`Failed to offboard ${employee.firstName} ${employee.lastName}: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Top Header with 1-Click Role Switcher */}
      <Header
        user={currentUser}
        onLoginDemo={handleLoginDemo}
        onLogout={handleLogout}
        isLoading={authLoading}
        showDemoBar={isDemoEnabled}
      />

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Global Error Banner */}
        {globalError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{globalError}</span>
            </div>
            <button
              onClick={() => {
                setGlobalError(null);
                loadEmployees();
                loadAnalytics();
              }}
              className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {!currentUser ? (
          <LoginForm onLogin={handleCustomLogin} isLoading={authLoading} />
        ) : (
          <>
            {/* Section 1: Org Analytics Dashboard */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Compensation Intelligence</h2>
                  <p className="text-xs text-slate-500">
                    Real-time aggregated metrics normalized to USD across all operating territories.
                  </p>
                </div>
                <button
                  onClick={loadAnalytics}
                  disabled={analyticsLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${analyticsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Analytics</span>
                </button>
              </div>

              <AnalyticsDashboard
                summary={analyticsSummary}
                byCountry={analyticsCountry}
                byDepartment={analyticsDept}
                byLevel={analyticsLevel}
                isLoading={analyticsLoading}
              />
            </section>

            {/* Section 2: 10,000-Row Employee Directory */}
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">Employee Directory</h2>
                <p className="text-xs text-slate-500">
                  Filtered server-side queries over 10,000 employee records with transactional salary audit trails.
                </p>
              </div>

              <EmployeeTable
                data={employees}
                meta={paginationMeta}
                params={queryParams}
                onParamsChange={handleParamsChange}
                onReviseSalary={handleReviseEmployee}
                onViewHistory={handleViewHistory}
                onOpenAddEmployee={() => setIsAddEmployeeOpen(true)}
                onDeactivateEmployee={handleDeactivateEmployee}
                isLoading={tableLoading}
                userRole={currentUser?.role}
              />
            </section>
          </>
        )}
      </main>

      {/* Add Employee Modal (HR_ADMIN only) */}
      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSave={handleOnboardEmployee}
        userRole={currentUser?.role}
      />

      {/* Salary Revision Modal (HR_ADMIN only) */}
      <SalaryRevisionModal
        employee={selectedReviseEmployee}
        isOpen={!!selectedReviseEmployee}
        onClose={() => setSelectedReviseEmployee(null)}
        onSave={handleSaveSalaryRevision}
        userRole={currentUser?.role}
      />

      {/* Audit History Drawer */}
      <AuditDrawer
        employee={selectedHistoryEmployee}
        isOpen={!!selectedHistoryEmployee}
        onClose={() => setSelectedHistoryEmployee(null)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ACME Global Compensation & Salary Management System</span>
          <span className="text-slate-400">
            PostgreSQL 16 • Minor Monetary Precision (cents/paise) • Deterministic FX Normalization
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
