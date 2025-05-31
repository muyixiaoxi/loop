import http from "../utils/request";

// 定义用户类型
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
}

// 登录接口
interface LoginParams {
  phone: string;
  password: string;
}

export const LoginPost = (loginData: LoginParams) => {
  return http.post<User>("/api/v1/login", loginData);
};

interface RegisterParams {
  nickname: string;
  phone: number;
  password: string;
}

// 注册接口
export const RegisterPost = (registerData: RegisterParams) => {
  return http.post<User>("/api/v1/register", registerData);
};

// 刷新token
export const RefreshToken = (refreshToken: string) => {
  return http.post("/api/v1/refresh", { refresh_token: refreshToken });
};
