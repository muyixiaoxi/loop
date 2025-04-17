// 定义 WebSocket 消息类型
interface WebSocketMessage<T = unknown> {
  type: string; // 消息类型
  data: T; // 消息内容（泛型）
}

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
    reconnectInterval: 1000,
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

    try {
      this.socket = new WebSocket(this.options.url);

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
              this.socket.send(JSON.stringify({ type: "heartbeat" }));
            }
          }, this.options.heartbeatInterval);
        }
      };

      this.socket.onclose = (event) => {
        console.log(`WebSocket 连接关闭，代码: ${event.code}`);
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

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage<T> = JSON.parse(event.data);
          console.log("收到 WebSocket 消息:", message);

          // 忽略心跳消息
          if (message.type === "heartbeat") return;

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
      console.log("发送 WebSocket 消息:", message);
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

export default WebSocketClient;
