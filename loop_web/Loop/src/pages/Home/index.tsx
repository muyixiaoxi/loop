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
import WebSocketClient from "@/utils/websocket";
import userStore from "@/store/user";
// observer 将组件变成响应式组件
const Home = observer(() => {
  const { userInfo, token } = userStore; // 获取用户信息
  const { currentRoute } = navigationStore; // 获取当前路由信息
  const { isShowUserAmend, setIsShowUserAmend } = globalStore;
  // useEffect(() => {
  //   if (!token) return;
  //   const wsClient = new WebSocketClient<string>({
  //     url: `ws://47.93.85.12:8080/api/v1/im?token=${token}`,
  //     onMessage: (message) => {
  //       console.log("收到消息:", message);
  //     },
  //   });

  //   // 连接
  //   wsClient.connect();

  //   return () => {
  //     // 组件卸载时会自动关闭连接
  //     wsClient.disconnect();
  //   };
  // }, [token]);

  
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
