import { makeObservable, observable, action } from'mobx';

class PeerConnectionStore {
  // 用于存储 RTCPeerConnection 实例
  peerConnection: RTCPeerConnection | null = null;
  // 用于跟踪是否设置了远程描述
  remoteDescriptionSet: boolean = false;
  // 数据通道
  dataChannel: RTCDataChannel | null = null;
  // 新增：用于跟踪 WebRTC 连接是否接通
  isWebRTCConnected: boolean = false;
  // 新增：用于记录音频流是否成功添加到轨道
  isAudioStreamAdded: boolean = false;
  // 新增：用于记录视频流是否成功添加到轨道
  isVideoStreamAdded: boolean = false;

  constructor() {
    makeObservable(this, {
      peerConnection: observable,
      remoteDescriptionSet: observable,
      isWebRTCConnected: observable, // 让新状态可观察
      isAudioStreamAdded: observable,
      isVideoStreamAdded: observable,
      createPeerConnection: action,
      setRemoteDescription: action,
      closePeerConnection: action,
      sendVideoOffer: action,
      addIceCandidate: action,
      createDataChannel: action,
      setupDataChannelHandlers: action,
      setupMediaStreamHandlers: action,
      sendData: action
    });
  }

  createPeerConnection(sendMessageWithTimeout: (data: any) => void, localStream: MediaStream, senderId: number, receiverId: number) {
    // 创建一个新的 RTCPeerConnection 实例，配置 ICE 服务器
    this.peerConnection = new RTCPeerConnection({
      // iceServers: [
      //   {
      //     urls: 'stun:stun.l.google.com:19302', // 这是 Google 提供的公共 STUN 服务器
      //   },
      //   {
      //     urls: 'turn:47.121.25.229:3478',
      //     username: 'admin',
      //     credential: '123456',
      //   },
      // ],
    });

    // 将本地媒体流添加到 RTCPeerConnection
    localStream.getTracks().forEach(track => {
      console.log('添加本地媒体流:', track); // 添加日志输出
      if (track.kind === 'audio') {
        this.peerConnection?.addTrack(track, localStream);
        this.isAudioStreamAdded = true;
        console.log('音频流已成功添加到本地轨道');
      } else if (track.kind === 'video') {
        this.peerConnection?.addTrack(track, localStream);
        this.isVideoStreamAdded = true;
        console.log('视频流已成功添加到本地轨道');
      }
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateData = {
          cmd: 9, // 自定义命令类型
          data: {
            sender_id: senderId,
            receiver_id: receiverId,
            candidate_init: event.candidate
          }
        };
        sendMessageWithTimeout(candidateData);
      }
    };

    // 监听连接状态变化
    this.peerConnection.onconnectionstatechange = () => {
        console.log('连接状态变化:', this.peerConnection?.connectionState); // 添加日志输出

      if (this.peerConnection) {
        switch (this.peerConnection.connectionState) {
          case "connected":
            console.log('WebRTC 连接已接通');
            this.isWebRTCConnected = true;
            break;
          case "disconnected":
          case "failed":
          case "closed":
            console.log('WebRTC 连接断开或失败');
            this.isWebRTCConnected = false;
            break;
        }
      }
    };

    // 监听 ICE 连接状态变化
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        switch (this.peerConnection.iceConnectionState) {
          case "connected":
          case "completed":
            console.log('WebRTC ICE 连接已接通');
            this.isWebRTCConnected = true;
            break;
          case "disconnected":
          case "failed":
          case "closed":
            console.log('WebRTC ICE 连接断开或失败');
            this.isWebRTCConnected = false;
            break;
            default:
              console.log('WebRTC ICE 连接状态:', this.peerConnection.iceConnectionState);
        }
      }
    };

    // 合并 ontrack 事件处理逻辑
    const combinedOnTrack = (event) => {
      console.log(event,'1111111111111111111111111111111111111111111111111111111111111111111111111111');
      const remoteStream = event.streams[0];
      console.log('接收到远程媒体流:', remoteStream); // 添加日志输出
      if (remoteStream) {
        console.log('接收到远程媒体流，WebRTC 连接已接通');
        this.isWebRTCConnected = true;

        // 检查是否有视频轨道
        const videoTracks = remoteStream.getVideoTracks();
        if (videoTracks.length > 0) {
          console.log('检测到有视频流传输过来');
        }
      }
    };

    this.peerConnection.ontrack = combinedOnTrack;
  }

  async sendVideoOffer(sendMessageWithTimeout: (data: any) => void, senderId: number, receiverId: number) {
    if (!this.peerConnection) {
      console.error('PeerConnection 未创建');
      return;
    }
    try {
      // 创建 offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log('本地描述设置成功:', offer); // 添加日志输出

      // 这里可以将 offer 发送给对方，例如通过 WebSocket 发送
      const offerMessage = {
        cmd: 7, // 自定义命令类型
        data: {
          sender_id: senderId,
          receiver_id: receiverId,
          session_description: offer
        }
      };

      // 发送 offer 消息到服务器
      sendMessageWithTimeout(offerMessage);
    } catch (error) {
      console.error('创建 offer 时出错: ', error);
    }
  }

  async setRemoteDescription(remoteDesc: RTCSessionDescriptionInit) {
    try {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(remoteDesc));
        this.remoteDescriptionSet = true; // 更新状态
        console.log('远程描述设置成功:', remoteDesc); // 添加日志输出
      }
    } catch (error) {
      console.error('设置远程描述时出错:', error);
    }
  }

  // 关闭 WebRTC 连接的方法，原方法已存在，优化日志输出
  closePeerConnection() {
    if (this.peerConnection) {
      console.log('正在关闭 WebRTC 连接...');
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('WebRTC 连接已关闭');
    }
    if (this.dataChannel) {
      console.log('正在关闭数据通道...');
      this.dataChannel.close();
      this.dataChannel = null;
      console.log('数据通道已关闭');
    }
    this.remoteDescriptionSet = false; // 重置远程描述状态
    this.isWebRTCConnected = false; // 重置连接状态
    this.isAudioStreamAdded = false; // 重置音频流添加状态
    this.isVideoStreamAdded = false; // 重置视频流添加状态
    console.log('WebRTC 相关状态已重置');
  }

  // 新增方法：添加 ICE 候选
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) {
      console.error('PeerConnection 未创建，无法添加 ICE 候选');
      return;
    }
    // 检查远程描述是否已设置
    if (!this.remoteDescriptionSet) {
      console.warn('远程描述未设置，暂不添加 ICE 候选');
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('ICE 候选添加成功:', candidate);
    } catch (error) {
      console.error('添加 ICE 候选时出错:', error);
    }
  }

  // 创建数据通道
  createDataChannel(label: string) {
    if (this.peerConnection) {
      this.dataChannel = this.peerConnection.createDataChannel(label);
    }
  }

  // 设置数据通道处理程序
  setupDataChannelHandlers(
    onOpen: () => void,
    onMessage: (event: MessageEvent) => void,
    onClose: () => void
  ) {
    if (this.peerConnection) {
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.dataChannel.onopen = onOpen;
        this.dataChannel.onmessage = onMessage;
        this.dataChannel.onclose = onClose;
      };

      if (this.dataChannel) {
        this.dataChannel.onopen = onOpen;
        this.dataChannel.onmessage = onMessage;
        this.dataChannel.onclose = onClose;
      }
    }
  }

  // 发送数据
  sendData(data: string | Blob | ArrayBuffer) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(data);
    }
  }

  // 设置媒体流处理程序，修改为合并逻辑
  setupMediaStreamHandlers(onRemoteStream: (stream: MediaStream) => void) {
    if (this.peerConnection) {
      const existingOnTrack = this.peerConnection.ontrack;
      this.peerConnection.ontrack = (event) => {
        existingOnTrack && existingOnTrack(event);
        const remoteStream = event.streams[0];
        onRemoteStream(remoteStream);
      };
    }
  }
}

export const usePeerConnectionStore = new PeerConnectionStore();