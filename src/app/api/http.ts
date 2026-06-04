const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const http = {
  post: async (url: string, body: any, token?: string) => {
    return fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  },

  get: async (url: string, token?: string) => {
    return fetch(`${BASE_URL}${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },
};