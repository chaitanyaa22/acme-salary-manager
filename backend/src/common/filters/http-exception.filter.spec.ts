import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let statusMock: any;
  let jsonMock: any;
  let hostMock: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    hostMock = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue({ status: statusMock }),
        getRequest: vi.fn().mockReturnValue({ url: '/api/test' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should format HttpException into standardized JSON response', () => {
    const exception = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);

    filter.catch(exception, hostMock);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'HttpException',
        path: '/api/test',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should format generic Error into 500 error response', () => {
    const exception = new Error('Database connection failed');

    filter.catch(exception, hostMock);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Database connection failed',
        error: 'Internal Server Error',
        path: '/api/test',
        timestamp: expect.any(String),
      }),
    );
  });
});
