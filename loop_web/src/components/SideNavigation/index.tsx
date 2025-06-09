import "./index.scss";
import { observer } from "mobx-react-lite";
import { WebSocketContext } from "@/pages/Home";
import { useContext } from "react";
import userStore from "@/store/user";
import globalStore from "@/store/global";
import { Popover, Button } from "antd";
import { useNavigate } from "react-router-dom";

const SideNavigation = observer(() => {
  const { userInfo } = userStore;
  const { isShowUserAmend, setIsShowUserAmend, currentRoute, setCurrentRoute } =
    globalStore;
  const navigate = useNavigate();

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
    <div className="navi-bar">
      <div className="top">
        <div
          className="user-head-image"
          onClick={() => setIsShowUserAmend(!isShowUserAmend)}
        >
          <img src={userInfo.avatar} alt="" />
        </div>

        <div className="menu">
          {/* 会话记录 */}
          <div className="menu-item" onClick={() => handleIconClick("chat")}>
            <span className="icon iconfont icon-chat"></span>
          </div>
          {/* 好友 */}
          <div className="menu-item" onClick={() => handleIconClick("friend")}>
            <span className="icon iconfont icon-friend"></span>
          </div>
          {/* 群聊 */}
          <div className="menu-item" onClick={() => handleIconClick("group")}>
            <span className="icon iconfont icon-group"></span>
          </div>
        </div>
      </div>

      <div className="bottom">
        <Popover placement="right" content={logoutContent}>
          <div className="bottom-item">
            <span className="icon iconfont icon-exit"></span>
          </div>
        </Popover>
      </div>
    </div>
  );
});

export default SideNavigation;
