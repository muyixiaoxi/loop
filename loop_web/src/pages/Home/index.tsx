import "./index.scss";
import { createContext, useState, useEffect, useRef } from "react";
import { Modal, message } from "antd";
import { observer } from "mobx-react-lite";
import globalStore from "@/store/global";
import SideNavigation from "@/components/SideNavigation";
import FirendList from "@/components/FriendList"; // 推测此处可能是拼写错误，应为 FriendList
import GroupList from "@/components/GroupList"; // 推测此处可能是拼写错误，应为 GroupList
import EditUser from "@/components/EditUser"; // 导入 EditUser 组件
import Chat from "@/components/Chat"; // 导入 Chat 组件
import MessageList from "@/components/MessageList/index";
import { webSocketManager } from "@/utils/websocket";
import userStore from "@/store/user";
import chatStore from "@/store/chat";
import { getChatDB } from "@/utils/chat-db";
import {
  getLocalTime,
  getOfflineMessage,
  submitOfflineMessage,
} from "@/api/chat";
import ChatPrivateVideo from "@/components/ChatPrivateVideo";
import ChatVideoAcceptor from "@/components/ChatVideoAcceptor";
import { usePrivatePeerStore } from "@/store/privatePeerStore"; // 确保导入
import { v4 as uuidv4 } from "uuid";

// 创建WebSocket上下文
export const WebSocketContext = createContext<{
  sendMessageWithTimeout?: (message: any) => void;
  sendNonChatMessage?: (message: any) => void;
  disconnect?: () => void;
}>({
  sendMessageWithTimeout: () => {},
  sendNonChatMessage: () => {},
  disconnect: () => {},
});

// observer 将组件变成响应式组件
const Home = observer(() => {
  const { access_token, userInfo } = userStore; // 用户认证信息和用户基本信息
  const userId = userInfo.id; // 用户ID
  const {
    currentFriendId, // 当前聊天好友ID
    currentFriendName, // 当前聊天好友名称
    currentFriendAvatar, // 当前聊天好友头像
    setCurrentChatList, // 设置当前聊天列表
    setCurrentMessages, // 设置当前消息列表
  } = chatStore;

  // 数据库相关
  const db = getChatDB(userInfo.id); // 获取当前用户的聊天数据库实例

  // 全局状态
  const {
    isShowUserAmend, // 是否显示用户信息修改弹窗
    setIsShowUserAmend, // 设置用户信息修改弹窗状态
    currentRoute, // 当前路由(会话/好友等)
    setTimeDifference, // 设置客户端与服务器时间差
    getCurrentTimeDifference, // 获取时间戳
  } = globalStore;

  // WebSocket相关状态
  const [wsClient, setWsClient] = useState<any>(null); // WebSocket客户端实例

  // 使用ref保存易变状态，避免闭包问题
  const currentFriendIdRef = useRef<string | number>(currentFriendId); // 当前聊天好友ID引用
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 通话超时计时器引用

  // 消息重试机制相关状态
  const [pendingMessages, setPendingMessages] = useState<
    Record<string, NodeJS.Timeout>
  >({}); // 待确认消息列表
  const retryTimersRef = useRef<
    Record<string, { timer: NodeJS.Timeout; count: number }>
  >({}); // 消息重试计时器

  // 视频通话相关状态
  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // 本地媒体流
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null); // 远程媒体流
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false); // 视频弹窗可见性
  const [isCalling, setIsCalling] = useState(false); // 是否正在呼叫中
  const [callerInfo, setCallerInfo] = useState<any>({}); // 呼叫者信息
  const isSelfCallerRef = useRef<boolean>(false); // 是否是自己发起的呼叫

  // 群视频通话相关状态，选择的成员ID列表
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);

  /**
   * 计算并设置客户端与服务器的时间差
   * 1. 获取本地开始时间
   * 2. 请求服务器时间
   * 3. 计算网络延迟和最终时间差
   */
  const LocalTime = async () => {
    const MAX_RETRIES = 3; // 改为3次请求
    const timeDiffs: number[] = [];

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const startTime = Date.now();
        const { data }: any = await getLocalTime();
        const endTime = Date.now();

        // 计算差值
        const timeDiff = Math.round(data.time - (endTime + startTime) / 2);

        timeDiffs.push(timeDiff);
      } catch (error) {
        console.error("获取服务器时间失败:", error);
      }
    }

    // 找出与其他两个差值最大的那个
    if (timeDiffs.length === 3) {
      // 计算两两之间的差值
      const diff1 = Math.abs(timeDiffs[0] - timeDiffs[1]);
      const diff2 = Math.abs(timeDiffs[0] - timeDiffs[2]);
      const diff3 = Math.abs(timeDiffs[1] - timeDiffs[2]);

      // 找出最大差值对应的索引
      const maxDiff = Math.max(diff1, diff2, diff3);
      let indexToRemove = -1;

      if (maxDiff === diff1 && maxDiff === diff2) {
        indexToRemove = 0; // 第一个与其他两个差值都大
      } else if (maxDiff === diff1 && maxDiff === diff3) {
        indexToRemove = 1; // 第二个与其他两个差值都大
      } else if (maxDiff === diff2 && maxDiff === diff3) {
        indexToRemove = 2; // 第三个与其他两个差值都大
      }

      // 移除异常值
      if (indexToRemove !== -1) {
        timeDiffs.splice(indexToRemove, 1);
      }
    }

    // 计算剩余数据的平均值
    const avgTimeDiff = Math.round(
      timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
    );
    setTimeDifference(avgTimeDiff);
  };

  //  存储离线信息到本地
  const ChangeOffline = async () => {
    const { data }: any = await getOfflineMessage();
    const userId = userInfo.id;
    const processedData: any = []; // 用于存储处理后的数据;

    for (const item of data) {
      if (item?.cmd === 1) {
        await handleNewStorage(item.data, 1, item.type);
        processedData.push({
          seq_id: item.data.seq_id,
          sender_id: userId,
          receiver_id: item.data.sender_id,
        });
      } else if (item?.cmd === 2) {
        await handleNewStorage(item.data, 2, item.type);
        const existingIndex = processedData.findIndex(
          (msg: any) => msg.receiver_id === item.data.receiver_id
        );
        if (existingIndex !== -1) {
          processedData[existingIndex] = {
            seq_id: item.data.seq_id,
            sender_id: userId,
            receiver_id: item.data.receiver_id,
            is_group: true,
          };
        } else {
          processedData.push({
            seq_id: item.data.seq_id,
            sender_id: userId,
            receiver_id: item.data.receiver_id,
            is_group: true,
          });
        }
      } else if (item?.cmd === 12) {
        // 单聊系统消息
        await handleNewStorage(item.data, 1, item.type);
        processedData.push({
          seq_id: item.data.seq_id,
          sender_id: userId,
          receiver_id: item.data.sender_id,
        });
      }
    }

    // 发送离线消息ACK
    await submitOfflineMessage(processedData);
  };

  useEffect(() => {
    // 视频链接状态变化
    if (usePrivatePeerStore.isVideoChatStarted) {
      console.log("检测到视频已经挂断");
      // 视频已经挂断
      setIsVideoModalVisible(false);
      // 可以发送拒绝消息给对方
      sendNonChatMessage({
        cmd: 7, // 拒绝命令
        data: {
          sender_id: userInfo.id,
          receiver_id: callerInfo.sender_id,
          content: "对方已挂断",
        },
      });

      // 关闭连接
      usePrivatePeerStore.closePeerConnection();
      isSelfCallerRef.current = false; // 重置为非主叫方
    }
  }, [usePrivatePeerStore?.isVideoChatStarted]);

  useEffect(() => {
    LocalTime(); // 调用获取当前时间的函数
    ChangeOffline(); // 调用获取离线聊天的方法
  }, []);

  // 保持ref与state同步
  useEffect(() => {
    currentFriendIdRef.current = currentFriendId;
  }, [currentFriendId]);
  // 保持 ref 与 state 同步

  useEffect(() => {
    initWebSocket(); // 初始化WebSocket连接
  }, [access_token]);

  /**
   * 初始化WebSocket连接
   */
  const initWebSocket = () => {
    if (!access_token) return;

    const client = webSocketManager.connect({
      url: import.meta.env.VITE_WS_BASE_URL,
      onMessage: (message) => {
        // 将client作为第二个参数传递给处理函数
        handleWebSocketMessage(message, client);
      },
    });

    setWsClient(client);
    return () => client?.disconnect();
  };

  /**
   * 处理WebSocket消息
   */
  const handleWebSocketMessage = async (wsMessage: any, client: any) => {
    const { cmd, data } = wsMessage;

    switch (cmd) {
      case 1: // 私聊消息
        await handlePrivateMessage(data, client);
        break;
      case 2: // 群聊消息
        await handleGroupMessage(data, client);
        break;
      case 3: // 消息响应ACK
        handleMessageAckResponse(data);
        break;
      case 4: // Offer处理
        await handleVideoOffer(data, client);
        break;
      case 5: // Answer处理
        await handleVideoAnswer(data);
        break;
      case 6: // ICE候选处理
        await handleIceCandidate(data);
        break;
      case 7: // 私聊挂断处理
        await handleCallEnd(data);
        break;
      case 8: // 群聊Offer处理
        await handleGroupVideoOffer(data, client);
        break;
      case 9: // 群聊Answer处理
        await handleGroupVideoAnswer(data);
        break;
      case 10: // 群聊ICE候选处理
        await handleGroupIceCandidate(data);
        break;
      case 11: // 群聊挂断处理
        break;
      case 12: // 单聊系统消息
        await handleSystemMessage(data, 1);
        break;
      case 13: // 群聊系统消息
        await handleSystemMessage(data, 2);
        break;
    }
  };

  /**
   * cmd: 1 私聊消息
   * 处理私聊消息
   * 1. 存储消息到本地
   * 2. 发送ACK确认
   */
  const handlePrivateMessage = async (data: any, client: any) => {
    await handleNewStorage(data, 1, data.type);
    // 发送ack包
    const ack = {
      cmd: 3,
      data: {
        seq_id: data.seq_id,
        sender_id: userId,
        receiver_id: data.sender_id,
      },
    } as any;
    client.sendMessage(ack);
  };

  /**
   * cmd: 2 群聊消息
   * 处理群聊消息
   * 1. 存储消息到本地
   * 2. 发送ACK确认(带群组标识)
   */
  const handleGroupMessage = async (data: any, client: any) => {
    await handleNewStorage(data, 2, data.type);
    // 发送ack包
    const ack = {
      cmd: 3,
      data: {
        seq_id: data.seq_id,
        sender_id: userId,
        receiver_id: data.receiver_id,
        is_group: true, // 群聊消息需要添加is_group字段
      },
    } as any;
    client.sendMessage(ack);
  };

  /**
   * cmd: 3 ACK响应
   * 处理消息ACK响应
   * 1. 清除重试定时器
   * 2. 更新消息状态为成功
   */
  const handleMessageAckResponse = (data: any) => {
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

    if (data.not_transmit) {
      // 更新消息状态未失败
      handleUpdateMessageStatus(data, "failed");
      return;
    }
    // 更新消息状态为成功;
    handleUpdateMessageStatus(data, "success");
  };

  /**
   * cmd: 4 私聊视频通话Offer请求
   * 处理私聊视频通话Offer请求
   * 1. 检查当前是否已在通话中
   * 2. 如果在通话中则发送拒绝消息
   * 3. 否则设置呼叫者信息并显示接听界面
   * @param data - 包含发送者信息和SDP offer的对象
   */
  const handleVideoOffer = async (data: any, client: any) => {
    // 单聊发送的offer
    if (isCalling || isVideoModalVisible) {
      // 已经处于呼叫或被呼叫状态，直接拒绝
      const params: any = {
        cmd: 7, // 拒绝命令
        data: {
          content: "对方通话中，请稍后再拨",
          sender_id: userInfo.id,
          receiver_id: data.sender_id,
        },
      };
      client.sendMessage(params);
    } else {
      // 设置呼叫者数据，用于接听
      setCallerInfo(data);
      // 打开弹窗，等待接听
      setIsCalling(true);
    }
  };

  /**
   * cmd: 5 私聊视频通话Answer响应
   * 处理视频通话Answer响应
   * 1. 设置远程SDP描述
   * 2. 开始发送ICE候选
   * @param data - 包含SDP answer的对象
   */
  const handleVideoAnswer = async (data: any) => {
    // 设置远程描述
    await usePrivatePeerStore.setRemoteDescription(data.session_description);
    await usePrivatePeerStore.flushIceCandidates(); // 开始发送 ICE 候选
    if (callTimeoutRef.current) {
      //关闭通话定时器
      clearTimeout(callTimeoutRef.current);
    }
  };

  /**
   * cmd: 6 视频ICE候选信息
   * 处理ICE候选信息
   * 1. 添加远程ICE候选
   * 2. 开始发送本地ICE候选
   * @param data - 包含ICE候选信息的对象
   */
  const handleIceCandidate = async (data: any) => {
    // ICE候选消息
    await usePrivatePeerStore.addIceCandidate(data.candidate_init);

    // 收到ICE后开始发送自己的ICE候选;
    await usePrivatePeerStore.flushIceCandidates(); // 开始发送 ICE 候选

    if (callTimeoutRef.current) {
      //开始通话关闭定时器
      clearTimeout(callTimeoutRef.current);
    }
  };

  /**
   * cmd:7 私聊视频通话结束
   * 处理通话结束请求
   * 1. 关闭PeerConnection连接
   * 2. 清理媒体流资源
   * 3. 重置通话状态
   * 4. 显示通话结束提示
   * @param data - 包含通话结束信息的对象
   */
  const handleCallEnd = async (data: any) => {
    console.log("收到挂断消息", isSelfCallerRef.current, data);
    if (isSelfCallerRef.current) {
      const params = {
        seq_id: uuidv4(),
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        content: "对方已挂断",
        send_time: getCurrentTimeDifference(),
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
      };
      await handleSendMessage(params, 1, "video");
    } else {
      await handleNewStorage(data, 1, "video");
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }
    // 先关闭连接
    usePrivatePeerStore.closePeerConnection();

    // 确保媒体流被清理
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);

    // 最后更新状态
    setIsVideoModalVisible(false);
    setIsCalling(false);

    // 显示挂断消息
    message.success(data.content);
    isSelfCallerRef.current = false;
  };

  /**
   * cmd: 8 群聊视频通话Offer请求
   * 处理群聊视频通话Offer请求
   * 1. 检查当前是否已在通话中
   * 2. 如果在通话中则发送拒绝消息
   * 3. 否则设置呼叫者信息并显示接听界面
   * @param data - 包含发送者信息和SDP offer的对象
   */
  const handleGroupVideoOffer = async (data: any, client: any) => {
    console.log("收到群聊视频Offer", data, client);
  };

  /**
   * cmd: 9 群聊视频通话Answer响应
   * 处理群聊视频通话Answer响应
   * 1. 设置远程SDP描述
   * 2. 开始发送ICE候选
   * @param data - 包含SDP answer的对象
   */
  const handleGroupVideoAnswer = async (data: any) => {
    console.log("收到群聊视频Answer", data);
  };

  /**
   * cmd: 10 群聊视频ICE候选信息
   * 处理群聊ICE候选信息
   * 1. 添加远程ICE候选
   * 2. 开始发送本地ICE候选
   * @param data - 包含ICE候选信息的对象
   */
  const handleGroupIceCandidate = async (data: any) => {
    console.log("收到群聊ICE候选", data);
  };

  /**
   * cmd: 12,13 系统消息处理
   * 存储系统消息到本地数据库
   * @param data - 包含系统消息内容的对象
   * @param client - WebSocket客户端实例
   */
  const handleSystemMessage = async (data: any, chatType: number) => {
    console.log("收到系统消息", data);

    // 先获取现有会话数据
    const existingConversation = await db.conversations
      .where("[userId+targetId+type]")
      .equals([userInfo.id, data.sender_id, chatType])
      .first();

    // 存储到数据库，保留原有showName和headImage
    await db.upsertConversation(userInfo.id, {
      targetId: data.sender_id,
      type: chatType,
      showName: existingConversation?.showName || data.sender_nickname, // 保留原有名称
      headImage: existingConversation?.headImage || data.sender_avatar, // 保留原有头像
      lastContent: data.content,
      unreadCount: existingConversation?.unreadCount || 0, // 增加未读计数
      messages: [
        {
          id: data.seq_id,
          targetId: data.sender_id,
          type: 5, // 消息类型为系统消息
          sendId: "system", // 发送者为系统
          content: data.content,
          sendTime: data.send_time,
          status: "success",
        },
      ],
    });

    // 更新当前消息列表
    const res: any = await db.getConversation(
      userInfo.id,
      data.sender_id,
      chatType
    );
    console.log(res.messages);
    setCurrentMessages(res?.messages);
    // 如果不是当前聊天对象，更新会话列表
    const conversationsList: any = await db.getUserConversations(userInfo.id); // 获取会话数据
    // 更新会话列表
    setCurrentChatList(conversationsList);
  };

  // 新增获取媒体流的方法
  const getMediaStream = async () => {
    // 1. 检查设备可用性
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasVideo = devices.some((device) => device.kind === "videoinput");
    const hasAudio = devices.some((device) => device.kind === "audioinput");

    if (!hasVideo || !hasAudio) {
      throw new Error("未检测到可用的摄像头或麦克风");
    }

    // 2. 获取媒体流
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

    // 3. 验证媒体流
    if (!stream.getVideoTracks().length || !stream.getAudioTracks().length) {
      throw new Error("获取的媒体流中没有视频或音频轨道");
    }

    setLocalStream(stream);

    return stream;
  };

  // 作为发送者挂断视频通话
  const handleVideoCallClose = () => {
    setIsVideoModalVisible(false);
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (callTimeoutRef.current) {
      //关闭通话定时器
      clearTimeout(callTimeoutRef.current);
    }
    usePrivatePeerStore.closePeerConnection();
    sendNonChatMessage({
      cmd: 7,
      data: {
        sender_id: userInfo.id,
        receiver_id: Number(currentFriendId),
        content: "对方已挂断",
      },
    });

    // 存储通话结束信息到聊天记录
    if (isSelfCallerRef.current) {
      const params = {
        seq_id: uuidv4(),
        sender_id: Number(currentFriendId),
        receiver_id: userInfo.id,
        content: "已挂断",
        send_time: getCurrentTimeDifference(),
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
      };
      handleSendMessage(params, 1, "video");
    } else {
      console.log(callerInfo, "---callerInfo");
      const params = {
        seq_id: uuidv4(),
        sender_id: userInfo.id,
        receiver_id: callerInfo.sender_id,
        content: "已挂断",
        send_time: getCurrentTimeDifference(),
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
      };
      handleSendMessage(params, 1, "video");
    }

    message.success("通话结束");
    isSelfCallerRef.current = false;
  };

  // 私聊作为发送者拨打电话
  const initiatePrivateVideoCall = async () => {
    try {
      if (isCalling || isVideoModalVisible) {
        // 已经处于呼叫或被呼叫状态，直接返回
        return;
      }

      // 自己为电话发起者
      isSelfCallerRef.current = true;

      // 获取媒体流
      const stream = await getMediaStream();

      // 私聊视频通话的特定逻辑
      // 设置10秒无人接听计时器
      callTimeoutRef.current = setTimeout(() => {
        if (!isVideoModalVisible) {
          // 10秒后仍未接听关闭弹窗，提示用户
          setIsVideoModalVisible(false);
          message.warning("对方无应答，通话已取消");
          // 发送结束通话消息
          sendNonChatMessage({
            cmd: 7,
            data: {
              sender_id: userInfo.id,
              receiver_id: Number(currentFriendId),
              content: "未接通",
            },
          });
          // 存储通话结束信息到聊天记录
          const params = {
            seq_id: uuidv4(),
            sender_id: Number(currentFriendId),
            receiver_id: userInfo.id,
            content: "未接通",
            send_time: getCurrentTimeDifference(),
            sender_nickname: userInfo.nickname,
            sender_avatar: userInfo.avatar,
          };
          handleSendMessage(params, 1, "video");
          // 清理资源
          if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
          }
          usePrivatePeerStore.closePeerConnection();
          isSelfCallerRef.current = false;
        }
      }, 15000); // 10秒超时

      // 4. 创建PeerConnection (简化参数传递)
      usePrivatePeerStore.createPeerConnection(stream);

      // 5. 设置远程流处理器
      usePrivatePeerStore.setupMediaStreamHandlers(setRemoteStream);

      // 6. 创建并发送Offer
      const offer = await usePrivatePeerStore.createOffer();
      // 准备发送的数据
      const offerData = {
        sender_id: userInfo.id,
        receiver_id: Number(currentFriendId),
        session_description: offer,
        sender_nickname: userInfo.nickname,
        sender_avatar: userInfo.avatar,
      };
      sendNonChatMessage({
        cmd: 4,
        data: offerData,
      });
      //发送ICE
      usePrivatePeerStore.setupIceCandidateListener(
        (candidate) => {
          // 这个回调会在设置本地描述后触发
          sendNonChatMessage({
            cmd: 6, // ICE 候选者消息
            data: {
              sender_id: userInfo.id, // 发送者 ID
              receiver_id: Number(currentFriendId), // 接收者 ID
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
      usePrivatePeerStore.closePeerConnection();
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    }
  };

  // 私聊作为接收者处理接受视频通话
  const handleAcceptCall = async () => {
    try {
      // 1. 获取本地媒体流
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      // 2. 创建PeerConnection
      usePrivatePeerStore.createPeerConnection(stream);

      // 3. 设置远程媒体流处理器
      usePrivatePeerStore.setupMediaStreamHandlers((remoteStream) => {
        setRemoteStream(remoteStream);
      });

      // 4. 设置远程描述(Offer)
      await usePrivatePeerStore.setRemoteDescription(
        callerInfo.session_description
      );

      // 5. 创建并发送Answer
      const answer = await usePrivatePeerStore.createAnswer();

      sendNonChatMessage({
        cmd: 5, // Answer命令
        data: {
          sender_id: userInfo.id,
          receiver_id: callerInfo.sender_id,
          session_description: answer,
        },
      });

      // 6. 显示视频弹框
      setIsVideoModalVisible(true);
      setIsCalling(false);

      // 7. 设置ICE候选监听器（此时不会立即发送ICE）
      usePrivatePeerStore.setupIceCandidateListener(
        (candidate) => {
          // 这个回调会在设置本地描述后触发
          sendNonChatMessage({
            cmd: 6,
            data: {
              sender_id: userInfo.id,
              receiver_id: callerInfo.sender_id,
              candidate_init: candidate,
            },
          });
        },
        () => console.log("ICE收集完成")
      );
    } catch (error) {
      console.error("接受视频通话失败:", error);
      message.error("接受视频通话失败");
      // 清理资源
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
      // 关闭视频
      usePrivatePeerStore.closePeerConnection();
    }
  };

  // 作为接收者处理拒绝视频通话
  const handleRejectCall = () => {
    setIsCalling(false);
    // 关闭视频
    usePrivatePeerStore.closePeerConnection();

    // 可以发送拒绝消息给对方
    sendNonChatMessage({
      cmd: 7, // 拒绝命令
      data: {
        sender_id: userInfo.id,
        receiver_id: callerInfo.sender_id,
        content: "对方已拒绝",
      },
    });

    // 存储通话结束信息到聊天记录
    const params = {
      seq_id: uuidv4(),
      sender_id: userInfo.id,
      receiver_id: Number(currentFriendId),
      content: "已取消",
      send_time: getCurrentTimeDifference(),
      sender_nickname: userInfo.nickname,
      sender_avatar: userInfo.avatar,
    };
    handleSendMessage(params, 1, "video");
    message.success("已取消通话");
    isSelfCallerRef.current = false;
  };

  // 添加发送消息方法
  const sendMessageWithTimeout = async (msg: any) => {
    if (!wsClient) return;

    const messageId = msg.data.seq_id;
    const maxRetries = 5;
    const retryInterval = 2000;

    // 清除已有定时器
    if (retryTimersRef.current[messageId]) {
      clearTimeout(retryTimersRef.current[messageId].timer);
      delete retryTimersRef.current[messageId];
    }

    // 初始发送
    wsClient.sendMessage(msg);

    // 设置重试逻辑
    retryTimersRef.current[messageId] = {
      timer: setInterval(() => {
        const current = retryTimersRef.current[messageId];

        if (!current) return; // 防止空指针错误

        if (current.count < maxRetries) {
          current.count++;
          wsClient.sendMessage(msg);
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
                    ...msg.data,
                    receiver_id: msg.data.sender_id,
                    sender_id: msg.data.receiver_id,
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
                ...msg.data,
                receiver_id: msg.data.sender_id,
                sender_id: msg.data.receiver_id,
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

  // 发送非聊天信息
  const sendNonChatMessage = (message: any) => {
    if (wsClient) {
      wsClient.sendMessage(message);
    } else {
      console.error("WebSocket未连接");
    }
  };

  // 更新聊天信息状态
  const handleUpdateMessageStatus = async (data: any, status: string) => {
    const currentType = chatStore.currentChatInfo.type;

    await db.conversations
      .where("[userId+targetId+type]")
      .equals([data.receiver_id, data.sender_id, currentType])
      .modify((conversation: any) => {
        const messageIndex = conversation.messages?.findIndex(
          (msg: any) => msg.id === data.seq_id
        );
        if (messageIndex !== undefined && messageIndex !== -1) {
          conversation.messages[messageIndex].status = status;
        }
      });

    // 更新聊天记录;
    const res: any = await db.getConversation(
      data.receiver_id,
      data.sender_id,
      currentType
    ); // 获取会话数据
    // 设置当前消息;
    setCurrentMessages(res?.messages);
  };

  // 作为接收者处理新消息,添加本地存储
  const handleNewStorage = async (
    item: any,
    chatType: number,
    messageType: number | string
  ) => {
    console.log(item, "item存储消息");
    const userId = userInfo.id;
    const targetId = chatType == 1 ? item.sender_id : item.receiver_id;
    const showName = chatType == 1 ? item.sender_nickname : item.group_name;
    const headImage = chatType == 1 ? item.sender_avatar : item.group_avatar;

    // 检查是否是当前聊天对象
    const isCurrentFriend = targetId === currentFriendIdRef.current;

    // 先获取当前会话的未读数量
    const existingConversation = await db.conversations
      .where("[userId+targetId+type]")
      .equals([userId, targetId, chatType])
      .first();

    // 计算新的未读数量
    const newUnreadCount = isCurrentFriend
      ? 0
      : (existingConversation?.unreadCount || 0) + 1;

    console.log(existingConversation, targetId, "existingConversation");
    // 先添加到本地存储（乐观更新）
    await db.upsertConversation(userId, {
      targetId: targetId,
      type: chatType,
      showName: showName || existingConversation?.showName,
      headImage: headImage || existingConversation?.headImage,
      lastContent: item.content,
      unreadCount: newUnreadCount, // 使用计算后的未读数量
      messages: [
        {
          id: item.seq_id || uuidv4(), // 如果没有seq_id，则生成一个新的
          targetId: item.receiver_id,
          type: messageType,
          sendId: item.sender_id,
          content: item.content,
          sendTime: item.send_time || getCurrentTimeDifference(),
          sender_nickname:
            item.sender_nickname || existingConversation?.showName,
          sender_avatar: item.sender_avatar || existingConversation?.headImage,
          status: "success",
        },
      ],
    });

    // 更新聊天记录
    handleNewConversation(targetId); // 处理新消息
  };

  // 作为发送者发送消息，添加到本地存储
  const handleSendMessage = async (
    item: any,
    chatType: number,
    messageType: number | string
  ) => {
    console.log(item, "item发送消息");
    const userId = userInfo.id;
    console.log(isSelfCallerRef.current, item.sender_id, item.receiver_id);
    const targetId = isSelfCallerRef.current
      ? item.sender_id
      : item.receiver_id;

    // 检查是否是当前聊天对象
    const isCurrentFriend = targetId === currentFriendIdRef.current;

    console.log("isCurrentFriend", userId, targetId);
    // 先获取当前会话的未读数量
    const existingConversation = await db.conversations
      .where("[userId+targetId+type]")
      .equals([userId, targetId, chatType])
      .first();

    // 计算新的未读数量
    const newUnreadCount = isCurrentFriend
      ? 0
      : (existingConversation?.unreadCount || 0) + 1;

    // 先添加到本地存储（乐观更新）
    await db.upsertConversation(userId, {
      targetId: targetId,
      type: chatType,
      showName: currentFriendName,
      headImage: currentFriendAvatar,
      lastContent: item.content,
      unreadCount: newUnreadCount, // 使用计算后的未读数量
      messages: [
        {
          id: item.seq_id,
          targetId: targetId,
          type: messageType,
          sendId: userId,
          content: item.content,
          sendTime: item.send_time,
          sender_nickname: item.sender_nickname,
          sender_avatar: item.sender_avatar,
          status: "success",
        },
      ],
    });

    // 更新聊天记录
    handleNewConversation(targetId); // 处理新消息
  };

  // 监听当前聊天信息的变化
  const handleNewConversation = async (friendId: number | string) => {
    console.log("监听当前聊天信息的变化", friendId);
    const currentId = chatStore.currentFriendId;
    const chatType = chatStore.currentChatInfo.type;

    if (currentId && friendId === currentId) {
      // 如果当前聊天对象是新对象，则更新会话数据
      const res: any = await db.getConversation(
        userInfo.id,
        Number(currentId),
        chatType
      ); // 获取会话数据
      // 设置当前消息
      setCurrentMessages(res?.messages);
    } else {
      // 如果不是当前聊天对象，更新会话列表
      const conversationsList: any = await db.getUserConversations(userInfo.id); // 获取会话数据
      // 更新会话列表
      setCurrentChatList(conversationsList);
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
        sendNonChatMessage,
        disconnect: () => wsClient?.disconnect(),
      }}
    >
      <div className="main-layout">
        {/* 侧边菜单*/}
        <SideNavigation />

        <div className="main-layout-content">
          <div className="main-layout-content-left">
            {currentRoute === "chat" ? (
              <MessageList />
            ) : currentRoute === "friend" ? (
              <FirendList />
            ) : currentRoute === "group" ? (
              <GroupList></GroupList>
            ) : null}
          </div>
          <div className="main-layout-content-right">
            {currentFriendId && (
              <Chat
                initiatePrivateVideoCall={initiatePrivateVideoCall}
                setSelectedMembers={setSelectedMembers}
                selectedMembers={selectedMembers}
              />
            )}
          </div>
        </div>

        {/* 私聊视频通话框 */}
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
            onClose={() => handleVideoCallClose()}
            callerAvatar={String(currentFriendAvatar)}
            callerName={String(currentFriendName)}
          />
        </Modal>

        {/* 群聊视频通话框 */}
        {/* 待开发 */}

        {/* 右下角弹窗 */}
        <ChatVideoAcceptor
          callerInfo={{
            name: callerInfo.sender_nickname,
            avatar: callerInfo.sender_avatar,
          }}
          onAccept={() => handleAcceptCall()}
          onReject={handleRejectCall}
          visible={isCalling}
          timeout={30000}
        />

        {/* 查看用户信息 */}
        <Modal
          open={isShowUserAmend}
          onCancel={() => setIsShowUserAmend(!isShowUserAmend)}
          closable={false}
          footer={null}
          title="用户信息"
        >
          <EditUser />
        </Modal>
      </div>
    </WebSocketContext.Provider>
  );
});

export default Home;
