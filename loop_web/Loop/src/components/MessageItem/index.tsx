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
};

/**
 * 好友列表项组件
 * @param props 组件属性
 * @returns 好友列表项组件
 * */
const FriendItem = (props: FriendItemProps) => {
  const { userInfo } = userStore; // 获取用户信息
  const db = getChatDB(userInfo.id); // 获取数据库
  const { setCurrentFriendData, setCurrentMessages } = ChatStore;

  const { name, lastContent, avatar, lastSendTime, friendId } = props;

  const handleNewConversation = async () => {
    // 点击获取新的会话好友数据
    const data = {
      id: friendId,
      nickname: name,
      avatar: avatar,
    } as any;
    setCurrentFriendData(data); // 设置当前好友数据
    const res: any = await db.getConversation(userInfo.id, friendId); // 获取会话数据
    setCurrentMessages(res?.messages); // 设置当前消息
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
        <div className="friend-desc">{lastContent}</div>
      </div>
    </div>
  );
};
export default FriendItem;
