import { makeObservable, observable, action } from "mobx";

/**
 * WebRTC连接管理类
 * 遵循标准WebRTC连接流程：
 * 1. 创建PeerConnection
 * 2. 添加本地媒体流
 * 3. 呼叫方创建Offer并设置本地描述
 * 4. 被叫方收到Offer后设置远程描述
 * 5. 被叫方创建Answer并设置本地描述
 * 6. 呼叫方收到Answer后设置远程描述
 * 7. 双方交换ICE候选
 * 8. 连接建立
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
      closePeerConnection: action,
      createOffer: action,
      createAnswer: action,
      setLocalDescription: action,
      setRemoteDescription: action,
      addIceCandidate: action,
      setupMediaStreamHandlers: action,
      setupDataChannel: action,
      // 新增方法加入可观察动作
      setupIceCandidateListener: action
    });
  }

  /* ========== 基础连接管理 ========== */

  /**
   * 创建新的RTCPeerConnection实例
   * @param localStream 本地媒体流
   */
  createPeerConnection(localStream: MediaStream) {
    // 使用Google的公共STUN服务器和备用TURN服务器
    console.log("创建PeerConnection");
    const config = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };

    // 创建新的RTCPeerConnection实例
    this.peerConnection = new RTCPeerConnection(config);

    // 添加本地媒体流
    this._addLocalStream(localStream);

    // 设置基础事件处理器（不包含ICE候选处理器）
    this._setupBasicEventHandlers();
    console.log("PeerConnection创建完成");
  }

  /**
   * 关闭并清理WebRTC连接
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

    this._resetConnectionState();
  }

  /* ========== 信令处理 ========== */

  /**
   * 创建Offer并设置本地描述
   * @returns 创建的Offer
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection未初始化");
    }

    const offer = await this.peerConnection.createOffer();
    await this.setLocalDescription(offer);
    return offer;
  }

  /**
   * 创建Answer并设置本地描述
   * @returns 创建的Answer
   */
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection未初始化");
    }

    const answer = await this.peerConnection.createAnswer();
    await this.setLocalDescription(answer);
    return answer;
  }

  /**
   * 设置本地描述
   * @param desc 要设置的描述(Offer/Answer)
   */
  async setLocalDescription(desc: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;

    await this.peerConnection.setLocalDescription(desc);
    console.log("本地描述设置完成:", desc.type);

    // // 设置本地描述后激活ICE候选收集
    // this._activateIceCandidateHandler();
  }

  /**
   * 设置远程描述
   * @param desc 要设置的远程描述(Offer/Answer)
   */
  async setRemoteDescription(desc: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(desc)
    );
    this.remoteDescriptionSet = true;
    console.log("远程描述设置完成:", desc.type);
  }

  /**
   * 添加ICE候选
   * @param candidate ICE候选
   */
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection || !this.remoteDescriptionSet) return;

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    console.log("ICE候选添加完成:", candidate);
  }

  /* ========== 媒体和数据通道 ========== */

  /**
   * 设置远程媒体流处理器
   * @param callback 远程流回调函数
   */
  setupMediaStreamHandlers(callback: (stream: MediaStream) => void) {
    if (!this.peerConnection) return;

    const remoteStream = new MediaStream();

    this.peerConnection.ontrack = (event) => {
      if (event.track.kind === "video" || event.track.kind === "audio") {
        remoteStream.addTrack(event.track);
        if (event.track.kind === "video") {
          callback(remoteStream);
        }
      }
    };
  }

  /**
   * 创建数据通道
   * @param label 通道标签
   * @param handlers 通道事件处理器
   */
  setupDataChannel(
    label: string,
    handlers: {
      onOpen: () => void;
      onMessage: (event: MessageEvent) => void;
      onClose: () => void;
    }
  ) {
    if (!this.peerConnection) return;

    this.dataChannel = this.peerConnection.createDataChannel(label);
    this._setupChannelHandlers(handlers);
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

  // 设置基础事件处理器
  private _setupBasicEventHandlers() {
    if (!this.peerConnection) return;

    // ICE连接状态变化
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log("ICE连接状态:", state);

      // 更新连接状态
      this.isWebRTCConnected = state === "connected" || state === "completed";
    };

    // 连接状态变化
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log("连接状态:", state);

      if (state === "disconnected") {
        this.closePeerConnection();
      }
    };
  }

  // // 激活ICE候选处理器
  // private _activateIceCandidateHandler() {
  //   if (!this.peerConnection) return;

  //   // 临时存储ICE候选的队列
  //   const iceCandidateQueue: RTCIceCandidate[] = [];
  //   let isProcessing = false;

  //   this.peerConnection.onicecandidate = (event) => {
  //     if (event.candidate) {
  //       console.log("收集到ICE候选:", event.candidate);
  //       iceCandidateQueue.push(event.candidate);

  //       // 处理队列中的候选
  //       if (!isProcessing) {
  //         isProcessing = true; // 标记为正在处理
  //         this._processIceCandidateQueue(iceCandidateQueue, () => {
  //           isProcessing = false; // 处理完成后重置状态
  //         });
  //       }
  //     } else {
  //       console.log("ICE候选收集完成");
  //     }
  //   };
  // }

  // // 处理ICE候选队列
  // private _processIceCandidateQueue(
  //   queue: RTCIceCandidate[],
  //   onComplete: () => void
  // ) {
  //   // 实际项目中这里应该实现发送ICE候选的逻辑
  //   console.log("处理ICE候选队列:", queue.length);
  //   setTimeout(() => {
  //     console.log("处理ICE候选队列:", queue.length);
  //     queue.length = 0; // 清空队列
  //     onComplete(); // 通知处理完成
  //   }, 0);
  // }

  // 设置数据通道处理器
  private _setupChannelHandlers(handlers: {
    onOpen: () => void;
    onMessage: (event: MessageEvent) => void;
    onClose: () => void;
  }) {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = handlers.onOpen;
    this.dataChannel.onmessage = handlers.onMessage;
    this.dataChannel.onclose = handlers.onClose;
  }

  // 重置连接状态
  private _resetConnectionState() {
    this.remoteDescriptionSet = false;
    this.isWebRTCConnected = false;
    this.isAudioStreamAdded = false;
    this.isVideoStreamAdded = false;
  }

  /**
   * 设置ICE候选处理器
   * @param onCandidate 候选处理器回调
   */
  setupIceCandidateHandler(onCandidate: (candidate: RTCIceCandidate) => void) {
    console.log('开始监听ICE候选');
    
    if (!this.peerConnection) return;
  
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("收集到ICE候选:", event.candidate);
        onCandidate(event.candidate);
      } else {
        console.log("ICE候选收集完成");
      }
    };
    console.log('ICE候选处理器设置完成');
    
  }

  /**
   * 监听ICE候选者
   * @param onCandidate 当收集到ICE候选者时调用的回调函数
   * @param onComplete 当ICE候选者收集完成时调用的回调函数
   */
  setupIceCandidateListener(
    onCandidate: (candidate: RTCIceCandidate) => void,
    onComplete: () => void
  ) {
    if (!this.peerConnection) {
      console.error('PeerConnection 未初始化，无法监听 ICE 候选者');
      return;
    }

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('收集到 ICE 候选者:', event.candidate);
        onCandidate(event.candidate);
      } else {
        console.log('ICE 候选者收集完成');
        onComplete();
      }
    };
  }
}

export const usePeerConnectionStore = new PeerConnectionStore();
