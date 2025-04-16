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
import { Popover, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const SideNavigation = observer(() => {
  const { userInfo } = userStore;
  const { currentRoute, setCurrentRoute } = navigationStore;
  const { isShowUserAmend, setIsShowUserAmend } = globalStore;
  const navigate = useNavigate();

  const messageIcon = currentRoute === "conversation" ? icon2 : icon1;
  const addressIcon = currentRoute === "friend" ? icon4 : icon3;
  const settingIcon = icon5;

  const handleIconClick = (item: string) => {
    if (item === "setting") {
      console.log("Setting clicked");
    } else {
      setCurrentRoute(item);
    }
  };

  const logoutContent = (
    <div>
      <Button onClick={() => {
        // 清除本地存储
        localStorage.removeItem('userdata');
        localStorage.removeItem('loopUserStore');
        // 使用 replace 选项重定向到登录页面
        navigate('/login', { replace: true }); 
      }}>退出登录</Button>
    </div>
  );

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
        <div className="friend" onClick={() => handleIconClick("friend")}>
          <img src={addressIcon} alt="Address" />
        </div>
        <Popover
          placement="right"
          content={logoutContent}
        >
          <div className="setting" onClick={() => console.log("设置")}>
            <img src={settingIcon} alt="Setting" />
          </div>
        </Popover>
      </div>
    </div>
  );
});

export default SideNavigation;
