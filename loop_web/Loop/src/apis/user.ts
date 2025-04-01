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

export const login = (loginData: LoginParams) => {
  return http.post<User>('/login', loginData);
};

// 获取用户列表接口
export const getUsers = () => {
  return http.get<User[]>('/api/users');
};

// 根据 ID 获取单个用户接口
export const getUserById = (userId: number) => {
  return http.get<User>(`/api/users/${userId}`);
};

// 创建用户接口
export const createUser = (userData: Omit<User, 'id'>) => {
  return http.post<User>('/api/users', userData);
};

// 更新用户接口
export const updateUser = (userId: number, userData: Partial<User>) => {
  return http.put<User>(`/api/users/${userId}`, userData);
};

// 删除用户接口
export const deleteUser = (userId: number) => {
  return http.delete<boolean>(`/api/users/${userId}`);
};