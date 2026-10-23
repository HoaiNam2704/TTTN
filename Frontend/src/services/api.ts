export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

type QueryValue = string | number | boolean | Array<string | number | boolean> | null | undefined;
type QueryParams = Record<string, QueryValue>;

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

function readErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "string") return data || fallback;
  if (typeof data !== "object" || data === null) return fallback;

  const record = data as Record<string, unknown>;

  if (record.message) {
    if (typeof record.message === "string") return record.message;
    if (Array.isArray(record.message)) return record.message.join(", ");
    if (typeof record.message === "object") {
      const values = Object.values(record.message);
      if (values.length > 0 && typeof values[0] === "string") return values[0];
    }
  }

  if (typeof record.error === "string") return record.error;
  if (typeof record.detail === "string") return record.detail;

  return fallback;
}

function readValidationErrors(data: unknown): Record<string, string[]> | undefined {
  if (typeof data !== "object" || data === null) return undefined;

  const errors = (data as Record<string, unknown>).errors;
  if (typeof errors !== "object" || errors === null) return undefined;

  return Object.fromEntries(
    Object.entries(errors as Record<string, unknown>).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(String) : [String(value)],
    ])
  );
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private async performRefresh(): Promise<string> {
    const url = `${this.baseUrl}/api/v1/auth/refresh`;
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Refresh token expired or invalid");
    }

    const data = (await response.json()) as { accessToken: string };
    return data.accessToken;
  }

  private async refreshTokenFlow(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise<string>((resolve) => {
        this.subscribeTokenRefresh((token) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const newToken = await this.performRefresh();
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", newToken);
      }
      this.onRefreshed(newToken);
      this.isRefreshing = false;
      return newToken;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshSubscribers = [];
      throw error;
    }
  }

  private handleLogoutRedirect() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("userRole");
      localStorage.removeItem("email");
      
      // Trigger a storage event manually to notify the AuthProvider
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "accessToken",
          newValue: null,
        })
      );
      window.location.href = "/login?expired=true";
    }
  }

  private buildUrl(path: string, params?: QueryParams): string {
    const url = new URL(`${this.baseUrl}${path}`, typeof window === "undefined" ? "http://localhost" : window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;

        if (Array.isArray(value)) {
          value.forEach((item) => url.searchParams.append(key, String(item)));
          return;
        }

        url.searchParams.set(key, String(value));
      });
    }

    return this.baseUrl ? url.toString() : `${url.pathname}${url.search}`;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    params?: QueryParams
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Attempt to retrieve token from localStorage if in client context
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
      // Required so browser stores/sends HttpOnly refresh_token cookie cross-origin
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);
      let data: unknown = null;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { message: text };
          }
        }
      }

      if (!response.ok) {
        const error: ApiError = {
          message: readErrorMessage(data, `HTTP error! Status: ${response.status}`),
          statusCode: response.status,
          errors: readValidationErrors(data),
        };

        // If unauthorized and it's not an auth endpoint, attempt to refresh token
        const isAuthEndpoint = path.includes("/auth/login") || path.includes("/auth/refresh");
        if (response.status === 401 && !isAuthEndpoint) {
          try {
            const newToken = await this.refreshTokenFlow();
            
            // Retry the request with new token
            const retryHeaders = new Headers(options.headers);
            if (!retryHeaders.has("Content-Type") && !(options.body instanceof FormData)) {
              retryHeaders.set("Content-Type", "application/json");
            }
            retryHeaders.set("Authorization", `Bearer ${newToken}`);
            
            return this.request<T>(path, { ...options, headers: retryHeaders }, params);
          } catch (refreshError) {
            // Refresh failed, clean up auth storage and redirect to login
            this.handleLogoutRedirect();
            throw error;
          }
        }

        throw error;
      }

      return data as T;
    } catch (error: unknown) {
      if (isApiError(error)) {
        throw error;
      }

      throw {
        message:
          error instanceof Error
            ? error.message
            : "Unable to connect to the API. Please check the backend and NEXT_PUBLIC_API_URL.",
      } as ApiError;
    }
  }

  private getAccessTokenExpiryMs(token: string): number | null {
    try {
      const payloadPart = token.split(".")[1];
      if (!payloadPart) return null;
      const json = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(json) as { exp?: number };
      return typeof payload.exp === "number" ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /** Refresh early when the access token is missing or about to expire. */
  private async ensureFreshAccessToken(skewMs = 60_000): Promise<string | null> {
    if (typeof window === "undefined") return null;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      try {
        return await this.refreshTokenFlow();
      } catch {
        return null;
      }
    }

    const expiresAt = this.getAccessTokenExpiryMs(token);
    if (expiresAt !== null && expiresAt - Date.now() <= skewMs) {
      try {
        return await this.refreshTokenFlow();
      } catch {
        return token;
      }
    }

    return token;
  }

  async uploadWithProgress<T>(
    path: string,
    formData: FormData,
    onProgress?: (percent: number) => void,
    method: "POST" | "PUT" | "PATCH" = "POST"
  ): Promise<T> {
    const isAuthEndpoint = path.includes("/auth/login") || path.includes("/auth/refresh");

    const sendOnce = (accessToken: string | null): Promise<T> =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = this.buildUrl(path);
        xhr.open(method, url);
        xhr.withCredentials = true;

        if (accessToken) {
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          let responseData: unknown = null;
          const contentType = xhr.getResponseHeader("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              responseData = JSON.parse(xhr.responseText);
            } catch {
              responseData = xhr.responseText;
            }
          } else if (xhr.responseText) {
            try {
              responseData = JSON.parse(xhr.responseText);
            } catch {
              responseData = { message: xhr.responseText };
            }
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(responseData as T);
            return;
          }

          const error: ApiError = {
            message: readErrorMessage(
              responseData,
              `HTTP error! Status: ${xhr.status}`
            ),
            statusCode: xhr.status,
            errors: readValidationErrors(responseData),
          };
          reject(error);
        };

        xhr.onerror = () => {
          reject({
            message: "Network error while uploading the file.",
          } as ApiError);
        };

        xhr.onabort = () => {
          reject({
            message: "The upload was canceled.",
          } as ApiError);
        };

        xhr.send(formData);
      });

    // Long uploads: refresh first if the token is already expired / nearly expired.
    const token = isAuthEndpoint
      ? typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null
      : await this.ensureFreshAccessToken();

    try {
      return await sendOnce(token);
    } catch (error: unknown) {
      const apiError = isApiError(error) ? error : null;
      if (!apiError || apiError.statusCode !== 401 || isAuthEndpoint) {
        throw error;
      }

      try {
        const newToken = await this.refreshTokenFlow();
        onProgress?.(0);
        return await sendOnce(newToken);
      } catch {
        this.handleLogoutRedirect();
        throw apiError;
      }
    }
  }

  async get<T>(path: string, params?: QueryParams, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" }, params);
  }

  async getText(path: string, params?: QueryParams, options?: RequestInit): Promise<string> {
    const url = this.buildUrl(path, params);
    const headers = new Headers(options?.headers);

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const response = await fetch(url, {
      ...options,
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const text = await response.text();
      let message = `HTTP error! Status: ${response.status}`;
      try {
        const json = JSON.parse(text) as { message?: string };
        if (json.message) message = json.message;
      } catch {
        if (text) message = text;
      }
      throw { message, statusCode: response.status } as ApiError;
    }

    return response.text();
  }

  async post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
  }

  async put<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async patch<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();
