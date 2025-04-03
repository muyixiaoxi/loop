import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 创建 axios 实例
const service = axios.create({
  // 修改 baseURL
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const loopToken = localStorage.getItem('loopToken');
    if (loopToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${loopToken}`;
    }
    return config;
  },
  (error: any) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    console.error('响应错误:', error);
    return Promise.reject(error);
  }
);

// 封装请求方法
const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config);
  },
  post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config);
  },
  put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config);
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config);
  },
};

export default http;