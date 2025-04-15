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

const SideNavigation = observer(() => {
  const { userInfo } = userStore;
  const { currentRoute, setCurrentRoute } = navigationStore;
  const { isShowUserAmend, setIsShowUserAmend } = globalStore;

  // 根据 currentRoute 动态设置图标状态
  const messageIcon = currentRoute === "conversation" ? icon2 : icon1;
  const addressIcon = currentRoute === "address" ? icon4 : icon3;
  const settingIcon = icon5; // setting 图标固定为 icon5，不参与切换

  // 处理图标点击事件
  const handleIconClick = (item: string) => {
    if (item === "setting") {
      // 执行与 setting 相关的操作，例如打开设置页面
      console.log("Setting clicked");
      // 可以在这里调用一个函数来处理设置逻辑
    } else {
      // 更新 currentRoute
      setCurrentRoute(item);
    }
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