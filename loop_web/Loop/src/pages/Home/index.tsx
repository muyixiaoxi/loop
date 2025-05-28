import "./index.scss";
import { createContext, useState, useEffect, useRef } from "react";
import { Modal, message, Button } from "antd";
import { observer } from "mobx-react-lite";
import globalStore from "@/store/global";
import SideNavigation from "@/components/SideNavigation";
import FirendList from "@/components/FriendList"; // 推测此处可能是拼写错误，应为 FriendList
import EditUser from "@/components/EditUser"; // 导入 EditUser 组件
import Chat from "@/components/Chat"; // 导入 Chat 组件
import MessageList from "@/components/MessageList/index";
import WebSocketClient from "@/utils/websocket";
import userStore from "@/store/user";
import chatStore from "@/store/chat";
import { getChatDB } from "@/utils/chat-db";
import { getGroupMemberList } from "@/api/group";
import {
  getLocalTime,
  getOfflineMessage,
  submitOfflineMessage,
} from "@/api/chat";
import ChatPrivateVideo from "@/components/ChatPrivateVideo";
import ChatVideoAcceptor from "@/components/ChatVideoAcceptor";
import { usePeerConnectionStore } from "@/store/PeerConnectionStore"; // 确保导入
import { useGroupPeerConnectionStore } from "@/store/GroupPeer";

// 创建WebSocket上下文
export const WebSocketContext = createContext<{
  sendMessageWithTimeout?: (message: any) => void;
  sendNonChatMessage?: (message: any) => void;
  disconnect?: () => void;
}>({
  sendMessageWithTimeout: () => { },
  sendNonChatMessage: () => { },
  disconnect: () => { },
});

// observer 将组件变成响应式组件
const Home = observer(() => {
  const { token, userInfo } = userStore; // 获取用户信息
  const {
    currentFriendId,
    setCurrentChatList,
    setCurrentMessages,
    currentChatInfo,
  } = chatStore; // 获取发送消息的函数
  const db = getChatDB(userInfo.id); // 连接数据库
  const {
    isShowUserAmend,
    setIsShowUserAmend,
    currentRoute,
    setTimeDifference,
  } = globalStore;
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
  // 视频通话相关状态
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [callerInfo, setCallerInfo] = useState<any>({});
  // 添加状态来控制模态框的显示与隐藏
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);
  // 添加状态来存储群成员列表
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  // 添加状态来存储选中成员的信息数组，包含 user_id 和 avatar
  const [selectedMemberInfo, setSelectedMemberInfo] = useState<{ user_id: number; avatar: string }[]>([]);
  // 添加一个 ref 来跟踪 selectedMemberInfo 的最新值
  const selectedMemberInfoRef = useRef<{ user_id: number; avatar: string }[]>([]);
  // 用于存储选择成员的 Promise 解析函数
  const resolveSelectMembersRef = useRef<((value: void | PromiseLike<void>) => void) | null>(null);

  // 标记是否是点击确定触发的更新
  const isOkButtonClickedRef = useRef(false);

  // 视频呼叫相关状态
  const [isCalling, setIsCalling] = useState(false); // 是否正在呼叫


  // 获取与服务器时间差
  const LocalTime = async () => {
    const startTime = new Date().getTime();
    const { data }: any = await getLocalTime(); // 获取当前时间
    const serverTime = data.time; // 服务器返回的时间
    const endTime = new Date().getTime();

    const timeDifference = (startTime + endTime) / 2; // 计算时间差
    const timeDiff = serverTime - timeDifference; // 客户端与服务器时间差
    setTimeDifference(timeDiff); // 存储时间差到全局状态
  };

  //  存储离线信息到本地
  const ChangeOffline = async () => {
    const { data }: any = await getOfflineMessage();
    const userId = userInfo.id;
    const processedData: any = []; // 用于存储处理后的数据;

    for (const item of data) {
      if (item?.cmd === 1) {
        await handleNewStorage(item.data, 1);
        processedData.push({
          seq_id: item.data.seq_id,
          sender_id: userId,
          receiver_id: item.data.sender_id,
        });
      } else if (item?.cmd === 2) {
        await handleNewStorage(item.data, 2);
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
      }
    }

    await submitOfflineMessage(processedData);
  };

  useEffect(() => {
    // 视频链接状态变化
    if (usePeerConnectionStore.isVideoChatStarted) {
      console.log("检测到视频已经挂断");
      // 视频已经挂断
      setIsVideoModalVisible(false);
      // 可以发送拒绝消息给对方
      sendNonChatMessage({
        cmd: 7, // 拒绝命令
        data: {
          sender_id: userInfo.id,
          receiver_id: callerInfo.sender_id,
          content: "对方已挂断，通话结束",
        },
      });

      // 关闭连接
      usePeerConnectionStore.closePeerConnection();
    }
  }, [usePeerConnectionStore.isVideoChatStarted]);

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
    selectedMemberInfoRef.current = selectedMemberInfo;
  }, [selectedMemberInfo]);

  useEffect(() => {
    if (!token) return;
    const userId = userInfo.id;

    const client = new WebSocketClient<string>({
      url: `ws://yangchengxi.a1.luyouxia.net:23914/api/v1/im?token=${token}`,
      onMessage: async (wsMessage: any) => {
        const { cmd, data } = wsMessage;
        if (cmd === 1) {
          // 私聊消息
          handleNewStorage(data, 1);

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
        } else if (cmd === 2) {
          // 群聊消息
          handleNewStorage(data, 2); // 传递标志表示是群聊消息

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
        } else if (cmd === 4) {
          // 单聊发送的offer
          if (isCalling || isVideoModalVisible) {
            // 已经处于呼叫或被呼叫状态，直接拒绝
            const data: any = {
              cmd: 7, // 拒绝命令
              data: {
                content: "对方通话中，请稍后再拨",
                sender_id: userInfo.id,
                receiver_id: callerInfo.sender_id,
              },
            };
            client.sendMessage(data);
          } else {
            // 设置呼叫者数据，用于接听
            setCallerInfo(data);
            // 打开弹窗，等待接听
            setIsCalling(true);
          }
        } else if (cmd === 5) {
          // 设置远程描述
          await usePeerConnectionStore.setRemoteDescription(
            data.session_description
          );
          await usePeerConnectionStore.flushIceCandidates(); // 开始发送 ICE 候选
        } else if (cmd === 6) {
          // ICE候选消息
          await usePeerConnectionStore.addIceCandidate(data.candidate_init);

          // 收到ICE后开始发送自己的ICE候选;
          await usePeerConnectionStore.flushIceCandidates(); // 开始发送 ICE 候选
        } else if (cmd === 7) {
          console.log(data, "挂断");
          // 接收到挂断消息
          // 先关闭连接
          usePeerConnectionStore.closePeerConnection();

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
        } else if(cmd===9){          
          // 设置远程描述
          await useGroupPeerConnectionStore.setRemoteDescription(
            data.session_description
          );
          await useGroupPeerConnectionStore.flushIceCandidates(); // 开始发送 ICE 候选
          
        }else if(cmd===10){
          // ICE候选消息
          await useGroupPeerConnectionStore.addIceCandidate(data.candidate);
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
  // 修改 handleMemberSelect
  const handleMemberSelect = (userId: number, avatar: string, checked: boolean) => {
    if (checked) {
      setSelectedMemberInfo([...selectedMemberInfo, { user_id: userId, avatar }]);
    } else {
      setSelectedMemberInfo(selectedMemberInfo.filter(info => info.user_id !== userId));
    }
  };
  // 修改 handleMemberModalOk
  const handleMemberModalOk = async () => {
    console.log('选择的群成员信息数组:', selectedMemberInfo);
    isOkButtonClickedRef.current = true;
    setIsMemberModalVisible(false);

    // 确保状态更新完成
    await new Promise(resolve => setTimeout(resolve, 0));

    if (resolveSelectMembersRef.current) {
      resolveSelectMembersRef.current();
      resolveSelectMembersRef.current = null;
    }
  };


  useEffect(() => {
    if (resolveSelectMembersRef.current) {
      resolveSelectMembersRef.current();
      resolveSelectMembersRef.current = null;
    }

  }, [isOkButtonClickedRef.current]);
  // 处理取消按钮点击事件
  const handleMemberModalCancel = () => {
    setIsMemberModalVisible(false);
    if (resolveSelectMembersRef.current) {
      resolveSelectMembersRef.current();
      resolveSelectMembersRef.current = null;
    }
  };
  //作为发送者开启视频通话
  const initiateVideoCall = async () => {
    try {
      if (isCalling || isVideoModalVisible) {
        // 已经处于呼叫或被呼叫状态，直接返回
        return;
      }
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
       
      if(currentChatInfo.type === 2){
        // 4. 创建PeerConnection (简化参数传递)
        useGroupPeerConnectionStore.createPeerConnection(stream);

        // 5. 设置远程流处理器
        useGroupPeerConnectionStore.setupMediaStreamHandlers(setRemoteStream);

        // 6. 创建并发送Offer
        const offer = await useGroupPeerConnectionStore.createOffer();
          // 调用监听 ICE 候选的方法
          await useGroupPeerConnectionStore.setupIceCandidateListenerWithLogging();
        const receiverIdList = await getGroupMemberList(Number(currentFriendId));
        setGroupMembers(receiverIdList.data);
        setIsMemberModalVisible(true);

        // 等待用户选择完成
        await new Promise<void>((resolve) => {
          resolveSelectMembersRef.current = resolve;
        });

        // 使用 ref 中的最新值
        const offerData = {
          sender_id: userInfo.id,
          receiver_id: Number(currentFriendId),
          session_description: offer,
          sender_nickname: userInfo.nickname,
          sender_avatar: userInfo.avatar,
          receiver_list: selectedMemberInfoRef.current, // 使用 ref 中的最新值
        };

        sendNonChatMessage({
          cmd: 8,
          data: offerData
        });
         //发送ICE
         useGroupPeerConnectionStore.setupIceCandidateListener(
          (candidate) => {
            // 这个回调会在设置本地描述后触发
            sendNonChatMessage({
              cmd: 10, // ICE 候选者消息
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
      }else{
         // 4. 创建PeerConnection (简化参数传递)
      usePeerConnectionStore.createPeerConnection(stream);

      // 5. 设置远程流处理器
      usePeerConnectionStore.setupMediaStreamHandlers(setRemoteStream);

      // 6. 创建并发送Offer
      const offer = await usePeerConnectionStore.createOffer();
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
        data: offerData
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
                candidate_init: candidate, // 候选者信息
              },
            });
          },
          () => {
            console.log("ICE 候选者收集完成");
          }
        );
      }

    

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

  // 作为接收者处理接受视频通话
  const handleAcceptCall = async () => {
    try {
      // 1. 获取本地媒体流
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      // 2. 创建PeerConnection
      usePeerConnectionStore.createPeerConnection(stream);

      // 3. 设置远程媒体流处理器
      usePeerConnectionStore.setupMediaStreamHandlers((remoteStream) => {
        setRemoteStream(remoteStream);
      });

      // 4. 设置远程描述(Offer)
      await usePeerConnectionStore.setRemoteDescription(
        callerInfo.session_description
      );

      // 5. 创建并发送Answer
      const answer = await usePeerConnectionStore.createAnswer();

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
      usePeerConnectionStore.setupIceCandidateListener(
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
      usePeerConnectionStore.closePeerConnection();
    }
  };

  // 作为接收者处理拒绝视频通话
  const handleRejectCall = () => {
    setIsCalling(false);
    // 关闭视频
    usePeerConnectionStore.closePeerConnection();

    // 可以发送拒绝消息给对方
    sendNonChatMessage({
      cmd: 7, // 拒绝命令
      data: {
        sender_id: userInfo.id,
        receiver_id: callerInfo.sender_id,
        content: "对方已拒绝",
      },
    });
    message.success("已取消通话");
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

  // 处理新消息,添加本地存储
  const handleNewStorage = async (item: any, chatType: number) => {
    const userId = userInfo.id;
    const targetId = chatType == 1 ? item.sender_id : item.receiver_id;
    const showName = chatType == 1 ? item.sender_nickname : item.group_name;
    const headImage = chatType == 1 ? item.sender_avatar : item.group_avatar;

    // 检查是否是当前聊天对象
    const isCurrentFriend = targetId === currentFriendIdRef.current;

    // 先获取当前会话的未读数量
    const existingConversation = await db.conversations
      .where("[userId+targetId]")
      .equals([userId, targetId])
      .first();

    // 计算新的未读数量
    const newUnreadCount = isCurrentFriend
      ? 0
      : (existingConversation?.unreadCount || 0) + 1;

    // 先添加到本地存储（乐观更新）
    await db.upsertConversation(userId, {
      targetId: targetId,
      type: chatType,
      showName: showName,
      headImage: headImage,
      lastContent: item.content,
      unreadCount: newUnreadCount, // 使用计算后的未读数量
      messages: [
        {
          id: item.seq_id,
          targetId: item.receiver_id,
          type: 0,
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
            {currentFriendId && (
              <Chat onInitiateVideoCall={initiateVideoCall} />
            )}
          </div>
        </div>

        {/* 视频通话元素 */}
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
              usePeerConnectionStore.closePeerConnection();
              // 发送结束通话消息
              sendNonChatMessage({
                cmd: 7,
                data: {
                  sender_id: userInfo.id,
                  receiver_id: callerInfo.sender_id,
                  content: "对方已挂断，通话结束",
                },
              });
              message.success("通话结束");
            }}
          />
        </Modal>
        {/* 群成员模态框 */}
        <Modal
          title="群成员列表"
          visible={isMemberModalVisible}
          onCancel={handleMemberModalCancel}
          footer={[
            <Button key="ok" onClick={handleMemberModalOk} type="primary">
              确定
            </Button>,
            <Button key="cancel" onClick={handleMemberModalCancel} type="primary">
              取消
            </Button>,
          ]}
        >
          <div>
            {groupMembers.map((member) => (
              <div key={member.user_id} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={selectedMemberInfo.some(info => info.user_id === member.user_id)}
                  onChange={(e) => handleMemberSelect(member.user_id, member.avatar, e.target.checked)}
                />
                <img src={member.avatar} alt={member.nickname} style={{ width: 40, height: 40, borderRadius: '50%', marginLeft: 10, marginRight: 10 }} />
                <span>{member.nickname}</span>
              </div>
            ))}
          </div>
        </Modal>

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
        {isShowUserAmend ? (
          <Modal
            open={isShowUserAmend}
            onCancel={() => setIsShowUserAmend(!isShowUserAmend)}
            closable={false}
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