/**
 * Centralized API base URL configuration.
 * In development: defaults to ${API_BASE_URL}
 * In production (Vercel): uses VITE_API_BASE_URL environment variable
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://saas-backend-wotu.onrender.com").replace(/\/$/, "");

export function buildApiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
