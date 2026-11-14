import {
  AuthResponse,
  User,
  Employee,
  CreateEmployeeInput,
  SalaryHistory,
  PaginatedResponse,
  QueryEmployeesParams,
  AnalyticsSummary,
  CountryAnalytics,
  DepartmentAnalytics,
  LevelAnalytics,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('acme_auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('acme_auth_token', token);
    } else {
      localStorage.removeItem('acme_auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || errorData.error || response.statusText;
      } catch {
        errorMessage = response.statusText || `Request failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth APIs
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.accessToken);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Employee APIs
  async getEmployees(params: QueryEmployeesParams = {}): Promise<PaginatedResponse<Employee>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    const queryString = query.toString();
    return this.request<PaginatedResponse<Employee>>(
      `/employees${queryString ? `?${queryString}` : ''}`,
    );
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.request<Employee>(`/employees/${id}`);
  }

  async createEmployee(data: CreateEmployeeInput): Promise<Employee> {
    return this.request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deactivateEmployee(id: string): Promise<Employee> {
    return this.request<Employee>(`/employees/${id}/deactivate`, {
      method: 'PATCH',
    });
  }

  async updateSalary(
    id: string,
    data: { newSalaryMinor: number; effectiveDate: string; reason: string },
  ): Promise<Employee> {
    return this.request<Employee>(`/employees/${id}/salary`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getSalaryHistory(id: string): Promise<SalaryHistory[]> {
    return this.request<SalaryHistory[]>(`/employees/${id}/salary-history`);
  }

  // Analytics APIs
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>('/analytics/summary');
  }

  async getAnalyticsByCountry(): Promise<CountryAnalytics[]> {
    return this.request<CountryAnalytics[]>('/analytics/by-country');
  }

  async getAnalyticsByDepartment(): Promise<DepartmentAnalytics[]> {
    return this.request<DepartmentAnalytics[]>('/analytics/by-department');
  }

  async getAnalyticsByLevel(): Promise<LevelAnalytics[]> {
    return this.request<LevelAnalytics[]>('/analytics/by-level');
  }
}

export const api = new ApiClient();
