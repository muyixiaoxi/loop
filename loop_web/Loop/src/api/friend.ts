// 好友相关接口
import http from "@/utils/request";

interface addFriend {
  friend_id: number; // 好友id
  message: string; // 添加好友的消息
}

type FriendList = {
  page_num: number;
  page_size: number;
};

//查询好友申请
export const searchNewfriend = () => {
  return http.get("/api/v1/user/friend/request/list");
};

//添加好友
export const postAddFriend = (addFriend: addFriend) => {
  return http.post("/api/v1/user/friend/add", addFriend);
};

// 查询好友列表
export const getFriendList = (getFriendList: FriendList) => {
  return http.get(
    `/api/v1/user/friend/list?page_num=${getFriendList.page_num}&page_size=${getFriendList.page_size}`
  );
};
