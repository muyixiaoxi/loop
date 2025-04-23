// 好友相关接口
import http from "@/utils/request";

interface addFriend {
  friend_id: number; // 好友id
  message: string; // 添加好友的消息
}

//查询好友申请
export const searchNewfriend = () => {
  return http.get("/api/v1/user/friend/request/list");
};

//添加好友
export const postAddFriend = (addFriend: addFriend) => {
  return http.post("/api/v1/user/friend/add", addFriend);
};

// 查询好友列表
export const getFriendList = () => {
  return http.get("/api/v1/user/friend/list");
};

// 处理好友申请
export const postHandleFriend = (data: any) => {
  return http.post("/api/v1/user/friend/dispose", data)
}