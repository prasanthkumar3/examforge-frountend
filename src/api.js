import { API_BASE_URL } from "./config";

export async function api(path, options = {}) {
  const { body, headers = {}, ...rest } = options;
  const token = localStorage.getItem("examforge_token");

  const config = {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body !== undefined) {
    config.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);
  const text = await response.text();
  let data = null;

  try { data = text ? JSON.parse(text) : null; }
  catch { data = text; }

  if (!response.ok) {
    const detail =
      data?.detail ||
      (Array.isArray(data?.detail) ? data.detail.map(x => x.msg).join(", ") : null) ||
      `Request failed (${response.status})`;
    const error = new Error(detail);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const get = (path) => api(path);
export const post = (path, body) => api(path, { method: "POST", body });
export const put = (path, body) => api(path, { method: "PUT", body });
export const patch = (path, body) => api(path, { method: "PATCH", body });
export const del = (path) => api(path, { method: "DELETE" });
