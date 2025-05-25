import "./index.scss";
import { observer } from "mobx-react-lite";
import { v4 as uuidv4 } from "uuid";
import { useState, useContext, useRef, useEffect } from "react";
import { Input, Drawer, Modal, message } from "antd"; // 引入 Modal 组件
import { WebSocketContext } from "@/pages/Home";
import chatStore from "@/store/chat";
import userStore from "@/store/user";
import globalStore from "@/store/global";
import { getChatDB } from "@/utils/chat-db";
import { usePeerConnectionStore } from "@/store/PeerConnectionStore"; // 导入 PeerConnectionStore
import ChatInfo from "@/components/ChatInfo"; // 导入 ChatInfo 组件
import ChatPrivateVideo from "@/components/ChatPrivateVideo";

const Chat = observer(() => {
  const { userInfo } = userStore;
  const { sendMessageWithTimeout, sendNonChatMessage } =
    useContext<any>(WebSocketContext); // 使用WebSocket上下文
  const {
    currentFriendId,
    currentFriendName,
    currentFriendAvatar,
    currentMessages,
    setCurrentMessages,
    currentChatInfo,
  } = chatStore;
  const { timeDifference } = globalStore; // 引入时间差函数
  const db = getChatDB(userInfo.id); // 连接数据库

  const chatType = currentChatInfo.type;

  const { TextArea } = Input; // 使用TextArea组件
  const [inputValue, setInputValue] = useState(""); // 输入框的值
  const [openDrawer, setOpenDrawer] = useState(false); // 是否打开抽屉
  // 新增：管理视频弹框的显示状态
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  // 新增：管理本地视频流
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // 在组件状态中添加远程视频流状态
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

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
        send_time: Date.now() + timeDifference,
        type: 0,
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
      },
    };

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
          sendTime: Date.now() + timeDifference,
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

  //打开视频通话
  const handlevideo = async () => {
    try {
      // 1. 先检查设备可用性
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some((device) => device.kind === "videoinput");
      const hasAudio = devices.some((device) => device.kind === "audioinput");

      if (!hasVideo || !hasAudio) {
        throw new Error("未检测到可用的摄像头或麦克风");
      }

      // 2. 获取媒体流时添加错误处理
      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        })
        .catch((err) => {
          console.error("获取媒体设备失败:", err);
          message.error("无法访问摄像头/麦克风，请检查设备连接和权限设置");
          throw err;
        });

      // 3. 添加设备状态检查
      if (!stream.getVideoTracks().length || !stream.getAudioTracks().length) {
        throw new Error("获取的媒体流中没有视频或音频轨道");
      }

      setLocalStream(stream);

      // 4. 创建PeerConnection (简化参数传递)
      usePeerConnectionStore.createPeerConnection(stream);

      // 5. 设置远程流处理器
      usePeerConnectionStore.setupMediaStreamHandlers(setRemoteStream);

      // 6. 创建并发送Offer
      const offer = await usePeerConnectionStore.createOffer();

      // 发送Offer消息
      const cmd = chatType === 1 ? 4 : 7; // 4:私聊视频呼叫, 7:群聊视频呼叫
      sendNonChatMessage({
        cmd,
        data: {
          sender_id: userInfo.id,
          receiver_id: Number(currentFriendId),
          session_description: offer,
        },
      });
      //发送ICE
      usePeerConnectionStore.setupIceCandidateListener(
        (candidate) => {
          // 这个回调会在设置本地描述后触发
          sendNonChatMessage({
            cmd: 6, // ICE 候选者消息
            data: {
              sender_id: userInfo.id, // 发送者 ID
              receiver_id: Number(currentFriendId), // 接收者 ID
              name: userInfo.nickname, // 发送者名称
              avatar: userInfo.avatar, // 发送者头像
              candidate_init: candidate, // 候选者信息
            },
          });
        },
        () => {
          console.log("ICE 候选者收集完成");
        }
      );

      // 6. 显示视频弹框
      setIsVideoModalVisible(true);
    } catch (error) {
      console.error("获取用户媒体或发送offer失败:", error);
      message.error("启动视频通话失败");

      // 清理资源
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
      usePeerConnectionStore.closePeerConnection();
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
        send_time: Date.now() + timeDifference,
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
          sendTime: Date.now() + timeDifference,
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
          <div
            className="more-mask"
            onClick={() => {
              setOpenDrawer(true);
            }}
          >
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
        style={{ position: "absolute", overflowX: "hidden" }}
        maskClosable={true}
        className="chatInfo-drawer"
      >
        <ChatInfo
          friendId={Number(currentFriendId)}
          setOpenDrawer={setOpenDrawer}
          openDrawer={openDrawer}
          refreshConversation={handleNewConversation}
        />
      </Drawer>

      {/* 新增：视频弹框 */}
      <Modal
        open={isVideoModalVisible}
        closable={false}
        maskClosable={false}
        footer={null}
        width={800}
        destroyOnClose
      >
        <ChatPrivateVideo
          localStream={localStream}
          remoteStream={remoteStream}
          onClose={() => {
            setIsVideoModalVisible(false);
            if (localStream) {
              localStream.getTracks().forEach((track) => track.stop());
            }
            setLocalStream(null);
            setRemoteStream(null);
            // 发送结束通话的消息
            sendNonChatMessage({
              cmd: "7",
              data: {
                sender_id: userInfo.id,
                receiver_id: Number(currentFriendId),
              },
            });
            message.success("已取消呼叫,通话结束");
            usePeerConnectionStore.closePeerConnection();
          }}
        />
      </Modal>
    </div>
  );
});
export default Chat;
