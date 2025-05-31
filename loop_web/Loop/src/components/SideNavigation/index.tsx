import "./index.scss";
import { observer } from "mobx-react-lite";
import { WebSocketContext } from "@/pages/Home";
import { useContext } from "react";
import userStore from "@/store/user";
import globalStore from "@/store/global";
import icon1 from "../../../public/message.svg";
import icon2 from "../../../public/message2.svg";
import icon3 from "../../../public/address.svg";
import icon4 from "../../../public/address2.svg";
import { Popover, Button } from "antd";
import { SettingFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const SideNavigation = observer(() => {
  const { userInfo } = userStore;
  const { isShowUserAmend, setIsShowUserAmend, currentRoute, setCurrentRoute } =
    globalStore;
  const navigate = useNavigate();

  const messageIcon = currentRoute === "conversation" ? icon2 : icon1;
  const addressIcon = currentRoute === "friend" ? icon4 : icon3;

  const { disconnect } = useContext(WebSocketContext); // 获取WebSocket断开方法

  const handleIconClick = (item: string) => {
    setCurrentRoute(item);
  };

  const logoutContent = (
    <div>
      <Button
        onClick={() => {
          // 清除本地存储
          localStorage.removeItem("userdata");
          localStorage.removeItem("loopUserStore");
          // 断开WebSocket连接
          disconnect?.();
          // 使用 replace 选项重定向到登录页面
          navigate("/change", { replace: true });
        }}
      >
        退出登录
      </Button>
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
        <div>
          <div
            className="conversation"
            onClick={() => handleIconClick("conversation")}
          >
            <img src={messageIcon} alt="Conversation" />
          </div>
          <div className="friend" onClick={() => handleIconClick("friend")}>
            <img src={addressIcon} alt="Address" />
          </div>
        </div>
        <div>
          <Popover placement="right" content={logoutContent}>
            <div className="setting">
              <SettingFilled style={{ fontSize: "32px", color: "#8a8a8a" }} /> 
            </div>
          </Popover>
        </div>
      </div>
    </div>
  );
});

export default SideNavigation;
