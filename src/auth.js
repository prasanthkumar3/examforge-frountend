import { get, post } from "./api";

export const auth = {
  async login(email, password) {
    const data = await post("/api/auth/login", { email, password });
    localStorage.setItem("examforge_token", data.access_token);
    return getMe();
  },
  async register(payload) {
    return post("/api/auth/register", payload);
  },
};

export async function getMe() {
  return get("/api/auth/me");
}

export function logout() {
  localStorage.removeItem("examforge_token");
}

export function hasToken() {
  return Boolean(localStorage.getItem("examforge_token"));
}
