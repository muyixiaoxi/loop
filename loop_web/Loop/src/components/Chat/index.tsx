import "./index.scss";
import { observer } from "mobx-react-lite";
import { useState, useContext, useRef, useEffect } from "react";
import { Input, Drawer, Switch } from "antd";
import { WebSocketContext } from "@/pages/Home";
import chatStore from "@/store/chat";
import userStore from "@/store/user";
import { getChatDB } from "@/utils/chat-db";

const Chat = observer(() => {
  const { userInfo } = userStore;
  const { sendMessage } = useContext(WebSocketContext); // 使用WebSocket上下文
  const {
    currentFriendId,
    currentFriendName,
    currentFriendAvatar,
    currentMessages,
    setCurrentMessages,
  } = chatStore;
  const db = getChatDB(userInfo.id); // 连接数据库

  const { TextArea } = Input; // 使用TextArea组件
  const [inputValue, setInputValue] = useState(""); // 输入框的值
  const [openDrawer, setOpenDrawer] = useState(false); // 是否打开抽屉
  const [topSwitch, setTopSwitch] = useState<boolean>(false); //置顶开关
  /**
   * 发送消息
   */
  const handleSendMessage = async () => {
    // 在这里处理发送消息的逻辑，例如发送到服务器或WebSocket服务器
    const message: any = {
      cmd: 1,
      data: {
        seq_id: String(Date.now()),
        sender_id: userInfo.id,
        receiver_id: currentFriendId, // 这里可以根据需要设置接收者ID,
        content: inputValue,
        send_time: Date.now(),
        type: 0,
      },
    };

    // 先添加到本地存储（乐观更新）
    await db.upsertConversation(userInfo.id, {
      targetId: currentFriendId,
      type: "USER",
      showName: currentFriendName,
      headImage: currentFriendAvatar,
      lastContent: inputValue,
      unreadCount: 0,
      messages: [
        {
          id: Date.now(),
          targetId: currentFriendId,
          type: "USER",
          sendId: userInfo.id,
          content: inputValue,
          sendTime: Date.now(),
          status: "read",
        },
      ],
    });

    handleNewConversation();
    // 发送消息到服务器
    sendMessage(message);
    setInputValue(""); // 清空输入框
  };

  // 获取当前好友聊天记录
  const handleNewConversation = async () => {
    // 点击获取新的会话好友数据
    const res: any = await db.getConversation(
      userInfo.id,
      Number(currentFriendId)
    ); // 获取会话数据
    setCurrentMessages(res?.messages); // 设置当前消息
  };

  const messagesEndRef = useRef<HTMLDivElement>(null); // 消息列表的最后一个元素

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 自动滚动到底部的效果
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="firend-avatar">
            <img src={currentFriendAvatar} alt="" />
          </div>
          <div className="firend-name">{currentFriendName}</div>
        </div>
        <div className="chat-header-right">
          <div className="more-video">
            {/* 视频 */}
            <svg
              fill="#E46342"
              height="34px"
              role="presentation"
              viewBox="0 0 36 36"
              width="34px"
            >
              <path d="M9 9.5a4 4 0 00-4 4v9a4 4 0 004 4h10a4 4 0 004-4v-9a4 4 0 00-4-4H9zm16.829 12.032l3.723 1.861A1 1 0 0031 22.5v-9a1 1 0 00-1.448-.894l-3.723 1.861A1.5 1.5 0 0025 15.81v4.38a1.5 1.5 0 00.829 1.342z"></path>
            </svg>
          </div>
          <div className="more-mask" onClick={() => setOpenDrawer(true)}>
            {/* 更多 */}
            <svg
              fill="#E46342"
              height="28px"
              role="presentation"
              viewBox="0 0 36 36"
              width="28px"
            >
              <path
                clipRule="evenodd"
                d="M18 29C24.0751 29 29 24.0751 29 18C29 11.9249 24.0751 7 18 7C11.9249 7 7 11.9249 7 18C7 24.0751 11.9249 29 18 29ZM19.5 18C19.5 18.8284 18.8284 19.5 18 19.5C17.1716 19.5 16.5 18.8284 16.5 18C16.5 17.1716 17.1716 16.5 18 16.5C18.8284 16.5 19.5 17.1716 19.5 18ZM23 19.5C23.8284 19.5 24.5 18.8284 24.5 18C24.5 17.1716 23.8284 16.5 23 16.5C22.1716 16.5 21.5 17.1716 21.5 18C21.5 18.8284 22.1716 19.5 23 19.5ZM14.5 18C14.5 18.8284 13.8284 19.5 13 19.5C12.1716 19.5 11.5 18.8284 11.5 18C11.5 17.1716 12.1716 16.5 13 16.5C13.8284 16.5 14.5 17.1716 14.5 18Z"
                fillRule="evenodd"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <div className="chat-center">
        {currentMessages?.map((message: any) => (
          <div
            key={message.id}
            className={`message ${
              message.sendId === userInfo.id ? "sent" : "received"
            }`}
          >
            {/* 信息是好友发的，展示好友头像 */}
            {message.sendId !== userInfo.id && (
              <img
                src={message.sendAvatar || currentFriendAvatar}
                alt="avatar"
                className="message-avatar"
              />
            )}
            <div className="message-content">
              <div className="message-text">{message.content}</div>
            </div>
            {/* 信息是自己发的，展示自身头像 */}
            {message.sendId === userInfo.id && (
              <img
                src={userInfo.avatar}
                alt="avatar"
                className="message-avatar"
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="chat-input-textarea">
          <TextArea
            placeholder="按 Ctrl + Enter 换行，按 Enter 发送"
            rows={4}
            className="textarea"
            style={{
              lineHeight: "1.1",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",
            }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.ctrlKey) {
                e.preventDefault(); // 阻止默认换行行为
                // 这里添加发送消息的逻辑
                handleSendMessage();
              }
              if (e.key === "Enter" && e.ctrlKey) {
                // 允许换行
                setInputValue((prev) => prev + "\n");
              }
            }}
          />
        </div>
      </div>

      <Drawer
        title="聊天信息"
        placement="right"
        maskStyle={{ background: "transparent" }}
        onClose={() => setOpenDrawer(false)}
        open={openDrawer}
        style={{ position: "absolute" }}
        maskClosable={true}
      >
        <div className="chat-drawer">
          <div className="chat-drawer-img">
            <img src={currentFriendAvatar} alt="头像" />
          </div>
          <div className="chat-drawer-name">{currentFriendName}</div>
          <div className="chat-drawer-istop">
            <div className="chat-drawer-istop-text">聊天置顶</div>
            <Switch value={topSwitch} onChange={() => console.log("切换")} />
          </div>
        </div>
      </Drawer>
    </div>
  );
});
export default Chat;
