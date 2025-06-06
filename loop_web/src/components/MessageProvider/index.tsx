import { message as antdMessage } from "antd";
import { ReactNode, createContext, useContext, useEffect } from "react";
import { initGlobalMessage } from "@/utils/message";

const MessageContext = createContext<typeof antdMessage>(antdMessage);

/**
 * 全局消息组件
 * @param children 子组件
 * @returns 消息组件
 */
export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [messageApi, contextHolder] = antdMessage.useMessage();

  useEffect(() => {
    initGlobalMessage(messageApi);
  }, [messageApi]);

  return (
    <MessageContext.Provider value={messageApi as any}>
      {contextHolder}
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => useContext(MessageContext);
