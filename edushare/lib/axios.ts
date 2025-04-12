import axios from 'axios';
import { config } from '../config'; // Adjust path based on where you placed it

const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;