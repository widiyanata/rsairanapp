import axios from 'axios';

const API_BASE_URL = 'http://192.168.5.51:8009';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { API_BASE_URL };
export default api;
