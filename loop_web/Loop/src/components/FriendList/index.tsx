import { useState } from "react";
import { Drawer, Button, Modal, Input } from "antd";
import { LeftOutlined, PlusOutlined } from "@ant-design/icons";
import { searchNewfriend } from "@/api/user";
import "./index.scss";

const FirendList = () => {
  const [open, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制模态框的显示状态

  // 查询好友申请
  const handleSearch = async () => {
    const res = await searchNewfriend();
    if (res.code === 1000) {
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

  return (
    <div className="friend-list" style={containerStyle}>
      <div className="friend-list-title">通讯录</div>
      <div className="friend-list-content">
        <div className="friend-list-search">
          <input type="text" placeholder="搜索" />
        </div>
        <ul className="friend-list-ul">
          <li>
            <div
              className="friend-list-item"
              onClick={handleNew}
            >
              <div className="friend-list-item-avatar">
                <img
                  src="https://loopavatar.oss-cn-beijing.aliyuncs.com/1744681340372_新朋友.png"
                  alt="头像"
                />
              </div>
              <div className="friend-list-item-info">新朋友</div>
            </div>
          </li>
          <li>
            <div className="friend-list-item">
              <div className="friend-list-item-avatar">
                <img
                  src="https://loopavatar.oss-cn-beijing.aliyuncs.com/1744681340372_新朋友.png"
                  alt="头像"
                />
              </div>
              <div className="friend-list-item-info">新朋友</div>
            </div>
          </li>
          <li>
            <div className="friend-list-item">
              <div className="friend-list-item-avatar">
                <img
                  src="https://loopavatar.oss-cn-beijing.aliyuncs.com/1744681340372_新朋友.png"
                  alt="头像"
                />
              </div>
              <div className="friend-list-item-info">新朋友</div>
            </div>
          </li>
          <li>
            <div className="friend-list-item">
              <div className="friend-list-item-avatar">
                <img
                  src="https://loopavatar.oss-cn-beijing.aliyuncs.com/1744681340372_新朋友.png"
                  alt="头像"
                />
              </div>
              <div className="friend-list-item-info">新朋友</div>
            </div>
          </li>
        </ul>
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
          {[1, 2, 3, 4, 5, 11, 6, 7, 8, 9, 10].map((item) => (
            <div className="request-item" key={item}>
              <img
                src="https://loopavatar.oss-cn-beijing.aliyuncs.com/1744681340372_新朋友.png"
                alt=""
                className="request-avatar"
              />
              <div className="request-info">
                <div className="username">用户{item}</div>
                <div className="message">
                  asdasadfsdfasdfsda你好，加个好友吧
                </div>
              </div>
              <div className="action-buttons">
                {true ? (
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
        <div className="Input" style={{ height: '500px' }}>
          <Input placeholder="通过手机号查询好友"></Input>
        </div>
      </Modal>
    </div>
  );
};

export default FirendList;