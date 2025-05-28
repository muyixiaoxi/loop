import "./index.scss";
import { observer } from "mobx-react-lite";
import { v4 as uuidv4 } from "uuid";
import { useState, useContext, useRef, useEffect } from "react";
import { OpenAIOutlined } from "@ant-design/icons"; // 引入 OpenAIOutlined 图标
import { Input, Drawer, message, Button, Spin, Dropdown, Modal } from "antd"; // 引入 Modal 组件
import type { MenuProps } from "antd"; // 引入 MenuProps 类型

import { WebSocketContext } from "@/pages/Home";
import chatStore from "@/store/chat";
import userStore from "@/store/user";
import globalStore from "@/store/global";
import { getChatDB } from "@/utils/chat-db";
import ChatInfo from "@/components/ChatInfo"; // 导入 ChatInfo 组件
import { AIchat } from "@/api/chat";

// 定义组件props类型
interface ChatProps {
  onInitiateVideoCall?: () => Promise<void>; // 新增：视频通话回调函数
}

const Chat = observer((props: ChatProps) => {
  const { onInitiateVideoCall } = props; // 解构传入的回调函数
  const { userInfo } = userStore;
  const { sendMessageWithTimeout } = useContext<any>(WebSocketContext); // 使用WebSocket上下文
  const {
    currentFriendId,
    currentFriendName,
    currentFriendAvatar,
    currentMessages,
    setCurrentMessages,
    currentChatInfo,
  } = chatStore;
  const { timeDifference } = globalStore;
  const db = getChatDB(userInfo.id);

  const chatType = currentChatInfo.type;

  const { TextArea } = Input; // 使用TextArea组件
  const [inputValue, setInputValue] = useState(""); // 输入框的值
  const [openDrawer, setOpenDrawer] = useState(false); // 是否打开抽屉

  // 新增：管理 SSE 加载状态
  const [isAILoading, setIsAILoading] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 新增：管理模态框状态和内容
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState("");

  const handleSendMessage = async () => {
    const messageId = uuidv4();
    const message = {
      cmd: chatType,
      data: {
        seq_id: messageId,
        sender_id: userInfo.id,
        receiver_id: currentFriendId,
        content: inputValue,
        send_time: Date.now() + timeDifference,
        type: 0,
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
      },
    };

    await db.upsertConversation(userInfo.id, {
      targetId: currentFriendId,
      type: chatType,
      showName: currentFriendName,
      headImage: currentFriendAvatar,
      lastContent: inputValue,
      unreadCount: 0,
      messages: [
        {
          id: messageId,
          targetId: currentFriendId,
          type: 0,
          sendId: userInfo.id,
          content: inputValue,
          sendTime: Date.now() + timeDifference,
          sender_nickname: userInfo.nickname,
          sender_avatar: userInfo.avatar,
          status: "sending",
        },
      ],
    });

    handleNewConversation();
    sendMessageWithTimeout(message);
    setInputValue("");
  };

  // 重新发送
  const handleResendMessage = async (failedMessage: any) => {
    const message = {
      cmd: chatType,
      data: {
        seq_id: uuidv4(),
        sender_id: userInfo.id,
        receiver_id: failedMessage.targetId,
        content: failedMessage.content,
        send_time: Date.now() + timeDifference,
        type: 0,
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
      },
    };

    await db.upsertConversation(userInfo.id, {
      targetId: failedMessage.targetId,
      type: chatType,
      showName: currentFriendName,
      headImage: currentFriendAvatar,
      lastContent: failedMessage.content,
      unreadCount: 0,
      messages: [
        {
          id: message.data.seq_id,
          targetId: failedMessage.targetId,
          type: 0,
          sendId: userInfo.id,
          content: failedMessage.content,
          sendTime: Date.now() + timeDifference,
          sender_nickname: userInfo.nickname,
          sender_avatar: userInfo.avatar,
          status: "sending",
        },
      ],
    });

    handleNewConversation();
    sendMessageWithTimeout(message);
  };

  const handleNewConversation = async () => {
    const res: any = await db.getConversation(
      userInfo.id,
      Number(currentFriendId),
      chatType
    );
    setCurrentMessages(res?.messages);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleTextAreaKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === "Enter" && e.ctrlKey) {
      setInputValue((prev) => prev + "\n");
    }
  };

  // 处理 AI 回复的函数
  const handleAIReply = async (messageContent: string) => {
    const data: { prompt: string } = {
      prompt: messageContent,
    };
    setIsAILoading(true);
    setIsModalVisible(true);
    setModalContent("");

    // 用于标记是否是首次收到消息
    let isFirstMessage = true;

    try {
      await AIchat(
        data as any,
        (message) => {
          if (isFirstMessage) {
            // 首次收到消息时，取消加载状态
            setIsAILoading(false);
            isFirstMessage = false;
          }
          setModalContent((prev) => prev + message);
        },
        (error) => {
          console.error("调用 AIchat 失败:", error);
          message.error("获取 AI 回复失败");
          setIsAILoading(false);
        }
      );
    } catch (error) {
      console.error("调用 AIchat 过程中出错:", error);
      message.error("获取 AI 回复失败");
    } finally {
      // 如果在整个过程中都没有收到消息，才在最后取消加载状态
      if (isFirstMessage) {
        setIsAILoading(false);
      }
    }
  };

  // 新增应用按钮处理函数
  const handleApplyReply = () => {
    setInputValue((prev) => prev + modalContent);
    setIsModalVisible(false);
  };

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
          <div className="more-video" onClick={onInitiateVideoCall}>
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
          <div
            className="more-mask"
            onClick={() => {
              setOpenDrawer(true);
            }}
          >
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
        {currentMessages?.map((message: any) => {
          const menu: MenuProps = {
            items: [
              {
                key: "ai-reply",
                label: (
                  <a
                    onClick={() => handleAIReply(message.content)}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <span>AI 回复</span>
                    <OpenAIOutlined style={{ marginLeft: 4 }} />
                  </a>
                ),
              },
            ],
          };

          // 判断是否是好友消息，仅好友消息添加下拉框
          const isFriendMessage = message.sendId !== userInfo.id;

          const messageElement = (
            <div
              className={`message ${
                message.sendId === userInfo.id ? "sent" : "received"
              }`}
              key={message.id}
            >
              {/* 信息是好友发的，展示好友头像 */}
              {isFriendMessage && (
                <img
                  src={message.sender_avatar}
                  alt="avatar"
                  className="message-avatar"
                />
              )}
              <div className="message-content">
                {/* 添加状态指示器 */}
                {!isFriendMessage && (
                  <div className="message-status">
                    {message.status === "sending" && (
                      <div className="status-sending">
                        <div className="loading-circle"></div>
                      </div>
                    )}
                    {message.status === "failed" && (
                      <div
                        className="status-failed"
                        onClick={() => handleResendMessage(message)}
                      >
                        <div className="exclamation-mark">!</div>
                      </div>
                    )}
                  </div>
                )}
                <div className="message-text">{message.content}</div>
              </div>
              {/* 信息是自己发的，展示自身头像 */}
              {!isFriendMessage && (
                <img
                  src={userInfo.avatar}
                  alt="avatar"
                  className="message-avatar"
                />
              )}
            </div>
          );

          return isFriendMessage ? (
            <Dropdown key={message.id} menu={menu} trigger={["hover"]}>
              {messageElement}
            </Dropdown>
          ) : (
            messageElement
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <TextArea
          ref={textAreaRef}
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
          onKeyDown={handleTextAreaKeyDown}
        />
        {/* 移除输入框的加载状态 */}
      </div>

      <Drawer
        title="聊天信息"
        placement="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        className="chatInfo-drawer"
      >
        <ChatInfo />
      </Drawer>

      {/* 修改模态框 */}
      <Modal
        // 修改标题，添加图标
        title={
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <OpenAIOutlined style={{ marginRight: 8 }} />
            AI 回复
          </span>
        }
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="apply" type="primary" onClick={handleApplyReply}>
            应用
          </Button>,
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
        ]}
      >
        {isAILoading ? (
          <div style={{ textAlign: "center" }}>
            <Spin />
          </div>
        ) : (
          <p>{modalContent}</p>
        )}
      </Modal>
    </div>
  );
});

export default Chat;
