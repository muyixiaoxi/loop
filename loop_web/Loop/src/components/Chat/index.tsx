import "./index.scss";
import { observer } from "mobx-react-lite";
import { v4 as uuidv4 } from "uuid";
import { useState, useContext, useRef, useEffect } from "react";

import { Input, Drawer, message, Button, Spin,Dropdown } from "antd"; // 引入 Spin 组件
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
  const [showCursor, setShowCursor] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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

    try {
      await AIchat(
        data as any,
        (message) => {
          setInputValue((prev) => {
            const newText = prev + message;
            setShowCursor(true); // 显示光标

            // 确保 DOM 更新后设置光标位置
            setTimeout(() => {
              const textArea = textAreaRef.current;
              if (textArea instanceof HTMLTextAreaElement) {
                textArea.focus();
                // 计算新添加内容的结束位置
                const endPos = newText.length;
                textArea.setSelectionRange(endPos, endPos);
              }
            }, 0);

            // 短暂延迟后隐藏光标
            setTimeout(() => {
              setShowCursor(false);
            }, 500); // 可以调整延迟时间，让光标闪烁更自然

            return newText;
          });
        },
        (error) => {
          console.error('调用 AIchat 失败:', error);
          message.error('获取 AI 回复失败');
          setIsAILoading(false);
        }
      );
    } catch (error) {
      console.error('调用 AIchat 过程中出错:', error);
      message.error('获取 AI 回复失败');
    } finally {
      setIsAILoading(false);
    }
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
                key: 'ai-reply',
                label: (
                  <Button type="primary" onClick={() => handleAIReply(message.content)}>
                    AI 回复
                  </Button>
                ),
              },
            ],
          };

          return (
            <Dropdown key={message.id} menu={menu} trigger={["hover"]}>
              <div
                className={`message ${
                  message.sendId === userInfo.id ? "sent" : "received"
                }`}
              >
                {/* 信息是好友发的，展示好友头像 */}
                {message.sendId !== userInfo.id && (
                  <img
                    src={message.sender_avatar}
                    alt="avatar"
                    className="message-avatar"
                  />
                )}
                <div className="message-content">
                  {/* 添加状态指示器 */}
                  {message.sendId === userInfo.id && (
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
                {message.sendId === userInfo.id && (
                  <img
                    src={userInfo.avatar}
                    alt="avatar"
                    className="message-avatar"
                  />
                )}
              </div>
            </Dropdown>
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
        {/* 移除多余的光标显示逻辑 */}
        {isAILoading && (
          <div style={{ textAlign: "right", marginTop: "8px" }}>
            <Spin />
          </div>
        )}
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

      
    </div>
  );
});

export default Chat;
