import http from "../utils/request";

// 获取网络时间
export const getLocalTime = () => {
  return http.get("/api/v1/im/local_time");
};

// 获取离线聊天记录
export const getOfflineMessage = () => {
  return http.get("/api/v1/im/offline_message");
};

// 提交离线ACK格式
interface submitOfflineType {
  seq_id_list: [
    {
      cmd: number;
      data: {
        seq_id: string; // 消息ID;
        sender_id: string;
        receiver_id: string;
        is_group?: boolean; // 群聊消息需要添加is_group字段
      };
    }
  ];
}

// 提交离线消息
export const submitOfflineMessage = (data: submitOfflineType) => {
  return http.post("/api/v1/im/submit_message", data);
};
