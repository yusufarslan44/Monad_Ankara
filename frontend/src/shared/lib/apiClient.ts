export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.trim();
  }
  return 'http://localhost:4000/api';
};

const buildUrl = (path: string, params?: Record<string, string | undefined>): string => {
  const base = getBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
};

const parseBody = async (response: Response): Promise<Record<string, unknown>> => {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

export const apiClient = {
  async get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
    const response = await fetch(buildUrl(path, params), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await parseBody(response);

    if (!response.ok || data.success === false) {
      throw new ApiError(String(data.error || `HTTP ${response.status}`), response.status);
    }

    return data as T;
  },

  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await parseBody(response);

    if (!response.ok || data.success === false) {
      throw new ApiError(String(data.error || `HTTP ${response.status}`), response.status);
    }

    return data as T;
  },
};
