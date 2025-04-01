import http from '../utils/request';

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
  return http.post<User>('/login', loginData);
};


interface RegisterParams {
  nnickame: string;
  phone: number;
  password: string;
}

// 注册接口
export const RegisterPost = (registerData: RegisterParams) => {
  return http.post<User>('/register', registerData);
}
