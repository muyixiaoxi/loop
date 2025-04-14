import "./index.scss";
import { useState } from "react";

import MessageComponent from "../Components/MessageComponent";
import FriendGroupComponent from "../Components/FriendGroupComponent";
import FriendNotificationComponent from "../Components/FriendNotificationComponent";
import EditUser from "../Components/EditUser"; // 导入 EditUser 组件
import { observer } from "mobx-react-lite";
import userStore from "@/store/user";
import SideNavigation from "@/components/SideNavigation";
import FirendList from "@/components/FriendList";
import MessageList from "@/components/MessageList/idnex";
// observer 将组件变成响应式组件
const Home = observer(() => {
  const { userInfo } = userStore; // 获取 userStore 中的方法
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);

  const getComponentByIndex = () => {
    switch (selectedIconIndex) {
      case 0:
        return <MessageComponent />;
      case 1:
        return <FriendGroupComponent />;
      case 2:
        return <FriendNotificationComponent />;
      default:
        return null;
    }
  };

  return (
    <div className="main">
      <FirendList />
      {/* <MessageList /> */}
      {/* <SideNavigation /> */}
      {/* <div className="main-auto">{getComponentByIndex()}</div> */}
      {/* <div className="main-right">{showEditUser ? <EditUser /> : null}</div> */}
    </div>
  );
});

export default Home;
