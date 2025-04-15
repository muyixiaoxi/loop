import { useEffect, useState } from "react";
import { Drawer, Button, Modal, Input } from "antd";
import { LeftOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import "./index.scss";
import { getFriendList, searchNewfriend } from "@/api/friend";

const FirendList = () => {
  const [open, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制模态框的显示状态
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
        footer={null} // 隐藏底部按钮
        closable={true}
      >
        <div className="Input" style={{ height: "450px" }}>
          <Input placeholder="通过手机号查询好友"></Input>
        </div>
      </Modal>
    </div>
  );
};

export default FirendList;
