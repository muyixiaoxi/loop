//查询用户信息

import http from "../utils/request";
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
  user_id: number;
}
interface edit {
  age: number;
  avatar: string;
  gender: number;
  nickname: string;
  signature: string;
}

interface addFriend {
  friend_id: number; // 好友id
  message: string; // 添加好友的消息
}

//手机查
export const searchUser = (searchData: searchParams) => {
  return http.get<User>(`/api/v1/user/query?phone=${searchData}`);
};
//id查
export const idsearch = (searchData: searchParams) => {
  return http.get<User>(`/api/v1/user/query?user_id=${searchData}`);
};
//查询好友申请
export const searchNewfriend = () => {
  return http.get<User>("/api/v1/user/friend/request/list");
};
//修改用户信息
export const editUser = (searchData: edit) => {
  return http.post<User>("/api/v1/user/update_info", searchData);
};

//添加好友
export const postAddFriend = (searchData: addFriend) => {
  return http.post<User>("/api/v1/user/friend/add", searchData);
};
