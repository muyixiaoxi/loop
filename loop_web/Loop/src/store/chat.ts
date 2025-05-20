import { makeObservable, observable, action } from "mobx";

class ChatStore {
  // 当前会话对象信息
  currentFriend = {
    id: "", // 会话ID
    nickname: "", // 会话名称
    avatar: "", // 会话头像
  };
  currentFriendId: string | null = null;
  currentFriendName: string | null = null;
  currentFriendAvatar: string | undefined = undefined;

  // 可观察数据
  currentMessages = []; // 当前会话消息列表
  // 聊天列表数据
  currentChatList = [];
  // 设置当前会话信息
  currentChatInfo = {
    type: 0, // USER-单聊，GROUP-群聊
  };

  constructor() {
    makeObservable(this, {
      currentFriendId: observable,
      currentFriendName: observable,
      currentFriendAvatar: observable,
      currentMessages: observable,
      currentChatList: observable,
      currentChatInfo: observable,
      setCurrentMessages: action,
      setCurrentFriendData: action,
      setCurrentChatList: action,
    });
  }

  // 当前会话好友信息
  setCurrentFriendData = (data: {
    id: string | null;
    nickname: string;
    avatar: string;
  }) => {
    this.currentFriendId = data.id;
    this.currentFriendName = data.nickname;
    this.currentFriendAvatar = data.avatar;
  };

  // 当前会话好友聊天记录
  setCurrentMessages = (messages: []) => {
    this.currentMessages = messages;
  };

  // 聊天列表数据
  setCurrentChatList = (data: []) => {
    this.currentChatList = data;
  };

  // 当前会话信息
  setCurrentChatInfo = (data: { type: number }) => {
    this.currentChatInfo = data;
  };
}

export default new ChatStore();
