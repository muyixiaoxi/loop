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
  sendMessage: (message: any) => void;
  onMessage?: (message: any) => void;
}>({
  sendMessage: () => {},
  onMessage: () => {},
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
  // 保持ref与state同步
  useEffect(() => {
    currentFriendIdRef.current = currentFriendId;
  }, [currentFriendId]);

  useEffect(() => {
    if (!token) return;
    const client = new WebSocketClient<string>({
      url: `ws://47.93.85.12:8080/api/v1/im?token=${token}`,
      onMessage: (message: any) => {
        console.log("收到消息:", message);
        // const { cmd, data, receiver_id } = message;
        console.log("currentFriendId", currentFriendId);
        if (message.cmd === 1) {
          // 存储新消息
          handleNewStorage(message.data);
        } else if (message.cmd === 3) {
          console.log("收到消息:", message);
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

  // 处理新消息,添加本地存储
  const handleNewStorage = async (item: any) => {
    // 先添加到本地存储（乐观更新）
    console.log(item, "item");
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
      console.log("当前聊天对象不变");
      // 如果当前聊天对象不是新对象，则更新会话数据
      const res: any = await db.getConversation(userInfo.id, Number(currentId)); // 获取会话数据
      // 设置当前消息
      setCurrentMessages(res?.messages);
    } else {
      console.log("当前聊天对象变化");
      // 如果不是当前聊天对象，更新会话列表
      const conversationsList: any = await db.getUserConversations(userInfo.id); // 获取会话数据
      // 更新会话列表
      setCurrentFriendData(conversationsList);
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        sendMessage: (message) => wsClient?.sendMessage(message),
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
