import { makeObservable, observable, action } from "mobx";

/**
 * WebRTC 连接管理类
 * 负责处理所有与 WebRTC 相关的操作，包括：
 * - 创建和管理 RTCPeerConnection
 * - 处理 ICE 候选交换
 * - 管理媒体流和数据通道
 * - 跟踪连接状态
 */
class PeerConnectionStore {
  // 核心连接实例
  peerConnection: RTCPeerConnection | null = null;

  // 连接状态跟踪
  remoteDescriptionSet: boolean = false;
  isWebRTCConnected: boolean = false;

  // 媒体流状态
  isAudioStreamAdded: boolean = false;
  isVideoStreamAdded: boolean = false;

  // 数据通道
  dataChannel: RTCDataChannel | null = null;

  constructor() {
    makeObservable(this, {
      // 可观察状态
      peerConnection: observable,
      remoteDescriptionSet: observable,
      isWebRTCConnected: observable,
      isAudioStreamAdded: observable,
      isVideoStreamAdded: observable,

      // 操作方法
      createPeerConnection: action,
      setRemoteDescription: action,
      closePeerConnection: action,
      sendVideoOffer: action,
      addIceCandidate: action,
      createDataChannel: action,
      setupDataChannelHandlers: action,
      // setupMediaStreamHandlers: action,
      sendData: action,
    });
  }

  /* ========== 连接管理 ========== */

  /**
   * 创建新的 RTCPeerConnection 实例
   * @param sendNonChatMessage 消息发送函数
   * @param localStream 本地媒体流
   * @param senderId 发送方ID
   * @param receiverId 接收方ID
   */
  createPeerConnection(
    sendNonChatMessage: (data: any) => void,
    localStream: MediaStream,
    senderId: number,
    receiverId: number,
    chatType: number
  ) {
    // 初始化配置
    const config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // 可以添加 TURN 服务器配置
      ],
    };

    this.peerConnection = new RTCPeerConnection(config);

    // 添加本地媒体流
    this._addLocalStream(localStream);

    console.log("chatType:", chatType);

    // 设置事件处理器
    this._setupConnectionEventHandlers(
      sendNonChatMessage,
      senderId,
      receiverId,
      chatType
    );
  }

  /**
   * 关闭并清理 WebRTC 连接
   */
  closePeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // 重置所有状态
    this._resetConnectionState();
  }

  /* ========== 信令处理 ========== */

  /**
   * 发送视频通话邀请(Offer)
   */
  async sendVideoOffer(
    sendNonChatMessage: (data: any) => void,
    senderId: number,
    receiverId: number,
    chatType: number
  ) {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      console.log("发送 Offer:", offer);

      // 4: 私聊视频呼叫，7: 群聊视频呼叫
      const cmd = chatType === 1 ? 4 : 7;

      // 发送 Offer 消息
      sendNonChatMessage({
        cmd, // 自定义协议命令
        data: {
          sender_id: senderId,
          receiver_id: receiverId,
          session_description: offer,
          chatType: chatType,
        },
      });
    } catch (error) {
      console.error("创建 Offer 失败:", error);
    }
  }

  /**
   * 设置远程描述(SDP)
   */
  async setRemoteDescription(remoteDesc: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(remoteDesc)
      );
      this.remoteDescriptionSet = true;
    } catch (error) {
      console.error("设置远程描述失败:", error);
    }
  }

  /**
   * 添加 ICE 候选
   */
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection || !this.remoteDescriptionSet) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("成功添加ICE候选:", candidate);
    } catch (error) {
      console.error("添加 ICE 候选失败:", error);
    }
  }

  /**
   * 创建并设置本地Answer
   * @returns Promise<RTCSessionDescription> 返回创建的answer
   */
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection未初始化");
    }

    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error("创建Answer失败:", error);
      throw error;
    }
  }

  /* ========== 数据通道 ========== */

  createDataChannel(label: string) {
    if (this.peerConnection) {
      this.dataChannel = this.peerConnection.createDataChannel(label);
    }
  }

  setupDataChannelHandlers(
    onOpen: () => void,
    onMessage: (event: MessageEvent) => void,
    onClose: () => void
  ) {
    if (!this.peerConnection) return;

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this._setupChannelHandlers(onOpen, onMessage, onClose);
    };

    if (this.dataChannel) {
      this._setupChannelHandlers(onOpen, onMessage, onClose);
    }
  }

  sendData(data: string | Blob | ArrayBuffer) {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(data);
    }
  }

  /**
   * 设置远程媒体流处理器
   * @param callback 远程流回调函数
   */
  setupMediaStreamHandlers(callback: (stream: MediaStream) => void) {
    if (this.peerConnection) {
      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          callback(event.streams[0]);
        }
      };
    }
  }

  /* ========== 私有方法 ========== */

  // 添加本地媒体流
  private _addLocalStream(localStream: MediaStream) {
    localStream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, localStream);

      // 更新状态
      if (track.kind === "audio") this.isAudioStreamAdded = true;
      if (track.kind === "video") this.isVideoStreamAdded = true;
    });
  }

  // 设置连接事件处理器
  private _setupConnectionEventHandlers(
    sendNonChatMessage: (data: any) => void,
    senderId: number,
    receiverId: number,
    chatType: number
  ) {
    if (!this.peerConnection) return;

    // ICE 候选处理
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("发送 ICE 候选:", event.candidate);
        // const cmd = chatType === 1 ? 6 : 9;
        console.log("senderId:", chatType);
        sendNonChatMessage({
          cmd: 6, // 自定义协议命令
          data: {
            sender_id: senderId,
            receiver_id: receiverId,
            candidate_init: event.candidate.toJSON(),
          },
        });
      }
    };

    // 连接状态变化
    this.peerConnection.onconnectionstatechange = () => {
      this.isWebRTCConnected =
        this.peerConnection?.connectionState === "connected";
    };

    // ICE 连接状态
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      this.isWebRTCConnected = state === "connected" || state === "completed";
    };
  }

  // 设置数据通道处理器
  private _setupChannelHandlers(
    onOpen: () => void,
    onMessage: (event: MessageEvent) => void,
    onClose: () => void
  ) {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = onOpen;
    this.dataChannel.onmessage = onMessage;
    this.dataChannel.onclose = onClose;
  }

  // 重置连接状态
  private _resetConnectionState() {
    this.remoteDescriptionSet = false;
    this.isWebRTCConnected = false;
    this.isAudioStreamAdded = false;
    this.isVideoStreamAdded = false;
  }
}

export const usePeerConnectionStore = new PeerConnectionStore();
