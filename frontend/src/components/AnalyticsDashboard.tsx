import React from 'react';
import {
  AnalyticsSummary,
  CountryAnalytics,
  DepartmentAnalytics,
  LevelAnalytics,
} from '../types';
import { formatCurrency } from '../lib/utils';
import {
  Users,
  DollarSign,
  TrendingUp,
  Globe2,
  Briefcase,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

interface AnalyticsDashboardProps {
  summary: AnalyticsSummary | null;
  byCountry: CountryAnalytics[];
  byDepartment: DepartmentAnalytics[];
  byLevel: LevelAnalytics[];
  isLoading: boolean;
}

const COUNTRY_COLORS: Record<string, string> = {
  'United States': '#2563eb', // blue-600
  India: '#ea580c', // orange-600
  'United Kingdom': '#7c3aed', // violet-600
  Germany: '#059669', // emerald-600
  Singapore: '#db2777', // pink-600
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  summary,
  byCountry,
  byDepartment,
  byLevel,
  isLoading,
}) => {
  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  // Country Chart Data
  const countryChartData = byCountry.map((c) => ({
    name: c.country,
    totalPayrollMajor: c.totalUsdMajor,
    avgSalaryMajor: c.avgUsdMajor,
    headcount: c.headcount,
    color: COUNTRY_COLORS[c.country] || '#475569',
  }));

  // Department Chart Data
  const deptChartData = byDepartment.map((d) => ({
    name: d.department,
    avgSalaryMajor: d.avgUsdMajor,
    headcount: d.headcount,
  }));

  // Level Chart Data
  const levelChartData = byLevel.map((l) => ({
    level: l.level,
    avgSalaryMajor: l.avgUsdMajor || (l.avgUsdMinor / 100),
    minSalaryMajor: l.minUsdMajor || (l.minUsdMinor / 100),
    maxSalaryMajor: l.maxUsdMajor || (l.maxUsdMinor / 100),
    headcount: l.headcount,
  }));

  return (
    <div className="space-y-6 mb-8">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headcount */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Headcount
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {summary?.totalHeadcount?.toLocaleString() ?? '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across 5 global hubs</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Normalized Payroll Burn */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Payroll Burn (USD)
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(summary?.totalPayrollUsdMinor, 'USD', {
                compact: true,
                maximumFractionDigits: 1,
              })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {formatCurrency(summary?.totalPayrollUsdMinor, 'USD')} normalized
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Average Compensation */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Compensation (USD)
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(summary?.avgSalaryUsdMinor, 'USD')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Global median average</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Countries Supported */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Regional Currencies
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              5 Currencies
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">USD, INR, GBP, EUR, SGD</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
            <Globe2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Local Currency Breakdown Badges */}
      {summary?.currencyBreakdown && summary.currencyBreakdown.length > 0 && (
        <div className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
            Payroll Burn by Native Currency:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {summary.currencyBreakdown.map((item) => (
              <div
                key={item.currency}
                className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-lg p-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {item.currency}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {item.headcount.toLocaleString()} emp
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {formatCurrency(item.totalMinor, item.currency, {
                    compact: true,
                    maximumFractionDigits: 1,
                  })}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Avg: {formatCurrency(item.avgMinor, item.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Country Payroll Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Total Payroll Burn by Country (USD)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b25" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                  formatter={(value: any) => [
                    `$${Number(value).toLocaleString()}`,
                    'Total Payroll',
                  ]}
                />
                <Bar dataKey="totalPayrollMajor" radius={[4, 4, 0, 0]}>
                  {countryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Average Compensation */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Average Compensation by Department (USD)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b25" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                  formatter={(value: any) => [
                    `$${Number(value).toLocaleString()}`,
                    'Average Salary',
                  ]}
                />
                <Bar dataKey="avgSalaryMajor" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Level Band Distributions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Compensation by Level Band (L1 - L6)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b25" />
                <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                  formatter={(value: any) => [
                    `$${Number(value).toLocaleString()}`,
                    'Average Salary',
                  ]}
                />
                <Bar dataKey="avgSalaryMajor" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
