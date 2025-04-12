// config/index.js (or directly in the root as config.js)
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export const config = {
  apiUrl: API_URL,
};