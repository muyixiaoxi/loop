import { useEffect, useState } from "react";
import { Drawer, Button, Modal, Input } from "antd";
import { LeftOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import "./index.scss";
import { getFriendList, searchNewfriend } from "@/api/friend";
import { searchUser } from "@/api/user";

const FirendList = () => {
  const [open, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制模态框的显示状态
  const [searchInput, setSearchInput] = useState("");
  const [modalTimer, setModalTimer] = useState<NodeJS.Timeout | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [friendList, setFriendList] = useState<any[]>([]); // 好友列表
  const [newFriendList, setNewFriendList] = useState<any[]>([]); // 好友申请列表

  // 查询好友申请
  const handleSearch = async () => {
    const res: any = await searchNewfriend();
    if (res.code === 1000) {
      setNewFriendList(res.data);
      console.log(res);
    }
  };

  // 点击新的朋友
  const handleNew = () => {
    setOpen(true);
    handleSearch();
  };

  // 点击加号
  const handleAdd = () => {
    setIsModalOpen(true); // 打开模态框
  };

  // 关闭模态框
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const onClose = () => {
    setOpen(false);
  };

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

  useEffect(() => {
    getFriendListData();
  }, []);

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
      const res = await searchUser(phone);
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
    return () => {
      if (modalTimer) {
        clearTimeout(modalTimer);
      }
    };
  }, [modalTimer]);

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
                <div className="friend-list-item">
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
            <PlusOutlined onClick={handleAdd} />
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
                      console.log("接受好友请求", item);
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
        onCancel={handleModalClose}
        footer={null}
        closable={true}
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
                    <Button type="primary" className="addbt">
                      添加好友
                    </Button>
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
      </Modal>
    </div>
  );
};

export default FirendList;
