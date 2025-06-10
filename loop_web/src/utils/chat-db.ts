import Dexie, { Table } from "dexie";

// 消息类型定义
export interface ChatMessage {
  id?: number; // 消息ID (可选，用于更新)
  targetId: number; // 会话目标ID (群组ID或用户ID)
  type: "GROUP" | "USER"; // 会话类型
  sendId: number; // 发送者ID
  sendNickName?: string; // 发送者昵称
  sendAvatar?: string; // 图片URL (可选)
  content: string; // 消息内容
  sendTime: number; // 发送时间戳
  status?: "success" | "sending" | "failed"; // 消息状态
  messageType?: number; // 消息类型(0:文本 1:图片等)
}

// 会话类型定义
export interface Conversation {
  targetId: number | string | null; // 会话目标ID
  type: number; // 会话类型 1: 单聊 2: 群聊
  showName: string; // 显示名称
  headImage: string; // 头像
  lastContent: string; // 最后一条消息内容
  lastSendTime: number; // 最后发送时间
  unreadCount: number; // 未读消息数
  messages?: ChatMessage[]; // 关联的消息(可选)
  isPinned?: boolean; // 是否置顶(可选)
}

class ChatDB extends Dexie {
  // 使用复合键 [userId+targetId] 作为主键
  conversations!: Table<
    Conversation & { userId: number },
    [number, number],
    [number, number]
  >;

  constructor(userId: number) {
    // 数据库名称包含用户ID
    super(`ChatDB_${userId}`);

    this?.version(1).stores({
      // 使用复合键 [userId+targetId] 作为主键
      conversations: "[userId+targetId+type]",
    });
  }

  // 添加或更新会话（自动关联用户ID）
  upsertConversation = async (
    userId: number,
    conversation: Conversation | any
  ) => {
    // 确保targetId是数字类型
    const targetId = Number(conversation.targetId);
    const chatType = Number(conversation.type);
    const key: [number, number, number] = [userId, targetId, chatType];

    const existing = await this.conversations.get(key);

    // 合并消息时使用更精确的去重逻辑
    const mergedMessages = [
      ...(existing?.messages || []),
      ...(conversation.messages || []),
    ]
      .filter(
        (msg, index, self) =>
          self.findIndex(
            (m) =>
              m.id === msg.id ||
              (m.sendTime === msg.sendTime && m.sendId === msg.sendId)
          ) === index
      )
      .sort((a, b) => a.sendTime - b.sendTime);

    // 更新会话数据
    return this.conversations.put({
      ...(existing || {}), // 保留已有数据
      ...conversation, // 合并新数据
      userId,
      targetId, // 确保是数字类型
      messages: mergedMessages,
      lastSendTime: Date.now(),
    });
  };

  // 获取用户所有会话
  getUserConversations = async (userId: number) => {
    const conversations = await this.conversations
      .where("userId")
      .equals(userId)
      .toArray();

    // 按置顶状态和最后发送时间排序
    return conversations.sort((a, b) => {
      // 如果a是置顶而b不是，a排在前面
      if (a.isPinned && !b.isPinned) return -1;
      // 如果b是置顶而a不是，b排在前面
      if (!a.isPinned && b.isPinned) return 1;
      // 如果都置顶或都不置顶，按最后发送时间降序
      return b.lastSendTime - a.lastSendTime;
    });
  };

  // 获取特定会话详情
  getConversation = async (userId: number, targetId: number, type: number) => {
    return this.conversations.get([userId, targetId, type]);
  };

  // 清空特定会话的消息记录（保留会话）
  clearMessages = async (userId: number, targetId: number, type: number) => {
    const key: [number, number, number] = [userId, targetId, type];
    const existing = await this.conversations.get(key);

    if (existing) {
      return this.conversations.update(key, {
        messages: [],
        lastContent: "",
        unreadCount: 0,
      });
    }
  };

  // 删除整个会话（包括消息记录）
  deleteConversation = async (
    userId: number,
    targetId: number,
    type: number
  ) => {
    const key: [number, number, number] = [userId, targetId, type];
    return this.conversations.delete(key);
  };
}

// 数据库实例管理器
class DBManger {
  private static instances = new Map<number, ChatDB>();

  static getDB(userId: number): ChatDB {
    if (!this.instances.has(userId)) {
      this.instances.set(userId, new ChatDB(userId));
    }
    return this.instances.get(userId)!;
  }

  static clearDB(userId: number) {
    this.instances.delete(userId);
  }
}

// 导出获取数据库的方法
export function getChatDB(userId: number) {
  return DBManger.getDB(userId);
}
