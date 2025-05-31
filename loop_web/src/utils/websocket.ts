// 定义 WebSocket 消息类型
import userStore from "@/store/user";

interface WebSocketMessage<T = unknown> {
  cmd: number; // 消息类型,  0-心跳，1-私聊，2-群聊，3-在线应答
  data: T; // 消息内容（泛型）
}
/**
 * data:{
        "seq_id":"",//唯一标识
        "sender_id":0,//发送者id
        "receiver_id":0,//接收者id
        "content":"",//消息内容
        "type":0,//消息类型：0-文字，1-图片，2-文件，3-语音，4-视频
        "send_time":""发送时间
    }
 */

// WebSocket 配置项接口
interface WebSocketOptions {
  url: string; // 连接地址
  onOpen?: () => void; // 连接成功回调
  onClose?: (event: CloseEvent) => void; // 连接关闭回调
  onError?: (event: Event) => void; // 错误回调
  onMessage?: <T>(message: WebSocketMessage<T>) => void; // 消息接收回调
  reconnectInterval?: number; // 重连间隔(毫秒)
  reconnectAttempts?: number; // 最大重连次数
  heartbeatInterval?: number; // 心跳间隔(毫秒)
}

// 连接状态类型
type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

// 单例模式管理全局WebSocket连接
class WebSocketManager {
  private static instance: WebSocketManager;
  private client: WebSocketClient | null = null;
  private listeners: Set<(message: any) => void> = new Set();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public connect(options: WebSocketOptions): WebSocketClient {
    if (!this.client) {
      this.client = new WebSocketClient({
        ...options,
        onMessage: (message) => {
          this.notifyListeners(message);
          options.onMessage?.(message);
        },
      });
      this.client.connect();
    }
    return this.client;
  }

  /**
   * 添加消息监听器
   * @param listener 消息处理函数，当收到消息时会调用该函数
   */
  public addListener(listener: (message: any) => void): void {
    this.listeners.add(listener);
  }

  /**
   * 移除消息监听器
   * @param listener 要移除的消息处理函数
   */
  public removeListener(listener: (message: any) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * 内部方法 - 通知所有监听器有新消息到达
   * @param message 收到的WebSocket消息
   */
  private notifyListeners(message: any): void {
    this.listeners.forEach((listener) => listener(message));
  }

  /**
   * 断开WebSocket连接
   * 会清理所有监听器和内部状态
   */
  public disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }
}

class WebSocketClient<T = unknown> {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private reconnectCount = 0;
  private status: WebSocketStatus = "disconnected";
  private lastMessage: WebSocketMessage<T> | null = null;

  // 默认配置
  private readonly defaultOptions: Required<WebSocketOptions> = {
    url: "",
    onOpen: () => {},
    onClose: () => {},
    onError: () => {},
    onMessage: () => {},
    reconnectInterval: 5000,
    reconnectAttempts: Number.MAX_VALUE,
    heartbeatInterval: 5000,
  };

  constructor(private options: WebSocketOptions) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * 建立 WebSocket 连接
   */
  public connect(): void {
    this.status = "connecting";
    this.clearTimers();

    // 先关闭之前的连接
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    const { access_token } = userStore; // 获取用户信息

    try {
      const url = this.options.url + `?token=${access_token}`;
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log("WebSocket 连接成功");
        this.status = "connected";
        this.reconnectCount = 0;
        this.options.onOpen?.();

        // 设置心跳检测
        if (
          this.options.heartbeatInterval &&
          this.options.heartbeatInterval > 0
        ) {
          this.heartbeatTimer = window.setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
              // 发送心跳包
              this.socket.send(JSON.stringify({ cmd: 0 }));
            }
          }, this.options.heartbeatInterval);
        }
      };

      this.socket.onclose = (event) => {
        console.log(`WebSocket 连接关闭 ${event}，代码: ${event.code}`);
        this.status = "disconnected";
        this.options.onClose?.(event);
        this.clearTimers();

        // 尝试自动重连
        if (
          this.reconnectCount <
          (this.options.reconnectAttempts || Number.MAX_VALUE)
        ) {
          this.reconnectTimer = window.setTimeout(() => {
            this.reconnectCount++;
            this.connect();
          }, this.options.reconnectInterval);
        }
      };

      this.socket.onerror = (event) => {
        console.error("WebSocket 错误:", event);
        this.status = "error";
        this.options.onError?.(event);
      };

      // 连接成功后接收消息
      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage<T> = JSON.parse(event.data);
          // console.log("收到 WebSocket 消息:", message);

          // 忽略心跳消息
          if (message.cmd === 0) return;
          // console.log(message, "心跳包外的数据");

          this.lastMessage = message;
          this.options.onMessage?.(message);
        } catch (error) {
          console.error("解析 WebSocket 消息失败:", error);
        }
      };
    } catch (error) {
      console.error("WebSocket 连接失败:", error);
      this.status = "error";
    }
  }

  /**
   * 发送消息
   * @param message 要发送的消息
   */
  public sendMessage(message: WebSocketMessage<T>): void {
    if (this.status !== "connected" || !this.socket) {
      console.error("发送失败 - WebSocket 未连接");
      throw new Error("WebSocket 未连接");
    }

    try {
      // console.log("发送 WebSocket 消息:", message);
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error("发送 WebSocket 消息失败:", error);
      throw error;
    }
  }

  /**
   * 关闭连接
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.clearTimers();
    this.status = "disconnected";
  }

  /**
   * 获取当前状态
   */
  public getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * 获取最后一条消息
   */
  public getLastMessage(): WebSocketMessage<T> | null {
    return this.lastMessage;
  }

  /**
   * 获取重连次数
   */
  public getReconnectCount(): number {
    return this.reconnectCount;
  }

  /**
   * 清理定时器
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export const webSocketManager = WebSocketManager.getInstance();
