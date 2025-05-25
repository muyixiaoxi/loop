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

  // 视频聊天状态跟踪
  isVideoChatStarted: boolean = false;

  /**
   * 监听ICE候选者
   * @param onCandidate 当收集到ICE候选者时调用的回调函数
   * @param onComplete 当ICE候选者收集完成时调用的回调函数
   */
  // 添加ICE候选队列
  private iceCandidateQueue: RTCIceCandidate[] = [];
  private iceCandidateHandler: ((candidate: RTCIceCandidate) => void) | null =
    null;

  constructor() {
    makeObservable(this, {
      // 可观察状态
      peerConnection: observable,
      remoteDescriptionSet: observable,
      isWebRTCConnected: observable,
      isAudioStreamAdded: observable,
      isVideoStreamAdded: observable,
      isVideoChatStarted: observable,

      // 操作方法
      createPeerConnection: action,
      closePeerConnection: action,
      createOffer: action,
      createAnswer: action,
      setLocalDescription: action,
      setRemoteDescription: action,
      addIceCandidate: action,
      setupMediaStreamHandlers: action,
      setupIceCandidateListener: action,
    });
  }

  /* ========== 基础连接管理 ========== */

  /**
   * 创建新的RTCPeerConnection实例
   * @param localStream 本地媒体流
   */
  createPeerConnection(localStream: MediaStream) {
    // 使用Google的公共STUN服务器和备用TURN服务器

    const config = {
      iceServers: [
        { urls: import.meta.env.VITE_STUN_SERVER_1 },
        { urls: import.meta.env.VITE_STUN_SERVER_2 },
        {
          urls: import.meta.env.VITE_TURN_SERVER,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL,
        },
      ],
    };

    // 创建新的RTCPeerConnection实例
    this.peerConnection = new RTCPeerConnection(config);

    // 添加本地媒体流
    this._addLocalStream(localStream);

    // 设置基础事件处理器（不包含ICE候选处理器）
    this._setupBasicEventHandlers();
  }

  /**
   * 关闭并清理WebRTC连接
   */
  closePeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this._resetConnectionState();
  }

  // region 信令处理
  // ================================= 信令交换 =================================

  /**
   * 创建并返回 Offer 信令
   * @returns 包含 SDP 信息的 Offer 对象
   * @throws 当连接未初始化时抛出错误
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
   * 创建并返回 Answer 信令
   * @returns 包含 SDP 信息的 Answer 对象
   * @throws 当连接未初始化时抛出错误
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
  }

  // region ICE 管理
  // ================================ ICE 候选管理 ================================
  /**
   * 初始化 ICE 候选监听
   * @param onCandidate - 候选收集回调
   * @param onComplete - 收集完成回调
   */
  setupIceCandidateListener(
    onCandidate: (candidate: RTCIceCandidate) => void,
    onComplete: () => void
  ) {
    if (!this.peerConnection) return;

    this.iceCandidateHandler = onCandidate;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // 先存入队列，不立即发送
        this.iceCandidateQueue.push(event.candidate);
      } else {
        // ICE 候选者收集完成
        onComplete();
      }
    };
  }

  /**
   * 处理并发送缓存的ICE候选
   *
   * 工作机制：
   * 1. 检查远程描述是否已设置（必要条件）
   * 2. 按先进先出顺序处理候选队列
   * 3. 通过注册的回调函数发送候选
   *
   * 注意：需在设置远程描述后调用
   */
  flushIceCandidates() {
    if (!this.remoteDescriptionSet) {
      console.warn("[ICE] 无法发送候选：远程描述未设置");
      return;
    }

    // 发送队列中的所有ICE候选
    while (this.iceCandidateQueue.length > 0 && this.iceCandidateHandler) {
      const candidate = this.iceCandidateQueue.shift();
      if (candidate) {
        this.iceCandidateHandler(candidate);
      }
    }
  }

  /**
   * 添加ICE候选
   * @param candidate ICE候选
   */
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection || !this.remoteDescriptionSet) return;

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // region 媒体处理
  // ================================ 媒体流管理 ================================
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

  // region 私有工具方法
  // ================================ 内部方法 ================================
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
      // console.log("ICE连接状态:", state);

      // 更新连接状态
      this.isWebRTCConnected = state === "connected" || state === "completed";
    };

    // 连接状态变化
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      this.isVideoChatStarted = state === "disconnected";
      if (state === "disconnected") {
        this.closePeerConnection();
      }
    };
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
