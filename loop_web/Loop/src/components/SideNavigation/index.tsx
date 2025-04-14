import "./index.scss";
import { useState } from "react";
import userStore from "@/store/user";
import navigationStore from "@/store/navigation";
import { observer } from "mobx-react-lite";

import {
  MessageOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  SettingOutlined,
} from "@ant-design/icons";

const SideNavigation = observer(() => {
  const { userInfo } = userStore;
  const { currentRoute, setCurrentRoute } = navigationStore;
  const [showEditUser, setShowEditUser] = useState(false);

  // 处理图标点击事件
  const handleIconClick = (item: string) => {
    setCurrentRoute(item);
  };

  return (
    <div className="side-navigation">
      <div className="avatar" onClick={() => setShowEditUser(!showEditUser)}>
        <img src={userInfo.avatar} alt="" />
      </div>
      <div className="choice">
        <div
          className="conversation"
          onClick={() => handleIconClick("conversation")}
        >
          <MessageOutlined />
        </div>
        {/* <div className="people" onClick={() => handleIconClick("team")}>
          <TeamOutlined />
        </div> */}
        <div className="address" onClick={() => handleIconClick("address")}>
          <UserSwitchOutlined />
        </div>
        <div className="setting" onClick={() => handleIconClick("setting")}>
          <SettingOutlined />
        </div>
      </div>
    </div>
  );
});

export default SideNavigation;
