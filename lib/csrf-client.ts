/**
 * Client-side CSRF utility functions
 * Helper functions for handling CSRF tokens in client-side code
 */

import { getAppCheckToken } from './app-check-client';

/**
 * Retrieves the CSRF token from cookies
 * @returns The CSRF token or null if not found
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null; // SSR safe
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'nythy_csrf_token' && value) {
      return value;
    }
  }
  return null;
}

/**
 * Gets both CSRF and App Check tokens
 * @returns Object with csrfToken and appCheckToken
 */
export async function getAuthTokens(): Promise<{
  csrfToken: string | null;
  appCheckToken: string | null;
}> {
  const csrfToken = getCsrfToken();
  const appCheckToken = await getAppCheckToken();
  return { csrfToken, appCheckToken };
}

/**
 * Creates headers with CSRF token and App Check token included
 * @param additionalHeaders Optional additional headers to merge
 * @returns Headers object with CSRF and App Check tokens included
 */
export async function createHeadersWithCsrf(
  additionalHeaders: HeadersInit = {}
): Promise<HeadersInit> {
  const { csrfToken, appCheckToken } = await getAuthTokens();
  const headers: HeadersInit = { ...additionalHeaders };

  if (csrfToken) {
    (headers as Record<string, string>)['x-csrf-token'] = csrfToken;
  }

  if (appCheckToken) {
    (headers as Record<string, string>)['X-Firebase-AppCheck'] = appCheckToken;
  }

  return headers;
}

/**
 * Helper function to create headers with both CSRF and App Check tokens
 * Use this in your fetch calls
 * @param additionalHeaders Optional additional headers
 * @returns Headers object with auth tokens
 */
export async function createAuthHeaders(
  additionalHeaders: HeadersInit = {}
): Promise<HeadersInit> {
  return createHeadersWithCsrf(additionalHeaders);
}

/**
 * Wrapper around fetch that automatically includes CSRF token and App Check token
 * @param input Request URL
 * @param init Request options
 * @returns Fetch response
 */
export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = init?.method?.toUpperCase() || 'GET';
  const needsAuth = ['POST', 'PUT', 'DELETE', 'PATCH', 'GET'].includes(method);

  if (needsAuth) {
    const headers = await createAuthHeaders(init?.headers);
    return fetch(input, {
      ...init,
      headers,
    });
  }

  return fetch(input, init);
}

