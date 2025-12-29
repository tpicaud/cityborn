'use server';

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = process.env.ADMIN_DASHBOARD_TOKEN;

  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}
