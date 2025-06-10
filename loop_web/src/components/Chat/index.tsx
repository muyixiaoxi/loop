import "./index.scss";
import { observer } from "mobx-react-lite";
import { v4 as uuidv4 } from "uuid";
import { useState, useContext, useRef, useEffect } from "react";
import {
  OpenAIOutlined,
  CopyOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons"; // 引入 OpenAIOutlined 图标
import { Drawer, message, Spin, Modal, Checkbox } from "antd"; // 引入 Modal 组件
import { getGroupMemberList } from "@/api/group";
import { WebSocketContext } from "@/pages/Home";
import chatStore from "@/store/chat";
import userStore from "@/store/user";
import globalStore from "@/store/global";
import { getChatDB } from "@/utils/chat-db";
import ChatInfo from "@/components/ChatInfo"; // 导入 ChatInfo 组件
import { AIchat } from "@/api/chat";
import { transform } from "@/utils/emotion";
import ChatInput from "./ChatInput";

// 定义组件props类型
interface ChatProps {
  initiatePrivateVideoCall: () => Promise<void>; // 新增：私聊视频通话回调函数
}

const Chat = observer((props: ChatProps) => {
  const { initiatePrivateVideoCall } = props; // 解构传入的回调函数
  const { userInfo } = userStore;
  const { sendWithRetry } = useContext<any>(WebSocketContext); // 使用WebSocket上下文
  const {
    currentFriendId,
    currentFriendName,
    currentFriendAvatar,
    currentMessages,
    setCurrentMessages,
    currentChatInfo,
  } = chatStore;
  const { getCurrentTimeDifference } = globalStore;
  const db = getChatDB(userInfo.id);

  const chatType = currentChatInfo.type;

  const [inputValue, setInputValue] = useState(""); // 输入框的值
  const [openDrawer, setOpenDrawer] = useState(false); // 是否打开抽屉

  // 新增：管理 SSE 加载状态
  const [isAILoading, setIsAILoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 新增：管理模态框状态和内容
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState("");

  // 新增右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    message?: any;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // 群视频通话相关状态
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]); // 选择的成员ID列表
  const [groupMembers, setGroupMembers] = useState<any[]>([]); // 群成员列表
  const [isGroupMemberModalVisible, setIsGroupMemberModalVisible] =
    useState(false); // 控制群成员模态框显示

  // 处理右键点击事件
  const handleContextMenu = (e: React.MouseEvent, message: any) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu.visible]);

  // 消息发送相关工具函数
  const createMessagePayload = (content: string, receiverId: string | null) => {
    const messageId = uuidv4();
    return {
      cmd: chatType,
      data: {
        seq_id: messageId,
        sender_id: userInfo.id,
        receiver_id: receiverId,
        content,
        send_time: getCurrentTimeDifference(),
        type: 0,
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
      },
    };
  };

  // 创建会话数据，消息结构体
  const createConversationData = (
    targetId: string | null,
    content: string,
    messageId: string,
    isSelfMessage: boolean = false
  ) => ({
    targetId,
    type: chatType,
    showName: currentFriendName,
    headImage: currentFriendAvatar,
    lastContent: content,
    unreadCount: 0,
    messages: [
      {
        id: messageId,
        targetId,
        type: 0,
        sendId: userInfo.id,
        content,
        sendTime: getCurrentTimeDifference(),
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
        status: isSelfMessage ? "success" : "sending",
      },
    ],
  });

  // 发送消息主逻辑
  const sendMessageCore = async (
    content: string,
    receiverId: string | null
  ) => {
    // 获取发送的消息
    const message = createMessagePayload(content, receiverId);

    const isSelfMessage = userInfo.id === Number(receiverId);

    // 存储本地
    await db.upsertConversation(
      userInfo.id,
      createConversationData(
        receiverId,
        content,
        message.data.seq_id,
        isSelfMessage
      )
    );

    // 给自己发送时，不进行发送
    if (isSelfMessage) return;

    // 给自己发送时，不进行发送
    if (userInfo.id === Number(receiverId)) return;

    // 进行发送
    sendWithRetry(message);
  };

  // 发送新消息
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    await sendMessageCore(inputValue, currentFriendId);
    await handleNewConversation();
    setInputValue("");
  };

  // 重新发送失败的消息
  const handleResendMessage = async (failedMessage: any) => {
    await sendMessageCore(failedMessage.content, failedMessage.targetId);
    await handleNewConversation();
  };

  // 获取聊天信息
  const handleNewConversation = async () => {
    const res: any = await db.getConversation(
      userInfo.id,
      Number(currentFriendId),
      chatType
    );
    setCurrentMessages(res?.messages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

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
          setIsAILoading(false);
          setIsModalVisible(false);
          message.error("获取 AI 回复失败");
        }
      );
    } catch (error) {
      console.error("调用 AIchat 过程中出错:", error);
      setIsAILoading(false);
      setIsModalVisible(false);
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
    setInputValue(modalContent);
    setIsModalVisible(false);
  };

  // 开启视频通话
  const handleVideoCall = async () => {
    if (currentChatInfo.type === 1) {
      // 私聊
      initiatePrivateVideoCall();
    } else if (chatType === 2) {
      setSelectedMembers([]);
      // 打开群成员模态框
      fetchGroupMembers();
      setIsGroupMemberModalVisible(true);
    }
  };

  // 获取群成员列表
  const fetchGroupMembers = async () => {
    try {
      const res: any = await getGroupMemberList(Number(currentFriendId));
      setGroupMembers(
        res.data.filter((member: any) => member.user_id !== userInfo.id)
      );
    } catch (error) {
      console.error("获取群成员失败:", error);
      message.error("获取群成员失败");
    }
  };

  // 选择/取消选择成员
  const toggleMemberSelection = (member: any, checked: boolean) => {
    setSelectedMembers(
      (prev: any) =>
        checked
          ? [
              ...prev,
              {
                avatar: member.avatar,
                nickname: member.nickname,
                user_id: member.user_id, // 确保user_id字段存在
              },
            ] // 添加整个成员对象
          : prev.filter((m) => m.user_id !== member.user_id) // 根据user_id过滤
    );
  };

  // 确认选择
  const handleMemberSelectionConfirm = () => {
    console.log("已选择成员:", selectedMembers);
    setIsGroupMemberModalVisible(false);
    // 开启群视频通话回调
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="firend-avatar">
            <img src={String(currentFriendAvatar)} alt="" />
          </div>
          <div className="firend-name">{currentFriendName}</div>
        </div>
        <div className="chat-header-right">
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
          // 判断是否是好友消息，仅好友消息添加下拉框
          const isFriendMessage = message.sendId !== userInfo.id;

          const messageSystem = (
            <div className="message-system" key={message.id}>
              <div className="message-tip">
                {message.content.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          );

          const messageElement = (
            <div
              className={`message ${!isFriendMessage ? "sent" : "received"}`}
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
                <div
                  className={`message-text ${
                    isFriendMessage && "friend-message"
                  }`}
                  onContextMenu={
                    isFriendMessage
                      ? (e) => handleContextMenu(e, message)
                      : undefined
                  }
                >
                  {isFriendMessage && message.type === "video" && (
                    <span
                      title="视频通话"
                      className="icon iconfont icon-chat-video"
                    ></span>
                  )}
                  <span
                    dangerouslySetInnerHTML={{
                      __html: transform(
                        message.content.replace(/\n/g, "<br>"),
                        "emoji-small"
                      ),
                    }}
                  ></span>
                  {!isFriendMessage && message.type === "video" && (
                    <span
                      title="视频通话"
                      className="icon iconfont icon-chat-video"
                    ></span>
                  )}
                </div>
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
          return message.type === 5 ? messageSystem : messageElement;
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 聊天输入框 */}
      <ChatInput
        value={inputValue}
        onChange={(value) => setInputValue(value)}
        onSend={handleSendMessage}
        handleVideoCall={handleVideoCall}
      />

      <Modal
        title="选择群成员"
        open={isGroupMemberModalVisible}
        onCancel={() => setIsGroupMemberModalVisible(false)}
        onOk={handleMemberSelectionConfirm}
        width={600}
      >
        <div className="group-member-list">
          {groupMembers.map((member) => (
            <div className="group-member-item" key={member.user_id}>
              <Checkbox
                className="group-member-checkbox"
                onChange={(e) =>
                  toggleMemberSelection(member, e.target.checked)
                }
                checked={selectedMembers.some(
                  (m) => m.user_id === member.user_id
                )}
              >
                <div className="group-member-info">
                  <img
                    src={member.avatar}
                    alt={member.nickname}
                    className="group-member-avatar"
                  />
                  <span className="group-member-name">{member.nickname}</span>
                </div>
              </Checkbox>
            </div>
          ))}
        </div>
      </Modal>

      <Drawer
        title="聊天信息"
        placement="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        className="chatInfo-drawer"
      >
        <ChatInfo
          friendId={Number(currentFriendId)}
          chatType={chatType}
          refreshConversation={handleNewConversation}
          openDrawer={openDrawer}
          setOpenDrawer={setOpenDrawer}
        />
      </Drawer>

      {/* 右键菜单模态框 */}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="menu-item"
            onClick={() => {
              if (contextMenu.message) {
                handleAIReply(contextMenu.message.content);
              }
              closeContextMenu();
            }}
          >
            <OpenAIOutlined style={{ marginRight: 8 }} />
            AI生成回复
          </div>
          <div
            className="menu-item"
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.message?.content || "");
              message.success("已复制到剪贴板");
              closeContextMenu();
            }}
          >
            <CopyOutlined style={{ marginRight: 8 }} />
            复制
          </div>
        </div>
      )}

      {/* 自定义AI回复模态框 */}
      {isModalVisible && (
        <div className="ai-reply-custom-modal">
          <div className="ai-reply-header">
            <div className="ai-reply-title">
              <OpenAIOutlined style={{ marginRight: 8 }} />
              <span>AI生成的回复</span>
            </div>

            <div className="ai-reply-actions">
              <CheckCircleFilled
                onClick={handleApplyReply}
                style={{ fontSize: "20px", color: "#52c41a" }}
              />
              <CloseCircleFilled
                onClick={() => setIsModalVisible(false)}
                style={{ fontSize: "20px", color: "#ff4d4f" }}
              />
            </div>
          </div>
          <div className="ai-reply-content">
            {isAILoading ? (
              <div>
                <Spin />
                生成中...
              </div>
            ) : (
              <p>{modalContent}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default Chat;
