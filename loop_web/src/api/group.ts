import http from "../utils/request";

// 创建群聊
export const createGroup = (CreateData: object) => {
  return http.post("/api/v1/user/group/add", CreateData);
};
//查询群聊列表
export const getGroupList = () => {
  return http.get("/api/v1/user/group");
};

// 查询群聊成员列表
export const getGroupMemberList = (groupId: number) => {
  return http.get(`/api/v1/user/group/member?group_id=${groupId}`);
};

// 查询群聊信息
export const getGroupInfo = (groupId: number) => {
  return http.get(`/api/v1/user/group/info?group_id=${groupId}`);
};

// 查询不在群内的用户列表
export const getNotInGroupUserList = (groupId: number) => {
  return http.get(`/api/v1/user/friend/list/group_id?group_id=${groupId}`);
};

// 添加群聊成员
export const addGroupMember = (groupId: number, userIds: number[]) => {
  return http.post(`/api/v1/user/group/member/add`, {
    group_id: groupId,
    user_ids: userIds,
  });
};

// 解散群聊
export const disbandGroup = (groupId: number) => {
  return http.post(`/api/v1/user/group/delete`, { group_id: groupId });
};

// 退出群聊
export const quitGroup = (groupId: number) => {
  return http.post(`/api/v1/user/group/exit`, { group_id: groupId });
};

// 获取等级比自己低的成员列表，删除好友时使用
export const getLowerLevelMembers = (groupId: number) => {
  return http.get(`/api/v1/user/group/member_less_role?group_id=${groupId}`);
};

// 删除群聊成员
export const deleteGroupMember = (groupId: number, userIds: number[]) => {
  return http.post(`/api/v1/user/group/member/delete`, {
    group_id: groupId,
    user_ids: userIds,
  });
};

//转让群主
export const transferGrupOwner = (groupId: number, userId: number) => {
  return http.post(`/api/v1/user/group/transfer`, {
    group_id: groupId,
    user_id: userId,
  });
};

// 设置群聊管理员
export const addGroupAdmins = (groupId: number, userIds: number[]) => {
  return http.post(`/api/v1/user/group/admin/add`, {
    group_id: groupId,
    user_ids: userIds,
  });
};

// 取消群聊管理员
export const deleteGroupAdmin = (groupId: number, userId: number) => {
  return http.post(`/api/v1/user/group/admin/delete`, {
    group_id: groupId,
    user_id: userId,
  });
};

interface GroupMessage {
  group_id: number; // 群聊ID
  name: string; // 群聊名称
  avatar: string; // 群头像
  describe: string; // 群聊描述
}

// 修改群聊信息
export const updateGroupInfo = (data: GroupMessage) => {
  return http.post(`/api/v1/user/group/update`, data);
};
