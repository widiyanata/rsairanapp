import axios from 'axios';

const API_BASE_URL = 'http://10.30.0.12:8009';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { API_BASE_URL };
export default api;
