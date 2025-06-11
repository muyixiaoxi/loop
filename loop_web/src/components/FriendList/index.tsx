import { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { Drawer, Button, Modal, Input, message } from "antd";
import { LeftOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import "./index.scss";
import {
  getFriendList,
  postAddFriend,
  searchNewfriend,
  postHandleFriend,
  getHandleFriendCount,
} from "@/api/friend";
import { searchUser } from "@/api/user";
import userStore from "@/store/user";
import ChatStore from "@/store/chat";
import { getChatDB } from "@/utils/chat-db";
import { getFirstLetter } from "@/utils/pinyin";
import { debounce } from "@/utils";

const FriendList = observer(() => {
  // ========== 状态管理 ==========
  const { userInfo } = userStore;
  const db = getChatDB(userInfo.id);
  const { setCurrentFriendData, setCurrentMessages, setCurrentChatInfo } =
    ChatStore;

  // 组件状态
  const [open, setOpen] = useState(false); // 新朋友抽屉开关
  const [addopen, setaddOpen] = useState(false); // 添加好友抽屉开关
  const [isModalOpen, setIsModalOpen] = useState(false); // 搜索好友模态框开关
  const [searchInput, setSearchInput] = useState(""); // 搜索手机号输入
  const [modalTimer, setModalTimer] = useState<NodeJS.Timeout | null>(null); // 搜索防抖计时器
  const [searchResult, setSearchResult] = useState<any>(null); // 搜索结果
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle"); // 搜索状态
  const [friendList, setFriendList] = useState<any[]>([]); // 好友列表
  const [newFriendList, setNewFriendList] = useState<any[]>([]); // 新朋友列表
  const [addData, setaddData] = useState<any>({
    friend_id: 0,
    message: `你好！我是${userInfo.nickname || "匿名用户"}`,
  }); // 添加好友数据
  const [pendingFriendRequests, setPendingFriendRequests] = useState<{
    untreated_count: number;
  }>({
    untreated_count: 0,
  }); // 待处理好友请求数量
  const [applyMessage, setApplyMessage] = useState(""); // 申请消息
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set()); // 已发送请求
  const [searchKeyword, setSearchKeyword] = useState(""); // 好友搜索关键词

  // ========== 数据获取方法 ==========

  /** 获取好友列表数据 */
  const getFriendListData = async () => {
    try {
      const res: any = await getFriendList();
      // 为每个好友添加聊天类型标识
      const friendsWithType = res.data.map((friend: any) => ({
        ...friend,
        chatType: 1, // 1表示好友聊天
      }));
      setFriendList(friendsWithType);
    } catch (error) {
      console.error("获取好友列表出错:", error);
      message.error("获取好友列表失败");
    }
  };

  /** 获取待处理的好友申请数量 */

  const getNewFriendListData = async () => {
    const res: any = await getHandleFriendCount(); // 获取待处理的好友申请数量
    setPendingFriendRequests(res.data); // 更新状态
  };

  // ========== 好友搜索相关方法 ==========

  /** 处理好友搜索输入变化（带防抖） */
  const handleFriendSearch = useCallback(
    debounce((value: string) => {
      setSearchKeyword(value.trim().toLowerCase());
    }, 500),
    []
  );

  /** 获取排序后的好友列表（按首字母分组） */
  const getSortedFriendList = useCallback(() => {
    if (!friendList || friendList.length === 0) return [];

    const groupedFriends = new Map<string, any[]>();
    friendList.forEach((friend) => {
      if (!friend?.nickname) return;

      const firstLetter = getFirstLetter(friend.nickname);
      groupedFriends.set(firstLetter, [
        ...(groupedFriends.get(firstLetter) || []),
        friend,
      ]);
    });
    return Array.from(groupedFriends.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [friendList]);

  /** 获取筛选后的好友列表（根据搜索关键词） */
  const getFilteredFriendList = useCallback(() => {
    if (!friendList || friendList.length === 0) return [];
    if (!searchKeyword.trim()) return getSortedFriendList();

    const lowerKeyword = searchKeyword.toLowerCase();
    const filteredFriends = friendList.filter((friend) => {
      if (!friend?.nickname) return false;

      const nickname = friend.nickname.toLowerCase();
      const firstLetter = getFirstLetter(friend.nickname).toLowerCase();
      return (
        nickname.includes(lowerKeyword) || firstLetter.includes(lowerKeyword)
      );
    });

    const groupedFriends = new Map<string, any[]>();
    filteredFriends.forEach((friend) => {
      const firstLetter = getFirstLetter(friend.nickname);
      groupedFriends.set(firstLetter, [
        ...(groupedFriends.get(firstLetter) || []),
        friend,
      ]);
    });

    return Array.from(groupedFriends.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [friendList, searchKeyword, getSortedFriendList]);

  // ========== 新朋友相关方法 ==========

  /** 获取新朋友列表 */
  const handleNew = async () => {
    setOpen(true);
    try {
      const res: any = await searchNewfriend();
      if (res.code === 1000) {
        setNewFriendList(res.data);
      }
    } catch (error) {
      console.error("获取新朋友列表出错:", error);
    }
  };

  /** 处理好友申请 */
  const handleApply = async (friendId: number, status: number) => {
    try {
      const data = { requester_id: friendId, status };
      await postHandleFriend(data);
      await handleNew(); // 刷新新朋友列表
      await getFriendListData(); // 刷新好友列表
      await getNewFriendListData(); // 刷新待处理的数量
      message.success(status === 1 ? "已同意好友申请" : "已拒绝好友申请");
    } catch (error) {
      console.error("处理好友申请出错:", error);
      message.error("处理好友申请失败");
    }
  };

  // ========== 添加好友相关方法 ==========

  /** 处理添加好友搜索 */
  const handleModalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchStatus("loading");
    setSearchInput(value);
    if (modalTimer) clearTimeout(modalTimer);

    setModalTimer(
      setTimeout(() => {
        if (value.trim()) handleSearchUser(value);
      }, 800)
    );
  };

  /** 搜索用户 */
  const handleSearchUser = async (phone: string) => {
    try {
      const res: any = await searchUser(phone);
      if (res.code === 1000) {
        if (phone === userInfo.phone) {
          message.warning("不能添加自己到通讯录");
        }
        setSearchResult(res.data);
        setSearchStatus("success");
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

  /** 准备添加好友 */
  const handleAD = (id: number) => {
    setaddData((prevData: any) => ({
      ...prevData,
      friend_id: id,
    }));
    const defaultMessage = `你好！我是${userInfo.nickname || "匿名用户"}`;
    setApplyMessage(defaultMessage);
    setaddOpen(true);
  };

  /** 发送好友请求 */
  const handleSendRequest = async () => {
    try {
      const newAddData = {
        ...addData,
        message: applyMessage,
      };
      const response: any = await postAddFriend(newAddData);
      if (response.code === 1000) {
        message.success("添加好友请求已发送");
        setSentRequests((prev) => new Set([...prev, newAddData.friend_id]));
        setaddOpen(false);
      }
    } catch (error) {
      console.error("发送好友申请出错:", error);
      message.error("添加好友请求出错");
    }
  };

  // ========== 聊天相关方法 ==========

  /** 开始新会话 */
  const handleNewConversation = async (data: any) => {
    const params = {
      id: data.id,
      nickname: data.nickname,
      avatar: data.avatar,
    };
    console.log(params, "更新好友数据");
    setCurrentFriendData(params);

    const res: any = await db.getConversation(userInfo.id, data.id, 1);
    setCurrentMessages(res?.messages);
    setCurrentChatInfo({ type: 1 });
  };

  // ========== 副作用钩子 ==========
  useEffect(() => {
    getFriendListData();
    getNewFriendListData();
  }, []);

  useEffect(() => {
    return () => {
      if (modalTimer) clearTimeout(modalTimer);
    };
  }, [modalTimer]);

  // ========== 其他方法 ==========
  const onaddClose = () => {
    setaddOpen(false);
  };

  const onClose = () => {
    setOpen(false);
  };

  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
  };

  // ========== 渲染部分 ==========
  return (
    <div className="friend-page" style={containerStyle}>
      <div className="friend-container">
        <div className="header">
          <Input
            placeholder="搜索好友"
            prefix={<SearchOutlined className="search-icon" />}
            allowClear
            onChange={(e) => handleFriendSearch(e.target.value)}
          />
          <PlusOutlined
            style={{ fontSize: 20, marginLeft: 10 }}
            onClick={() => {
              setSearchInput("");
              setSearchResult(null);
              setIsModalOpen(true);
            }}
          />
        </div>

        <div className="friend-ul">
          <div
            className="friend-item"
            onClick={() => {
              handleNew();
            }}
          >
            <div className="friend-item-avatar">
              <img
                src="https://loopavatar.oss-cn-beijing.aliyuncs.com/1744681340372_新朋友.png"
                alt="头像"
              />
            </div>
            <div className="friend-item-info">
              <span>新朋友</span>
              {pendingFriendRequests.untreated_count > 0 && (
                <div className="unread-text">
                  {pendingFriendRequests.untreated_count}
                </div>
              )}
            </div>
          </div>
          <div className="content_roll">
            {getFilteredFriendList().map(([letter, friends]) => (
              <div className="friend-section" key={letter}>
                <div className="section-header">{letter}</div>
                {friends.map((item) => (
                  <div
                    key={item.id}
                    className="friend-item"
                    onClick={() => handleNewConversation(item)}
                  >
                    <div className="friend-item-avatar">
                      <img src={item.avatar} alt={item.nickname} />
                    </div>
                    <div className="friend-item-info">{item.nickname}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Drawer
        title={
          <div className="drawer-header">
            <LeftOutlined onClick={onClose} style={{ marginRight: "8px" }} />
            <span>新朋友</span>
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
                <div className="username">{item.name}</div>
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
                    同意
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      <Modal
        title="添加好友"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        closable={true}
        className="friend-search-modal"
      >
        <Input
          placeholder="通过手机号查询好友"
          value={searchInput}
          onChange={handleModalSearch}
        />
        <div className="search-content">
          {!searchInput.trim() ? (
            <div className="search-empty-state">请输入手机号以搜索</div>
          ) : (
            <>
              {searchStatus === "loading" && (
                <div className="search-loading">搜索中...</div>
              )}
              {searchStatus === "success" && searchResult && (
                <div className="search-result-card">
                  <div className="user-profile">
                    <div className="user-avatar">
                      <img src={searchResult.avatar} alt="用户头像" />
                    </div>
                    <div className="user-details">
                      <div className="user-name">{searchResult.nickname}</div>
                      <div className="user-signature">
                        {searchResult.signature}
                      </div>
                    </div>
                  </div>
                  {searchInput !== userInfo?.phone && (
                    <>
                      {searchResult.is_friend ? (
                        <Button
                          type="primary"
                          className="action-button"
                          onClick={() => handleNewConversation(searchResult)}
                        >
                          发消息
                        </Button>
                      ) : sentRequests.has(searchResult.id) ? (
                        <Button
                          type="default"
                          className="action-button"
                          disabled
                        >
                          已发送
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          className="action-button"
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
                <div className="search-empty-state">暂无该用户</div>
              )}
              {searchStatus === "error" && (
                <div className="search-error">搜索出错，请稍后再试</div>
              )}
            </>
          )}
        </div>
        <Drawer
          title="填写申请信息"
          placement="right"
          width={300}
          open={addopen}
          onClose={onaddClose}
          getContainer={false}
          className="add-friend-drawer"
        >
          <Input.TextArea
            rows={2}
            value={applyMessage}
            onChange={(e) => setApplyMessage(e.target.value)}
            placeholder={`你好！我是${userInfo.nickname || "匿名用户"}`}
            maxLength={20}
            showCount
            className="message-input"
          />
          <div className="action-buttons">
            <Button onClick={onaddClose} className="cancel-btn">
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

export default FriendList;
