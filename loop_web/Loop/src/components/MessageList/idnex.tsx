import { useEffect, useState } from "react";
import "./index.scss";
import MessageItem from "@/components/MessageItem";
import { getChatDB } from "@/utils/chat-db";
import userStore from "@/store/user";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const MessageList = () => {
  const { userInfo } = userStore;
  const db = getChatDB(userInfo.id); // 获取数据库对象

  const [chatList, setChatList] = useState<any[]>([]); // 聊天列表

  const handleMessageList = async () => {
    const list = await db.getUserConversations(userInfo.id); // 获取聊天列表
    setChatList(list); // 更新聊天列表状态
    console.log(list, "聊天列表"); // 打印聊天列表
  };
  useEffect(() => {
    handleMessageList();
  }, []);

  return (
    <div className="message-list">
      <div className="message-list-content">
        <div className="message-list-search">
          <Input
            placeholder="搜索好友"
            prefix={<SearchOutlined className="search-icon" />}
            allowClear
          />
        </div>
        <div className="message-list-item">
          {chatList.map((item: any) => (
            <MessageItem
              key={item.targetId}
              friendId={item.targetId}
              avatar={item.headImage}
              name={item.showName}
              lastContent={item.lastContent}
              lastSendTime={item.lastSendTime}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
export default MessageList;
