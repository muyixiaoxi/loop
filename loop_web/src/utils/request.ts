import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import userStore from "@/store/user";
let _navigate: ReturnType<typeof useNavigate>;
import { RefreshToken } from "@/api/login";

// 设置导航的方法（需要在组件中调用）
export const setHttpNavigate = (navigate: ReturnType<typeof useNavigate>) => {
  _navigate = navigate;
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (token?: string) => {
  failedQueue.forEach((prom) => {
    console.log(prom, "遍历请求队列");
    prom.resolve(token);
  });
  failedQueue = [];
};

// 创建 axios 实例
const service = axios.create({
  // 修改 baseURL
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // baseURL: "https://loop-im.xin",
  // baseURL: "",
  timeout: 15000,
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { access_token } = userStore; // 获取 userStore 中的方法
    if (access_token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${access_token}`;
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
  async (response: AxiosResponse) => {
    if (response.data.code === 1005) {
      const originalRequest: any = response.config;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return service(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refresh_token } = userStore;
        if (!refresh_token) {
          // 刷新token失败，清除用户信息并跳转登录
          userStore.clearToken();
          userStore.clearUserInfo();
          localStorage.removeItem("loopToken");

          if (_navigate) {
            _navigate("/login", {
              replace: true,
              state: { from: window.location.pathname },
            });
          }
          message.error("登录已过期，请重新登录"); // 提示用户登录已过期
        }

        // 调用刷新token的API
        const response: any = await RefreshToken(refresh_token);

        const { access_token: newAccessToken } = response.data;
        userStore.setToken({
          access_token: newAccessToken,
          refresh_token: refresh_token,
        });

        // 处理队列中的请求
        processQueue(newAccessToken);

        // 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return service(originalRequest);
      } catch (refreshError) {
        // 刷新token失败，清除用户信息并跳转登录
        userStore.clearToken();
        userStore.clearUserInfo();
        localStorage.removeItem("loopToken");

        if (_navigate) {
          _navigate("/login", {
            replace: true,
            state: { from: window.location.pathname },
          });
        }
        message.error("登录已过期，请重新登录");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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
