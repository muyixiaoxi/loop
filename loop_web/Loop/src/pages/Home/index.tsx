import "./index.scss";
import image1 from "../../../public/logo-2.png";
import { useState, useEffect } from "react";
import {
  MessageOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import MessageComponent from "../Components/MessageComponent";
import FriendGroupComponent from "../Components/FriendGroupComponent";
import FriendNotificationComponent from "../Components/FriendNotificationComponent";
import EditUser from "../Components/EditUser"; // 导入 EditUser 组件
import { idsearch } from "@/api/user";

const Home = () => {
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [showEditUser, setShowEditUser] = useState(false); // 控制 EditUser 组件的显示
  const [nowData, setNow] = useState({
    age: 0,
    avatar: "",
    gender: 0,
    nickname: "",
    signature: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      const userdata: string | any = localStorage.getItem("loop_userdata");
      const userid = JSON.parse(userdata).id;
      const result: any = await idsearch(userid);
      if (result && result.code === 1000) {
        setNow(result.data);
      }
    };
    fetchUser();
  }, []);

  const handleavatar = () => {
    setShowEditUser(!showEditUser);
  };

  const handleIconClick = (index: number) => {
    setSelectedIconIndex(index);
  };

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
      <div className="main-left">
        <div className="icon">
          <img src={image1} />
        </div>
        <div className="avatar" onClick={handleavatar}>
          <img src={nowData.avatar} alt="" />
          <div className="overlay"></div>
        </div>
        <div className="choice-left">
          <div
            className="message"
            style={{
              borderLeft:
                selectedIconIndex === 0
                  ? "3px solid red"
                  : "1px solid transparent",
              cursor: "pointer",
              paddingLeft: 0,
            }}
            onClick={() => handleIconClick(0)}
          >
            <MessageOutlined />
          </div>
          <div
            className="people"
            style={{
              borderLeft:
                selectedIconIndex === 1
                  ? "3px solid red"
                  : "1px solid transparent",
              cursor: "pointer",
              paddingLeft: 0,
            }}
            onClick={() => handleIconClick(1)}
          >
            <TeamOutlined />
          </div>
          <div
            className="friendmessage"
            style={{
              borderLeft:
                selectedIconIndex === 2
                  ? "3px solid red"
                  : "1px solid transparent",
              cursor: "pointer",
              paddingLeft: 0,
            }}
            onClick={() => handleIconClick(2)}
          >
            <UserSwitchOutlined />
          </div>
          <div
            className="setting"
            style={{
              borderLeft:
                selectedIconIndex === 3
                  ? "3px solid red"
                  : "1px solid transparent",
              cursor: "pointer",
              paddingLeft: 0,
            }}
            onClick={() => handleIconClick(3)}
          >
            <SettingOutlined />
          </div>
        </div>
      </div>
      <div className="main-auto">{getComponentByIndex()}</div>
      <div className="main-right">{showEditUser ? <EditUser /> : null}</div>
    </div>
  );
};

export default Home;
