import http from "../utils/request";

// 创建群聊
export const createGroup = (CreateData: object) => {
    return http.post("/api/v1/user/group/add", CreateData);
  };