import { useEffect, useRef, useState } from 'react';

// 定义 WebSocket 消息类型
interface WebSocketMessage<T = unknown> {
    type: string;   // 消息类型
    data: T;        // 消息内容（泛型）
}

// WebSocket 配置项接口
interface WebSocketOptions {
    url: string;                   // 连接地址
    onOpen?: () => void;           // 连接成功回调
    onClose?: (event: CloseEvent) => void;  // 连接关闭回调
    onError?: (event: Event) => void;       // 错误回调
    onMessage?: <T>(message: WebSocketMessage<T>) => void;  // 消息接收回调
    reconnectInterval?: number;    // 重连间隔(毫秒)
    reconnectAttempts?: number;    // 最大重连次数
    heartbeatInterval?: number;    // 心跳间隔(毫秒)
}

// 默认配置
const defaultOptions: Required<WebSocketOptions> = {
    url: '',
    onOpen: () => { },
    onClose: () => { },
    onError: () => { },
    onMessage: () => { },
    reconnectInterval: 1000,
    reconnectAttempts: Number.MAX_VALUE,
    heartbeatInterval: 5000,  // 默认5秒心跳
};

// 连接状态类型
type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * 自定义 WebSocket Hook
 * @param options 配置选项
 * @returns 返回 socket 实例、发送消息方法、最后消息、连接状态和重连次数
 */
const useWebSocket = <T = unknown>(
    options: WebSocketOptions
): {
    socket: WebSocket | null;                    // WebSocket 实例
    sendMessage: (message: WebSocketMessage<T>) => void;  // 发送消息方法
    lastMessage: WebSocketMessage<T> | null;     // 最后接收的消息
    status: WebSocketStatus;                     // 当前连接状态
    reconnectCount: number;                      // 重连次数
} => {
    // 合并配置选项
    const {
        url,
        onOpen,
        onClose,
        onError,
        onMessage,
        reconnectInterval,
        reconnectAttempts,
        heartbeatInterval,
    } = {
        ...defaultOptions,
        ...options,
    };

    // 状态管理
    const [status, setStatus] = useState<WebSocketStatus>('connecting');
    const [reconnectCount, setReconnectCount] = useState(0);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage<T> | null>(null);

    // 使用 ref 存储可变值
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * 建立 WebSocket 连接
     */
    const connect = () => {
        setStatus('connecting');

        try {
            // 创建 WebSocket 实例
            const socket = new WebSocket(url);

            // 连接成功回调
            socket.onopen = () => {
                console.log('WebSocket 连接成功');
                setStatus('connected');
                setReconnectCount(0);
                onOpen();

                // 设置心跳检测
                if (heartbeatInterval > 0) {
                    heartbeatTimerRef.current = setInterval(() => {
                        if (socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({ type: 'heartbeat' }));
                        }
                    }, heartbeatInterval);
                }
            };

            // 连接关闭回调
            socket.onclose = (event) => {
                console.log(`WebSocket 连接关闭，代码: ${event.code}`);
                setStatus('disconnected');
                onClose(event);

                // 清除心跳定时器
                if (heartbeatTimerRef.current) {
                    clearInterval(heartbeatTimerRef.current);
                    heartbeatTimerRef.current = null;
                }

                // 尝试自动重连
                if (reconnectCount < reconnectAttempts) {
                    reconnectTimerRef.current = setTimeout(() => {
                        setReconnectCount((prev) => prev + 1);
                        connect();
                    }, reconnectInterval);
                }
            };

            // 错误回调
            socket.onerror = (event) => {
                console.error('WebSocket 错误:', event);
                setStatus('error');
                onError(event);
            };

            // 消息接收回调
            socket.onmessage = (event) => {
                try {
                    // 解析消息数据
                    const message: WebSocketMessage<T> = JSON.parse(event.data);
                    console.log('收到 WebSocket 消息:', message);

                    // 忽略心跳消息
                    if (message.type === 'heartbeat') return;

                    // 更新最后消息状态
                    setLastMessage(message);
                    // 调用消息回调
                    onMessage(message);
                } catch (error) {
                    console.error('解析 WebSocket 消息失败:', error);
                }
            };

            // 保存 socket 引用
            socketRef.current = socket;
        } catch (error) {
            console.error('WebSocket 连接失败:', error);
            setStatus('error');
        }
    };

    /**
     * 发送消息
     * @param message 要发送的消息
     * @throws 当连接未建立时抛出错误
     */
    const sendMessage = (message: WebSocketMessage<T>) => {
        if (status !== 'connected' || !socketRef.current) {
            console.error('发送失败 - WebSocket 未连接');
            throw new Error('WebSocket 未连接');
        }

        try {
            console.log('发送 WebSocket 消息:', message);
            socketRef.current.send(JSON.stringify(message));
        } catch (error) {
            console.error('发送 WebSocket 消息失败:', error);
            throw error;
        }
    };

    /**
     * 关闭连接并清理资源
     */
    const closeConnection = () => {
        // 关闭 WebSocket 连接
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        // 清除重连定时器
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        // 清除心跳定时器
        if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
        }
    };

    // 组件挂载时建立连接，卸载时清理
    useEffect(() => {
        connect();

        return () => {
            closeConnection();
        };
    }, [url]); // 当 url 变化时重新连接

    // 返回暴露的方法和状态
    return {
        socket: socketRef.current,
        sendMessage,
        lastMessage,
        status,
        reconnectCount,
    };
};

export default useWebSocket;

// 使用示例
// const {
//     socket,
//     sendMessage,
//     lastMessage,
//     status,
//     reconnectCount
// } = useWebSocket<string>({
//     url: 'wss://your-websocket-server.com',
//     onMessage: (message) => {
//         console.log('收到消息:', message);
//     },
//     reconnectInterval: 5000,  // 5秒重试一次
//     reconnectAttempts: 10,    // 最多重试10次
// });

// // 发送消息
// sendMessage({
//     type: 'chat',
//     data: '你好，世界！'
// });