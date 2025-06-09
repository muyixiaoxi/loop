import { useEffect, useState, useCallback } from "react";
import "./index.scss";
import MessageItem from "@/components/MessageItem";
import { getChatDB } from "@/utils/chat-db";
import userStore from "@/store/user";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import chatStore from "@/store/chat";
import { debounce } from "@/utils";

const MessageList = observer(() => {
  // ========== 状态管理 ==========
  const { userInfo } = userStore;
  const { currentChatList } = chatStore;
  const db = getChatDB(userInfo.id);

  // 聊天列表状态
  const [chatList, setChatList] = useState<any[]>(currentChatList);
  // 搜索关键词状态
  const [searchKeyword, setSearchKeyword] = useState("");

  // ========== 数据获取方法 ==========

  /**
   * 获取并更新聊天列表
   */
  const handleMessageList = useCallback(async () => {
    try {
      const list = await db.getUserConversations(userInfo.id);
      setChatList(list);
    } catch (error) {
      console.error("获取聊天列表失败:", error);
    }
  }, [db, userInfo.id]);

  // ========== 搜索相关方法 ==========

  /**
   * 处理搜索输入变化
   * @param e 输入事件
   */
  const handleSearchChange = useCallback(
    debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchKeyword(e.target.value.trim().toLowerCase());
    }, 500),
    []
  );

  /**
   * 根据搜索关键词过滤聊天列表
   */
  const getFilteredChatList = useCallback(() => {
    if (!searchKeyword) return chatList;

    return chatList.filter(
      (item) =>
        item.showName.toLowerCase().includes(searchKeyword) ||
        (item.lastContent &&
          item.lastContent.toLowerCase().includes(searchKeyword))
    );
  }, [chatList, searchKeyword]);

  // ========== 副作用钩子 ==========

  // 监听currentChatList变化更新本地状态
  useEffect(() => {
    setChatList(currentChatList);
  }, [currentChatList]);

  // 初始化加载聊天列表
  useEffect(() => {
    handleMessageList();
  }, [handleMessageList]);

  // ========== 渲染部分 ==========

  return (
    <div className="message-container">
      <div className="message-header">
        <Input
          placeholder="搜索聊天"
          prefix={<SearchOutlined className="search-icon" />}
          allowClear
          onChange={handleSearchChange}
        />
      </div>

      <div className="message-content">
        {getFilteredChatList().map((item) => (
          <MessageItem
            key={`${item.type}-${item.targetId}`}
            friendId={item.targetId}
            avatar={item.headImage}
            name={item.showName}
            lastContent={item.lastContent}
            lastSendTime={item.lastSendTime}
            unreadCount={item.unreadCount}
            chatType={item.type}
          />
        ))}
      </div>
    </div>
  );
});

export default MessageList;
