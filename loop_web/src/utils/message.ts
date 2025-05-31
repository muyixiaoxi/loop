// src/utils/message.ts
import { useMessage } from '@components/MessageProvider';

export const useGlobalMessage = () => {
    const message = useMessage();

    return {
        success: (content: string, duration?: number) =>
            message.success(content, duration),
        error: (content: string, duration?: number) =>
            message.error(content, duration),
        warning: (content: string, duration?: number) =>
            message.warning(content, duration),
        info: (content: string, duration?: number) =>
            message.info(content, duration),
        loading: (content: string, duration?: number) =>
            message.loading(content, duration),
        destroy: () => message.destroy(),
        open: (options: Parameters<typeof message.open>[0]) =>
            message.open(options)
    };
};

// 创建可以直接导入使用的实例
let globalMessage: ReturnType<typeof useGlobalMessage>;

export const initGlobalMessage = (messageApi: typeof message) => {
    globalMessage = {
        success: (content, duration) => messageApi.success(content, duration),
        error: (content, duration) => messageApi.error(content, duration),
        warning: (content, duration) => messageApi.warning(content, duration),
        info: (content, duration) => messageApi.info(content, duration),
        loading: (content, duration) => messageApi.loading(content, duration),
        destroy: () => messageApi.destroy(),
        open: (options) => messageApi.open(options)
    };
};

export const message: any = {
    // 代理方法，使用时需要确保已经初始化
    success: (content: string, duration?: number) =>
        globalMessage?.success(content, duration),
    error: (content: string, duration?: number) =>
        globalMessage?.error(content, duration),
    warning: (content: string, duration?: number) =>
        globalMessage?.warning(content, duration),
    info: (content: string, duration?: number) =>
        globalMessage?.info(content, duration),
    loading: (content: string, duration?: number) =>
        globalMessage?.loading(content, duration),
    destroy: () => globalMessage?.destroy(),
    open: (options: Parameters<typeof message.open>[0]) =>
        globalMessage?.open(options as any)
};