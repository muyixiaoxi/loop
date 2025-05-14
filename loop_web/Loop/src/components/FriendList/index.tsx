import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Drawer, Button, Modal, Input, message, Tabs } from "antd";
import type { TabsProps } from "antd";
import { LeftOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import "./index.scss";
import {
  getFriendList,
  postAddFriend,
  searchNewfriend,
  postHandleFriend,
} from "@/api/friend";
import { searchUser } from "@/api/user";
import userStore from "@/store/user";
import ChatStore from "@/store/chat";
import { getChatDB } from "@/utils/chat-db";
import { getFirstLetter } from "@/utils/pinyin";
import { getGroupList } from "@/api/group";

const { TabPane } = Tabs;

const FirendList = observer(() => {
  const { userInfo } = userStore;
  const db = getChatDB(userInfo.id);
  const { setCurrentFriendData, setCurrentMessages, setCurrentChatInfo } =
    ChatStore;
  const [open, setOpen] = useState(false);
  const [addopen, setaddOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [modalTimer, setModalTimer] = useState<NodeJS.Timeout | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [friendList, setFriendList] = useState<any[]>([]);
  const [newFriendList, setNewFriendList] = useState<any[]>([]);
  const [addData, setaddData] = useState<any>({
    friend_id: 0,
    message: `你好！我是${userInfo.nickname || "匿名用户"}`,
  });
  const [applyMessage, setApplyMessage] = useState("");
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());
  const [groupList, setGroupList] = useState<any[]>([]);

  const [searchKeyword, setSearchKeyword] = useState("");

  const handleNew = async () => {
    setOpen(true);

    // 查询好友申请
    const res: any = await searchNewfriend();
    if (res.code === 1000) {
      setNewFriendList(res.data);
      console.log(res);
    }
  };

  const handleAD = (id: number) => {
    // 更新 addData 中的 friend_id
    setaddData((prevData: any) => ({
      ...prevData,
      friend_id: id,
    }));
    // 设置 applyMessage 为默认内容
    const defaultMessage = `你好！我是${userInfo.nickname || "匿名用户"}`;
    setApplyMessage(defaultMessage);
    setaddOpen(true);
  };

  const handleSendRequest = async () => {
    const newAddData = {
      ...addData,
      message: applyMessage,
    };
    setaddData(newAddData);
    try {
      const response = await postAddFriend(newAddData);
      if (response.code === 1000) {
        message.success("添加好友请求已发送");
        // 更新 sentRequests 状态
        setSentRequests((prev) => new Set([...prev, newAddData.friend_id]));
        setaddOpen(false); // 关闭抽屉
      } else {
        message.error("添加好友请求失败，请稍后重试");
      }
    } catch (error) {
      console.error("发送好友申请出错:", error);
      message.error("添加好友请求出错，请稍后重试");
    }
  };

  const onaddClose = () => {
    setaddOpen(false);
  };

  const onClose = () => {
    setOpen(false); // 关闭抽屉
  };

  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
  };

  const getFriendListData = async () => {
    const res: any = await getFriendList();
    // 给每个好友数据添加chatType:1
    const friendsWithType = res.data.map((friend: any) => ({
      ...friend,
      chatType: 1, // 添加chatType字段，1表示单聊
    }));

    setFriendList(friendsWithType);

    console.log(res, "----");
  };

  const getGroupListData = async () => {
    try {
      const res = await getGroupList();
      // 假设接口返回的数据结构是 { data: [...] }
      if (res.data && Array.isArray(res.data)) {
        setGroupList(res.data);
        console.log("群聊列表:", res.data);
      } else {
        console.error("群聊数据格式不正确");
        message.error("获取群聊列表出错，请稍后重试");
      }
    } catch (error) {
      console.error("获取群聊列表出错:", error);
      message.error("获取群聊列表出错，请稍后重试");
    }
  };

  const handleModalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // 清除之前的定时器
    if (modalTimer) {
      clearTimeout(modalTimer);
    }

    // 设置新的定时器，1秒后执行搜索
    setModalTimer(
      setTimeout(() => {
        if (value.trim()) {
          handleSearchUser(value);
        }
      }, 1000)
    );
  };

  const handleSearchUser = async (phone: string) => {
    setSearchStatus("loading");
    try {
      const res: any = await searchUser(phone);
      console.log("搜索结果:", res);

      if (res.code === 1000) {
        if (res.data) {
          // 检查搜索的手机号是否是自己的手机号
          if (phone === userInfo.phone) {
            message.warning("不能添加自己到通讯录");
            // 不再清空搜索结果
            setSearchResult(res.data);
            setSearchStatus("success");
            return;
          }
          setSearchResult(res.data);
          setSearchStatus("success");
        } else {
          setSearchResult(null);
          setSearchStatus("success");
        }
      } else {
        setSearchResult(null);
        setSearchStatus("error");
      }
    } catch (error) {
      console.error("搜索失败:", error);
      setSearchResult(null);
      setSearchStatus("error");
    }
  };

  useEffect(() => {
    getFriendListData();
    getGroupListData();
  }, []);

  useEffect(() => {
    return () => {
      if (modalTimer) {
        clearTimeout(modalTimer);
      }
    };
  }, [modalTimer]);

  const handleApply = async (friendId: number, status: number) => {
    const data = {
      requester_id: friendId,
      status: status,
    };
    postHandleFriend(data);
  };

  // 点击好友、群聊，更换会话内容
  const handleNewConversation = async (data: any, type: number) => {
    const params = {
      id: data.id,
      nickname: data.name,
      avatar: data.avatar,
    };
    setCurrentFriendData(params); // 设置当前好友数据

    const res: any = await db.getConversation(
      userInfo.id,
      data.id,
      type // 1: 单聊 2: 群聊
    ); // 获取会话数据
    setCurrentMessages(res?.messages); // 设置当前消息
    setCurrentChatInfo({ type });
  };

  const getSortedFriendList = () => {
    // 创建一个Map来存储按首字母分组的好友
    const groupedFriends = new Map<string, any[]>();

    friendList.forEach((friend) => {
      const firstLetter = getFirstLetter(friend.nickname);

      if (!groupedFriends.has(firstLetter)) {
        groupedFriends.set(firstLetter, []);
      }
      groupedFriends.get(firstLetter)?.push(friend);
    });

    // 将Map转换为数组并按字母排序
    const sortedGroups = Array.from(groupedFriends.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    return sortedGroups;
  };

  const handleFriendSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  const getFilteredFriendList = () => {
    if (!searchKeyword.trim()) {
      return getSortedFriendList();
    }

    const lowerKeyword = searchKeyword.toLowerCase();

    // 过滤好友列表
    const filteredFriends = friendList.filter((friend) => {
      const nickname = friend.nickname.toLowerCase();
      const firstLetter = getFirstLetter(friend.nickname).toLowerCase();

      // 匹配完整昵称或首字母
      return (
        nickname.includes(lowerKeyword) || firstLetter.includes(lowerKeyword)
      );
    });

    // 将过滤后的好友列表按首字母分组
    const groupedFriends = new Map<string, any[]>();

    filteredFriends.forEach((friend) => {
      const firstLetter = getFirstLetter(friend.nickname);
      if (!groupedFriends.has(firstLetter)) {
        groupedFriends.set(firstLetter, []);
      }
      groupedFriends.get(firstLetter)?.push(friend);
    });

    // 将Map转换为数组并按字母排序
    return Array.from(groupedFriends.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  };

  const getSortedGroupList = () => {
    // 创建一个Map来存储按首字母分组的群聊
    const groupedGroups = new Map<string, any[]>();

    groupList.forEach((group) => {
      // 使用 name 字段获取首字母
      const firstLetter = getFirstLetter(group.name);

      if (!groupedGroups.has(firstLetter)) {
        groupedGroups.set(firstLetter, []);
      }
      groupedGroups.get(firstLetter)?.push(group);
    });

    // 将Map转换为数组并按字母排序
    const sortedGroups = Array.from(groupedGroups.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    return sortedGroups;
  };

  const getFilteredGroupList = () => {
    if (!searchKeyword.trim()) {
      return getSortedGroupList();
    }

    const lowerKeyword = searchKeyword.toLowerCase();

    // 过滤群聊列表，使用 name 字段
    const filteredGroups = groupList.filter((group) => {
      const groupName = group.name.toLowerCase();
      const firstLetter = getFirstLetter(group.name).toLowerCase();

      // 匹配完整群名或首字母
      return (
        groupName.includes(lowerKeyword) || firstLetter.includes(lowerKeyword)
      );
    });

    // 将过滤后的群聊列表按首字母分组
    const groupedGroups = new Map<string, any[]>();

    filteredGroups.forEach((group) => {
      // 使用 name 字段获取首字母
      const firstLetter = getFirstLetter(group.name);
      if (!groupedGroups.has(firstLetter)) {
        groupedGroups.set(firstLetter, []);
      }
      groupedGroups.get(firstLetter)?.push(group);
    });

    // 将Map转换为数组并按字母排序
    return Array.from(groupedGroups.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  };

  const itemsTabs: TabsProps["items"] = [
    {
      key: "1",
      label: "好友",
      children: (
        <div className="content_roll">
          <ul className="friend-ul">
            {getFilteredFriendList().map(([letter, friends]) => (
              <div key={letter}>
                <div className="friend-list-letter">{letter}</div>
                <ul className="friend-ul">
                  {friends.map((item: any) => (
                    <li key={item.id}>
                      <div
                        className="friend-list-item"
                        onClick={() => handleNewConversation(item, 1)}
                      >
                        <div className="friend-list-item-avatar">
                          <img src={item.avatar} alt="头像" />
                        </div>
                        <div className="friend-list-item-info">
                          {item.nickname}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </ul>
        </div>
      ),
    },
    {
      key: "2",
      label: "群聊",
      children: (
        <div className="content_roll">
          <ul className="group-ul">
            {getFilteredGroupList().map(([letter, groups]) => (
              <div key={letter}>
                <div className="friend-list-letter">{letter}</div>
                <ul className="group-ul">
                  {groups.map((item: any) => (
                    <li key={item.id}>
                      <div
                        className="friend-list-item"
                        onClick={() => {
                          handleNewConversation(item, 2);
                        }}
                      >
                        <div className="friend-list-item-avatar">
                          <img src={item.avatar} alt="群头像" />
                        </div>
                        <div className="friend-list-item-info">{item.name}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </ul>
        </div>
      ),
    },
  ];

  // 修改渲染部分
  return (
    <div className="friend-list" style={containerStyle}>
      <div className="friend-list-title">通讯录</div>
      <div className="friend-list-content">
        <div className="friend-list-search">
          <Input
            placeholder="搜索好友或群聊"
            prefix={<SearchOutlined className="search-icon" />}
            allowClear
            value={searchKeyword}
            onChange={handleFriendSearch}
          />
        </div>
        <div className="friend-list-ul">
          <div
            className="friend-list-item"
            onClick={() => {
              handleNew();
            }}
          >
            <div className="friend-list-item-avatar">
              <img
                src="https://loopavatar.oss-cn-beijing.aliyuncs.com/1744681340372_新朋友.png"
                alt="头像"
              />
            </div>
            <div className="friend-list-item-info">新朋友</div>
          </div>
          <Tabs defaultActiveKey="1" items={itemsTabs} />
        </div>
      </div>

      <Drawer
        title={
          <div className="drawer-header">
            <LeftOutlined onClick={onClose} />
            <span>新朋友</span>
            <PlusOutlined onClick={() => setIsModalOpen(true)} />
          </div>
        }
        width={300}
        style={{ padding: 0 }}
        placement="right"
        closable={false}
        onClose={onClose}
        open={open}
        mask={false}
        getContainer={false}
      >
        <div className="request-list">
          {newFriendList.map((item: any) => (
            <div className="request-item" key={item.id}>
              <img src={item.avatar} alt="" className="request-avatar" />
              <div className="request-info">
                <div className="username">{item.nickname}</div>
                <div className="message">{item.message}</div>
              </div>
              <div className="action-buttons">
                {item.status == 1 ? (
                  <Button className="accepted" disabled>
                    已接受
                  </Button>
                ) : (
                  <Button
                    className="accept"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(item.requester_id, 1);
                    }}
                  >
                    确认
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      <Modal
        title="添加新朋友"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        closable={true}
        style={{ overflow: "hidden" }}
      >
        <div className="Input">
          <Input
            placeholder="通过手机号查询好友"
            value={searchInput}
            onChange={handleModalSearch}
          />
          <div className="main">
            {!searchInput.trim() ? (
              <div
                className="search-tip"
                style={{
                  textAlign: "center",
                  color: "#999",
                  padding: "20px 0",
                  margin: "30% auto",
                }}
              >
                请输入手机号以搜索
              </div>
            ) : (
              <>
                {searchStatus === "loading" && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      margin: "30% auto",
                    }}
                  >
                    搜索中...
                  </div>
                )}
                {searchStatus === "success" && searchResult && (
                  <div className="search-result">
                    <div className="user-info">
                      <div className="avatar">
                        <img src={searchResult.avatar} alt="用户头像" />
                      </div>
                      <div className="nickname">
                        <div className="realname">{searchResult.nickname}</div>
                        <div className="signature">
                          <span>{searchResult.signature}</span>
                        </div>
                      </div>
                    </div>
                    {/* 当搜索结果不是自己时才显示操作按钮 */}
                    {searchInput !== userInfo.phone && (
                      <>
                        {searchResult.is_friend ? (
                          <Button
                            type="primary"
                            className="addbt"
                            // 这里可以添加发消息的逻辑
                            onClick={() =>
                              console.log("发消息给", searchResult.id)
                            }
                          >
                            发消息
                          </Button>
                        ) : sentRequests.has(searchResult.id) ? (
                          <Button type="default" className="addbt" disabled>
                            已发送
                          </Button>
                        ) : (
                          <Button
                            type="primary"
                            className="addbt"
                            onClick={() => handleAD(searchResult.id)}
                          >
                            添加好友
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
                {searchStatus === "success" && !searchResult && (
                  <div
                    className="no-result"
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      margin: "30% auto",
                    }}
                  >
                    暂无该用户
                  </div>
                )}
                {searchStatus === "error" && (
                  <div
                    className="error-message"
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: "#ff4d4f",
                      margin: "30% auto",
                    }}
                  >
                    搜索出错，请稍后再试
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* 将Drawer移动到Modal内部 */}
        <Drawer
          title="填写申请信息"
          placement="right"
          width={300}
          open={addopen}
          onClose={onaddClose}
          getContainer={false}
          style={{
            position: "absolute",
            right: 0, // 从Modal的右边框开始
            top: 0,
            height: "100%",
          }}
          bodyStyle={{ padding: 16 }}
        >
          <Input.TextArea
            rows={4}
            value={applyMessage} // 绑定输入内容
            onChange={(e) => setApplyMessage(e.target.value)} // 处理输入变化
            placeholder={`你好！我是${userInfo.nickname || "匿名用户"}`}
            maxLength={100}
            showCount
          />
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button onClick={onaddClose} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={handleSendRequest}>
              发送
            </Button>
          </div>
        </Drawer>
      </Modal>
    </div>
  );
});

export default FirendList;
