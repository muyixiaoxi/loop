import "./index.scss";
import { createContext, useState, useEffect, useRef } from "react";
import { Modal } from "antd";
import { observer } from "mobx-react-lite";
import globalStore from "@/store/global";
import SideNavigation from "@/components/SideNavigation";
import FirendList from "@/components/FriendList";
import EditUser from "@/components/EditUser"; // 导入 EditUser 组件
import Chat from "@/components/Chat"; // 导入 Chat 组件
import MessageList from "@/components/MessageList/idnex";
import WebSocketClient from "@/utils/websocket";
import userStore from "@/store/user";
import chatStore from "@/store/chat";
import { getChatDB } from "@/utils/chat-db";

// 创建WebSocket上下文
export const WebSocketContext = createContext<{
  sendMessageWithTimeout?: (message: any) => void;
  disconnect?: () => void;
}>({
  sendMessageWithTimeout: () => {},
  disconnect: () => {},
});

// observer 将组件变成响应式组件
const Home = observer(() => {
  const { token, userInfo } = userStore; // 获取用户信息
  const { currentFriendId, setCurrentFriendData, setCurrentMessages } =
    chatStore; // 获取发送消息的函数
  const db = getChatDB(userInfo.id); // 连接数据库
  const { isShowUserAmend, setIsShowUserAmend, currentRoute } = globalStore;
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null); // WebSocket 客户端
  // 使用ref保存currentFriendId的引用
  const currentFriendIdRef = useRef<string | number>(currentFriendId); // 监听currentFriendId的变化
  // 在Home组件中添加状态管理
  const [pendingMessages, setPendingMessages] = useState<
    Record<string, NodeJS.Timeout>
  >({});
  // 重试发送消息定时器
  const retryTimersRef = useRef<
    Record<string, { timer: NodeJS.Timeout; count: number }>
  >({});

  // 保持ref与state同步
  useEffect(() => {
    currentFriendIdRef.current = currentFriendId;
  }, [currentFriendId]);

  useEffect(() => {
    if (!token) return;
    const client = new WebSocketClient<string>({
      url: `ws://47.93.85.12:8080/api/v1/im?token=${token}`,
      onMessage: (message: any) => {
        const { cmd, data } = message;
        if (cmd === 1) {
          // 私聊消息
          handleNewStorage(data);

          // 发送ack包
          const ack = {
            cmd: 3,
            data: {
              seq_id: data.seq_id,
              sender_id: data.receiver_id,
              receiver_id: data.sender_id,
            },
          } as any;

          client.sendMessage(ack);

          // 返回接受成功的ack包
        } else if (cmd === 2) {
          // 群聊消息
          handleNewStorage(data);
        } else if (cmd === 3) {
          // // 发送的信息接受成功
          const messageId = data.seq_id;
          // 清除所有相关定时器
          if (retryTimersRef.current[messageId]) {
            clearInterval(retryTimersRef.current[messageId].timer);
            delete retryTimersRef.current[messageId];
          }

          setPendingMessages((prev) => {
            if (prev[messageId]) {
              clearTimeout(prev[messageId]);
              const newState = { ...prev };
              delete newState[messageId];
              return newState;
            }
            return prev;
          });

          // 更新消息状态为成功;
          handleUpdateMessageStatus(data, "success");
        }
      },
    });

    // 连接
    client.connect();

    // 发送消息方法
    setWsClient(client);

    return () => {
      // 组件卸载时会自动关闭连接
      client.disconnect();
    };
  }, [token]);

  // 添加发送消息方法
  const sendMessageWithTimeout = async (message: any) => {
    if (!wsClient) return;

    const messageId = message.data.seq_id;
    const maxRetries = 5;
    const retryInterval = 2000;

    // 清除已有定时器
    if (retryTimersRef.current[messageId]) {
      clearTimeout(retryTimersRef.current[messageId].timer);
      delete retryTimersRef.current[messageId];
    }

    // 初始发送
    wsClient.sendMessage(message);

    // 设置重试逻辑
    retryTimersRef.current[messageId] = {
      timer: setInterval(() => {
        const current = retryTimersRef.current[messageId];

        if (!current) return; // 防止空指针错误

        if (current.count < maxRetries) {
          current.count++;
          wsClient.sendMessage(message);
        } else {
          // 只在没有收到ACK时才标记为失败
          if (retryTimersRef.current[messageId]) {
            clearInterval(retryTimersRef.current[messageId].timer);
            delete retryTimersRef.current[messageId];

            // 检查pendingMessages是否还存在，避免重复设置失败状态
            setPendingMessages((prev) => {
              if (prev[messageId]) {
                handleUpdateMessageStatus(
                  {
                    ...message.data,
                    receiver_id: message.data.sender_id,
                    sender_id: message.data.receiver_id,
                  },
                  "failed"
                );
                const newState = { ...prev };
                delete newState[messageId];
                return newState;
              }
              return prev;
            });
          }
        }
      }, retryInterval),
      count: 0,
    };

    // 设置总超时
    setPendingMessages((prev) => ({
      ...prev,
      [messageId]: setTimeout(() => {
        if (retryTimersRef.current[messageId]) {
          clearInterval(retryTimersRef.current[messageId].timer);
          delete retryTimersRef.current[messageId];
        }

        // 检查pendingMessages是否还存在，避免重复设置失败状态
        setPendingMessages((current) => {
          if (current[messageId]) {
            // 更换发送者和接收者，正确更是聊天数据
            handleUpdateMessageStatus(
              {
                ...message.data,
                receiver_id: message.data.sender_id,
                sender_id: message.data.receiver_id,
              },
              "failed"
            );
            const newState = { ...current };
            delete newState[messageId];
            return newState;
          }
          return current;
        });
      }, 10000),
    }));
  };

  // 更新聊天信息状态
  const handleUpdateMessageStatus = async (data: any, status: string) => {
    await db.conversations
      .where("[userId+targetId]")
      .equals([data.receiver_id, data.sender_id])
      .modify((conversation: any) => {
        const messageIndex = conversation.messages?.findIndex(
          (msg: any) => msg.id === data.seq_id
        );
        if (messageIndex !== undefined && messageIndex !== -1) {
          conversation.messages[messageIndex].status = status;
        }
      });

    // 更新聊天记录
    const res: any = await db.getConversation(data.receiver_id, data.sender_id); // 获取会话数据

    // 设置当前消息
    setCurrentMessages(res?.messages);
  };

  // 处理新消息,添加本地存储
  const handleNewStorage = async (item: any) => {
    // 先添加到本地存储（乐观更新）
    await db.upsertConversation(item.receiver_id, {
      targetId: item.sender_id,
      type: "USER",
      showName: item.sender_nickname,
      headImage: item.sender_avatar,
      lastContent: item.content,
      unreadCount: 0,
      messages: [
        {
          id: item.seq_id,
          targetId: item.receiver_id,
          type: "USER",
          sendId: item.sender_id,
          content: item.content,
          sendTime: item.send_time,
          sender_nickname: item.sender_nickname,
          sender_avatar: item.sender_avatar,
          status: "success",
        },
      ],
    });

    // 更新聊天记录
    handleNewConversation(item.sender_id, Number(currentFriendIdRef.current)); // 处理新消息
  };

  // 监听当前聊天信息的变化
  const handleNewConversation = async (
    friendId: number | string,
    currentId?: number | string
  ) => {
    if (currentId && friendId === currentId) {
      // 如果当前聊天对象不是新对象，则更新会话数据
      const res: any = await db.getConversation(userInfo.id, Number(currentId)); // 获取会话数据
      // 设置当前消息
      setCurrentMessages(res?.messages);
    } else {
      // 如果不是当前聊天对象，更新会话列表
      const conversationsList: any = await db.getUserConversations(userInfo.id); // 获取会话数据
      // 更新会话列表
      setCurrentFriendData(conversationsList);
    }
  };

  // 添加组件卸载时的清理
  useEffect(() => {
    return () => {
      // 清理所有定时器
      Object.values(pendingMessages).forEach((timeout) =>
        clearTimeout(timeout)
      );
      Object.values(retryTimersRef.current).forEach(({ timer }) =>
        clearInterval(timer)
      );
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        sendMessageWithTimeout,
        disconnect: () => wsClient?.disconnect(),
      }}
    >
      <div className="main-layout">
        <SideNavigation />

        <div className="main-layout-content">
          <div className="main-layout-content-left">
            {currentRoute === "conversation" ? (
              <MessageList />
            ) : currentRoute === "friend" ? (
              <FirendList />
            ) : null}
          </div>
          <div className="main-layout-content-right">
            {currentFriendId && <Chat />}
          </div>
        </div>

        {isShowUserAmend ? (
          <Modal
            open={isShowUserAmend}
            onCancel={() => setIsShowUserAmend(!isShowUserAmend)}
            footer={null}
            title="用户信息"
          >
            <EditUser />
          </Modal>
        ) : null}
      </div>
    </WebSocketContext.Provider>
  );
});

export default Home;
