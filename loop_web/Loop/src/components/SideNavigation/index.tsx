import "./index.scss";
import { observer } from "mobx-react-lite";
import userStore from "@/store/user";
import navigationStore from "@/store/navigation";
import globalStore from "@/store/global";

import icon1 from "../../../public/message.svg";
import icon2 from "../../../public/message2.svg";
import icon3 from "../../../public/address.svg";
import icon4 from "../../../public/address2.svg";
import icon5 from "../../../public/setting.svg";
import icon6 from "../../../public/setting2.svg";

const SideNavigation = observer(() => {
  const { userInfo } = userStore;
  const { currentRoute, setCurrentRoute } = navigationStore;
  const { isShowUserAmend, setIsShowUserAmend } = globalStore;

  // 根据 currentRoute 动态设置图标状态
  const messageIcon = currentRoute === "conversation" ? icon2 : icon1;
  const addressIcon = currentRoute === "address" ? icon4 : icon3;
  const settingIcon = currentRoute === "setting" ? icon6 : icon5;

  // 处理图标点击事件
  const handleIconClick = (item: string) => {
    setCurrentRoute(item); // 更新 currentRoute
  };

  return (
    <div className="side-navigation">
      <div
        className="avatar"
        onClick={() => setIsShowUserAmend(!isShowUserAmend)}
      >
        <img src={userInfo.avatar} alt="" />
      </div>
      <div className="choice">
        <div
          className="conversation"
          onClick={() => handleIconClick("conversation")}
        >
          <img src={messageIcon} alt="Conversation" />
        </div>
        <div className="address" onClick={() => handleIconClick("address")}>
          <img src={addressIcon} alt="Address" />
        </div>
        <div className="setting" onClick={() => handleIconClick("setting")}>
          <img src={settingIcon} alt="Setting" />
        </div>
      </div>
    </div>
  );
});

export default SideNavigation;