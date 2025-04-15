import "./index.scss";
import { useState, useEffect } from "react";
import { Modal } from "antd";
import { observer } from "mobx-react-lite";
import globalStore from "@/store/global";
import navigationStore from "@/store/navigation";
import SideNavigation from "@/components/SideNavigation";
import FirendList from "@/components/FriendList";
import EditUser from "@/components/EditUser"; // 导入 EditUser 组件
import Chat from "@/components/Chat"; // 导入 Chat 组件
import MessageList from "@/components/MessageList/idnex";
// observer 将组件变成响应式组件
const Home = observer(() => {
  const { currentRoute } = navigationStore; // 获取当前路由信息
  const { isShowUserAmend, setIsShowUserAmend } = globalStore;

  return (
    <div className="main-layout">
      <SideNavigation />

      <div className="main-layout-content">
        <div className="main-layout-content-left">
          {currentRoute === "conversation" ? (
            <MessageList />
          ) : currentRoute === "friend" ? (
            <FirendList />
          ) : null}
        </div>
        <div className="main-layout-content-right">
          <Chat />
        </div>
      </div>

      {isShowUserAmend ? (
        <Modal
          open={isShowUserAmend}
          onCancel={() => setIsShowUserAmend(!isShowUserAmend)}
          footer={null}
          title="用户信息"
        >
          <EditUser />
        </Modal>
      ) : null}
    </div>
  );
});

export default Home;
