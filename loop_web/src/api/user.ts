//查询用户信息

import http from "../utils/request";
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface edit {
  age: number;
  avatar: string;
  gender: number;
  nickname: string;
  signature: string;
}

//手机查
export const searchUser = (searchData: string) => {
  return http.get<User>(`/api/v1/user/query?phone=${searchData}`);
};
//id查
export const idsearch = (searchData: number | string) => {
  return http.get<User>(`/api/v1/user/query?user_id=${searchData}`);
};

//修改用户信息
export const editUser = (searchData: edit) => {
  return http.post<User>("/api/v1/user/update_info", searchData);
};
