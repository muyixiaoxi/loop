import "./index.scss";
import { observer } from "mobx-react-lite";
import { v4 as uuidv4 } from "uuid";
import { useState, useContext, useRef, useEffect } from "react";
import { Input, Drawer, Switch, Modal } from "antd"; // 引入 Modal 组件
import { WebSocketContext } from "@/pages/Home";
import chatStore from "@/store/chat";
import userStore from "@/store/user";
import { getChatDB } from "@/utils/chat-db";
import { usePeerConnectionStore } from "@/store/PeerConnectionStore"; // 导入 PeerConnectionStore

const Chat = observer(() => {
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
  const db = getChatDB(userInfo.id); // 连接数据库

  const chatType = currentChatInfo.type;

  const { TextArea } = Input; // 使用TextArea组件
  const [inputValue, setInputValue] = useState(""); // 输入框的值
  const [openDrawer, setOpenDrawer] = useState(false); // 是否打开抽屉
  const [topSwitch, setTopSwitch] = useState<boolean>(false); //置顶开关
  // 新增：管理视频弹框的显示状态
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false); 
  // 新增：管理本地视频流
  const [localStream, setLocalStream] = useState<MediaStream | null>(null); 

  /**
   * 发送消息
   */
  const handleSendMessage = async () => {
    const messageId = uuidv4(); // 生成唯一的消息ID

    // 在这里处理发送消息的逻辑，例如发送到服务器或WebSocket服务器
    const message = {
      cmd: chatType,
      data: {
        seq_id: messageId,
        sender_id: userInfo.id,
        receiver_id: currentFriendId, // 单聊使用好友 ID，群聊使用群聊 ID
        content: inputValue,
        send_time: Date.now(),
        type: 0,
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
      },
    };

    console.log(currentFriendName, currentFriendAvatar);

    // 先添加到本地存储（乐观更新）
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
          sendTime: Date.now(),
          sender_nickname: userInfo.nickname,
          sender_avatar: userInfo.avatar,
          status: "sending",
        },
      ],
    });

    // 更新聊天记录
    handleNewConversation();

    // 发送消息到服务器
    sendMessageWithTimeout(message);
    setInputValue(""); // 清空输入框
  };
  //发送offer
  const handlevideo = async() => {
    try {
      // 获取本地媒体流
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      // 获取用户 ID
      const sender_id = userInfo.id;
      const receiver_id = currentFriendId; 

      // 创建 PeerConnection
      usePeerConnectionStore.createPeerConnection(sendMessageWithTimeout, stream, sender_id, receiver_id);

      // 发送视频 offer
      await usePeerConnectionStore.sendVideoOffer(sendMessageWithTimeout, sender_id, receiver_id);

      // 显示视频弹框
      setIsVideoModalVisible(true);
    } catch (error) {
      console.error("Error during getting user media or sending offer: ", error);
    }
  };

  // 重新发送
  const handleResendMessage = async (failedMessage: any) => {
    const message = {
      cmd: chatType,
      data: {
        seq_id: uuidv4(), // 生成新的消息ID
        sender_id: userInfo.id,
        receiver_id: failedMessage.targetId,
        content: failedMessage.content,
        send_time: Date.now(),
        type: 0,
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
      },
    };

    // 更新本地存储状态为发送中
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
          sendTime: Date.now(),
          sender_nickname: userInfo.nickname,
          sender_avatar: userInfo.avatar,
          status: "sending",
        },
      ],
    });

    // 更新聊天记录
    handleNewConversation();

    // 发送信息到服务器
    sendMessageWithTimeout(message); // 重新发送消息
  };

  // 获取当前好友聊天记录
  const handleNewConversation = async () => {
    // 点击获取新的会话好友数据
    const res: any = await db.getConversation(
      userInfo.id,
      Number(currentFriendId),
      chatType
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

  const handleTextAreaKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.ctrlKey) {
      e.preventDefault(); // 阻止默认换行行为
      // 发送信息
      handleSendMessage();
    }
    if (e.key === "Enter" && e.ctrlKey) {
      // 允许换行
      setInputValue((prev) => prev + "\n");
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
          <div className="more-video" onClick={handlevideo}>
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
            onKeyDown={handleTextAreaKeyDown}
          />
        </div>
        {/* 移除发送群聊消息的按钮 */}
      </div>

      <Drawer
        title="聊天信息"
        placement="right"
        styles={{
          mask: { background: "transparent" },
        }}
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
            <Switch
              value={topSwitch}
              onChange={() => setTopSwitch(!topSwitch)}
            />
          </div>
        </div>
      </Drawer>

      {/* 新增：视频弹框 */}
      <Modal
        title="本地视频流"
        visible={isVideoModalVisible}
        onCancel={() => {
          setIsVideoModalVisible(false);
          if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
          }
        }}
        footer={null}
      >
        {localStream && (
          <video
            autoPlay
            muted
            ref={(video) => {
              if (video) {
                video.srcObject = localStream;
              }
            }}
            // 设置固定宽度和高度
            style={{ width: '400px', height: '300px' }} 
          />
        )}
      </Modal>
    </div>
  );
});
export default Chat;
