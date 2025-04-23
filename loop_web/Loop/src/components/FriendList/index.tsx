import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Drawer, Button, Modal, Input } from "antd";
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

const FirendList = observer(() => {
  const { userInfo } = userStore; // 获取用户信息
  const db = getChatDB(userInfo.id); // 获取数据库
  const { setCurrentFriendData, setCurrentMessages } = ChatStore;
  const [open, setOpen] = useState(false);
  const [addopen, setaddOpen] = useState(false); //添加好友
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制模态框的显示状态
  const [searchInput, setSearchInput] = useState("");
  const [modalTimer, setModalTimer] = useState<NodeJS.Timeout | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [friendList, setFriendList] = useState<any[]>([]); // 好友列表
  const [newFriendList, setNewFriendList] = useState<any[]>([]); // 好友申请列表
  const [addData, setaddData] = useState<any>({
    friend_id: 0,
    message: `你好！我是${userInfo.nickname || "匿名用户"}`,
  }); // 好友申请列表
  const [applyMessage, setApplyMessage] = useState(""); // 抽屉中的输入框内容

  // 点击新的朋友
  const handleNew = async () => {
    setOpen(true);

    // 查询好友申请
    const res: any = await searchNewfriend();
    if (res.code === 1000) {
      setNewFriendList(res.data);
      console.log(res);
    }
  };

  //点击添加好友
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

  // 发送好友申请，更新 addData 的 message 属性
  const handleSendRequest = () => {
    const newAddData = {
      ...addData,
      message: applyMessage,
    };
    setaddData(newAddData);
    // 可以在这里添加发送请求的逻辑
    setaddOpen(false); // 关闭抽屉
    const res = postAddFriend(newAddData)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
    console.log(res);
  };
  const onaddClose = () => {
    setaddOpen(false);
  };

  const onClose = () => {
    setOpen(false); // 关闭抽屉
  };

  // 设置抽屉的样式
  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
  };

  // 获取好友列表
  const getFriendListData = async () => {
    const res: any = await getFriendList();
    setFriendList(res.data);

    console.log(res);
  };

  // 处理Modal中的搜索输入变化
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

  // 搜索用户
  const handleSearchUser = async (phone: string) => {
    setSearchStatus("loading");
    try {
      const res: any = await searchUser(phone);
      console.log("搜索结果:", res);

      if (res.code === 1000) {
        if (res.data) {
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

  // 组件卸载时清除定时器
  useEffect(() => {
    getFriendListData();

    return () => {
      if (modalTimer) {
        clearTimeout(modalTimer);
      }
    };
  }, [modalTimer]);

  // 处理好友申请
  const handleApply = async (friendId: number, status: number) => {
    const data = {
      requester_id: friendId,
      status: status,
    };
    postHandleFriend(data);
  };

  // 点击获取新的会话好友数据
  const handleNewConversation = async (data: any) => {
    setCurrentFriendData(data); // 设置当前好友数据
    const res: any = await db.getConversation(userInfo.id, data.id); // 获取会话数据
    setCurrentMessages(res?.messages); // 设置当前消息
  };

  return (
    <div className="friend-list" style={containerStyle}>
      <div className="friend-list-title">通讯录</div>
      <div className="friend-list-content">
        <div className="friend-list-search">
          <Input
            placeholder="搜索好友"
            prefix={<SearchOutlined className="search-icon" />}
            allowClear
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
          <ul className="friend-ul">
            {friendList.map((item: any) => (
              <li key={item.id}>
                <div
                  className="friend-list-item"
                  onClick={() => handleNewConversation(item)}
                >
                  <div className="friend-list-item-avatar">
                    <img src={item.avatar} alt="头像" />
                  </div>
                  <div className="friend-list-item-info">{item.nickname}</div>
                </div>
              </li>
            ))}
          </ul>
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
                    {/* 根据 searchResult.is_friend 判断渲染按钮 */}
                    {searchResult.is_friend ? (
                      <Button
                        type="primary"
                        className="addbt"
                        // 这里可以添加发消息的逻辑
                        onClick={() => console.log("发消息给", searchResult.id)}
                      >
                        发消息
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
