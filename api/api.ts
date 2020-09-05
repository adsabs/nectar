import axios from 'axios';
import 'axios-debug-log';
import authInterceptor from './auth';

const API = axios.create({
  baseURL: process.env.API_HOST,
});

API.interceptors.request.use(authInterceptor);

export default API;
