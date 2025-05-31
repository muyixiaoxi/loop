import "./index.scss";
import { Avatar } from "antd";
import { formatTimestamp } from "@/utils/index";
import userStore from "@/store/user";
import ChatStore from "@/store/chat";
import { getChatDB } from "@/utils/chat-db";

type FriendItemProps = {
  friendId: number; // 好友唯一标识
  name: string; // 好友名称
  lastContent: string; // 好友描述
  avatar: string; // 好友头像
  lastSendTime?: number | string; // 最后发送时间
  unreadCount?: number; // 未读消息数量
  chatType?: number; // 聊天类型
};

/**
 * 好友列表项组件
 * @param props 组件属性
 * @returns 好友列表项组件
 * */
const FriendItem = (props: FriendItemProps) => {
  const { userInfo } = userStore; // 获取用户信息
  const db = getChatDB(userInfo.id); // 获取数据库
  const {
    setCurrentFriendData,
    setCurrentMessages,
    setCurrentChatList,
    setCurrentChatInfo,
  } = ChatStore;

  const {
    name,
    lastContent,
    avatar,
    lastSendTime,
    friendId,
    unreadCount = 0,
    chatType,
  } = props;

  const handleNewConversation = async () => {
    // 点击获取新的会话好友数据
    const data = {
      id: friendId,
      nickname: name,
      avatar: avatar,
    } as any;

    setCurrentFriendData(data); // 设置当前好友数据

    const res: any = await db.getConversation(
      userInfo.id,
      friendId,
      Number(chatType)
    ); // 获取会话数据
    setCurrentMessages(res?.messages); // 设置当前消息
    setCurrentChatInfo({ type: Number(chatType) }); // 设置当前聊天信息

    console.log(res, "获取会话数据");
    // 重置未读消息数量为0
    await db.conversations
      .where("[userId+targetId+type]")
      .equals([userInfo.id, friendId, Number(chatType)])
      .modify({ unreadCount: 0 });

    // 重置当前用户会话列表
    const list: any = await db.getUserConversations(userInfo.id);
    setCurrentChatList(list);
  };

  return (
    <div className="friend-item" onClick={() => handleNewConversation()}>
      <div className="friend-avatar">
        <Avatar src={avatar} className="friend-avatar-img"></Avatar>
      </div>
      <div className="friend-info">
        <div className="friend-name-time">
          <div className="friend-name">{name}</div>
          <div className="friend-time">
            {lastSendTime && formatTimestamp(lastSendTime)}
          </div>
        </div>
        <div className="friend-content">
          <div className="friend-content-text">{lastContent}</div>
          {unreadCount > 0 && (
            <div className="friend-unread">{unreadCount}</div>
          )}
        </div>
      </div>
    </div>
  );
};
export default FriendItem;
