import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
} from "axios";
import { HTTP_STATUS } from "./http-status";

/**
 * A standardized API client for client-side fetches using Axios.
 */

export interface ApiRequestOptions extends AxiosRequestConfig {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

let hasRedirectedToLogin = false;

function redirectToLoginIfNeeded() {
  if (typeof window === "undefined" || hasRedirectedToLogin) return;

  const { pathname } = window.location;
  if (pathname.startsWith("/login")) return;

  hasRedirectedToLogin = true;

  // Use the default login path
  const loginPath = "/login";
  window.location.href = loginPath;
}

// Create Axios instance with default config.
// `timeout` is critical: mobile browsers (esp. iOS Safari) may freeze in-flight
// requests when the tab goes to background. Without a timeout, the promise
// hangs forever after the tab resumes — UI shows skeletons indefinitely.
// 30s gives slow networks enough headroom while still forcing a retry-able
// rejection if a request truly stalls.
const axiosInstance: AxiosInstance = axios.create({
  withCredentials: true,
  timeout: 30_000,
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Let browser set multipart boundary for FormData payloads.
    if (config.data instanceof FormData && config.headers) {
      if (typeof (config.headers as any).delete === "function") {
        (config.headers as any).delete("Content-Type");
      } else {
        delete (config.headers as any)["Content-Type"];
      }
    } else if (config.headers) {
      const hasContentType =
        typeof (config.headers as any).get === "function"
          ? Boolean((config.headers as any).get("Content-Type"))
          : Boolean((config.headers as any)["Content-Type"]);
      if (!hasContentType) {
        if (typeof (config.headers as any).set === "function") {
          (config.headers as any).set("Content-Type", "application/json");
        } else {
          (config.headers as any)["Content-Type"] = "application/json";
        }
      }
    }

    // Filter params
    if (config.params) {
      const cleanedParams: Record<string, any> = {};
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanedParams[key] = value;
        }
      });
      config.params = cleanedParams;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Reset redirect flag on any successful response so subsequent 401s
    // (e.g. after a same-page re-login) still trigger the redirect.
    hasRedirectedToLogin = false;
    return response.data;
  },
  (error) => {
    if (isAxiosError(error)) {
      const status = error.response?.status || 500;
      const data = error.response?.data;

      // Handle 401 Unauthorized
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        redirectToLoginIfNeeded();
      }

      const message =
        typeof data === "string"
          ? data
          : data?.message || data?.error || error.message || "Unknown Error";

      throw new ApiError(message, status, data);
    }

    // Non-Axios error
    throw new ApiError(error instanceof Error ? error.message : "Unknown Error", 500);
  },
);

// Export the configured axios instance as 'axios'
export { axiosInstance as axios };
