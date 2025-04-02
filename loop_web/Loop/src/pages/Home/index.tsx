import "./index.scss";
import image1 from '../../../public/logo-2.png';
import image2 from '../../../public/avatar.jpg';
import { useState } from "react";
import { MessageOutlined, TeamOutlined, UserSwitchOutlined, SettingOutlined } from '@ant-design/icons';
import MessageComponent from "../Components/MessageComponent";
import FriendGroupComponent from "../Components/FriendGroupComponent";
import FriendNotificationComponent from "../Components/FriendNotificationComponent";



const Home = () => {
    // 使用 useState 来记录当前选中的图标索引
    const [selectedIconIndex, setSelectedIconIndex] = useState(0);

    // 处理图标点击事件的函数
    const handleIconClick = (index) => {
        setSelectedIconIndex(index);
    };

    // 根据选中的图标索引返回对应的组件
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
        <div className='main'>
            <div className="main-left">
                <div className="icon">
                    <img src={image1} />
                </div>
                <div className="avatar">
                    <img src={image2} alt="" />
                </div>
                <div className="choice-left">
                    {/* 第一个图标套在 div 里 */}
                    <div
                        className="message"
                        style={{
                            borderLeft: selectedIconIndex === 0 ? '3px solid red' : '1px solid transparent',
                            cursor: 'pointer',
                            paddingLeft: 0
                        }}
                        onClick={() => handleIconClick(0)}
                    >
                        <MessageOutlined />
                    </div>
                    {/* 第二个图标套在 div 里 */}
                    <div
                        className="people"
                        style={{
                            borderLeft: selectedIconIndex === 1 ? '3px solid red' : '1px solid transparent',
                            cursor: 'pointer',
                            paddingLeft: 0
                        }}
                        onClick={() => handleIconClick(1)}
                    >
                        <TeamOutlined />
                    </div>
                    {/* 第三个图标套在 div 里 */}
                    <div
                        className="friendmessage"
                        style={{
                            borderLeft: selectedIconIndex === 2 ? '3px solid red' : '1px solid transparent',
                            cursor: 'pointer',
                            paddingLeft: 0
                        }}
                        onClick={() => handleIconClick(2)}
                    >
                        <UserSwitchOutlined />
                    </div>
                    {/* 设置图标套在 div 里，放在最下方 */}
                    <div
                        className="setting"
                        style={{
                            borderLeft: selectedIconIndex === 3 ? '3px solid red' : '1px solid transparent',
                            cursor: 'pointer',
                            paddingLeft: 0
                        }}
                        onClick={() => handleIconClick(3)}
                    >
                        <SettingOutlined />
                    </div>
                </div>
            </div>
            <div className="main-auto">
          {getComponentByIndex()}
            </div>
        </div>
    );
};

export default Home;
    