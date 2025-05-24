import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import userStore from "@/store/user";
let _navigate: ReturnType<typeof useNavigate>;

// 设置导航的方法（需要在组件中调用）
export const setHttpNavigate = (navigate: ReturnType<typeof useNavigate>) => {
  _navigate = navigate;
};

// 创建 axios 实例
const service = axios.create({
  // 修改 baseURL
  // baseURL: import.meta.env.VITE_API_BASE_URL,
  // baseURL: "http://47.93.85.12:8080",
  baseURL: "",
  timeout: 15000,
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { token } = userStore; // 获取 userStore 中的方法
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data.code === 1005) {
      // 清除本地token
      localStorage.removeItem("loopToken");

      // 跳转到登录页（如果有设置导航）
      if (_navigate) {
        _navigate("/login", {
          replace: true,
          state: { from: window.location.pathname },
        });
      } else {
        console.warn("导航未初始化，无法跳转登录页");
      }
      message.error("登录已过期，请重新登录");
      return Promise.reject(new Error("登录已过期，请重新登录"));
    }
    return response.data;
  },
  (error) => {
    console.error("响应错误:", error);
    return Promise.reject(error);
  }
);

// 封装请求方法
const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config);
  },
  post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return service.post(url, data, config);
  },
  put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return service.put(url, data, config);
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config);
  },
};

export default http;
