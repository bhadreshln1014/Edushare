import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  //withCredentials: true, // if using cookies for auth
});

export default api;
