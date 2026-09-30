const backendHost = import.meta.env.VITE_API_BASE_URL?.replace(/^https?:\/\//, "");

export const API_BASE_URL = `https://${backendHost}`;