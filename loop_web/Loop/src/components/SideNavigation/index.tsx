import "./index.scss";
import { useState } from "react";
import userStore from "@/store/user";
import navigationStore from "@/store/navigation";
import { observer } from "mobx-react-lite";

import icon1 from '../../../public/message.svg'
import icon2 from '../../../public/message2.svg'
import icon3 from '../../../public/address.svg'
import icon4 from '../../../public/address2.svg'
import icon5 from '../../../public/setting.svg'
import icon6 from '../../../public/setting2.svg'

const SideNavigation = observer(() => {
  const { userInfo } = userStore;
  const { currentRoute, setCurrentRoute } = navigationStore;
  const [showEditUser, setShowEditUser] = useState(false);

  // 状态，用于控制每个图标的切换
  const [messageIcon, setMessageIcon] = useState(icon1);
  const [addressIcon, setAddressIcon] = useState(icon3);
  const [settingIcon, setSettingIcon] = useState(icon5);

  // 处理图标点击事件
  const handleIconClick = (item: string) => {
    setCurrentRoute(item)
    console.log(item);

    // 重置所有图标状态为初始状态
    setMessageIcon(icon1);
    setAddressIcon(icon3);
    setSettingIcon(icon5);

    // 根据点击的图标切换对应的图标状态
    if (item === "conversation") {
      setMessageIcon(messageIcon === icon1 ? icon2 : icon1);
    } else if (item === "address") {
      setAddressIcon(addressIcon === icon3 ? icon4 : icon3);
    } else if (item === "setting") {
      setSettingIcon(settingIcon === icon5 ? icon6 : icon5);
    }
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
          <img src={messageIcon} alt="" />
        </div>
        <div className="address" onClick={() => handleIconClick("address")}>
          <img src={addressIcon} alt="" />
        </div>
        <div className="setting" onClick={() => handleIconClick("setting")}>
          <img src={settingIcon} alt="" />
        </div>
      </div>
    </div>
  );
});

export default SideNavigation;