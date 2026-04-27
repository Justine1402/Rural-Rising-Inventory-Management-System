import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

export async function getCsrfCookie() {
  await axiosClient.get('/sanctum/csrf-cookie', {
    baseURL: '/',
  });
}

export default axiosClient;