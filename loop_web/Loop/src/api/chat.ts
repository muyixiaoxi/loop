import http from "../utils/request";
import userStore from "@/store/user";

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

// AI回复，处理SSE流的格式
export const AIchat = async (
  data: submitOfflineType,
  onMessage: (message: string) => void,
  onError: (error: Error) => void
) => {
  try {
    const response = await fetch("/api/v1/user/llm/single_prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userStore.token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("UTF-8");

    if (reader) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const decodedChunk = decoder.decode(value, { stream: true });
        buffer += decodedChunk;

        const eventPattern = /^event:\s*message\s*\n\s*data:\s*(.*?)(?:\n\n|$)/gms;
        let match;
        while ((match = eventPattern.exec(buffer))) {
          let message = match[1].trimEnd();
          if (message === "event:message") {
            message = ' ';
          }
          onMessage(message);
        }
        buffer = buffer.slice(eventPattern.lastIndex);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      onError(error);
    }
  }
};