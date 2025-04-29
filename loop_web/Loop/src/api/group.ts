import http from "../utils/request";

// 创建群聊
export const createGroup = (CreateData: object) => {
    return http.post("/api/v1/user/group/add", CreateData);
  };
//查询群聊列表
export const getGroupList = () => {
    return http.get("/api/v1/user/group");
  };