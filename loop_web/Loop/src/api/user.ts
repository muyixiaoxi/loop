//查询用户信息

import http from '../utils/request';
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
}

// 查询用户
interface searchParams {
  phone: string;
  user_id: string;
}

export const searchUser = (searchData: searchParams) => {
  return http.get<User>(`user/query?phone=${searchData}`);
};
//查询好友申请

export const searchNewfriend = () => {
  return http.get<User>('/user/friend/request/list');
};
