import { VercelResponse } from '@vercel/node';

/**
 * Set CORS headers cho API endpoints
 */
export function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Handle OPTIONS preflight request
 */
export function handleOptionsRequest(res: VercelResponse): void {
  setCorsHeaders(res);
  res.status(200).end();
}
