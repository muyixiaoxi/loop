import './index.scss';
import { Input } from 'antd';
import { SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useState, useEffect } from'react';
import { searchUser, searchNewfriend } from '@/api/user';

const FriendNotificationComponent = () => {
    const [timer, setTimer] = useState(null);
    const [searchData, setSearch] = useState({
        phone: '',
    });
    // 新增状态，用于存储接口返回的数据
    const [newFriendData, setNewFriendData] = useState([]);
    // 搜索的用户存储
    const [userData, setUser] = useState({
        code: 1000,
        msg: '',
      data: {}
    });

    useEffect(() => {
        // 定义一个异步函数
        const fetchData = async () => {
            try {
                const result = await searchNewfriend();
                // 假设接口返回的数据结构中有 data 数组
                if (result && result.data) {
                    setNewFriendData(result.data);
                }
                console.log(result);
            } catch (error) {
                console.error('获取新朋友数据时出错:', error);
            }
        };
        // 调用异步函数
        fetchData();
    }, []);

    const handleInput = async (value) => {
        setSearch({ phone: value });
        console.log('输入的值为:', value);
        const result = await searchUser(value);
        console.log('searchUser 接口返回结果:', result);
        if (result && result.data) { 
            setUser((prevUserData) => ({
               ...prevUserData,
                data: result.data
            }));
        } else {
            console.log('接口返回的数据不符合预期:', result);
        }
    };

    const handleChange = (e) => {
        const value = e.target.value;
        // 清除之前的定时器
        if (timer) {
            clearTimeout(timer);
        }
        // 设置新的定时器
        const newTimer = setTimeout(() => {
            handleInput(value);
        }, 1000);
        setTimer(newTimer);
    };

    useEffect(() => {
        if (userData && userData.data && userData.data.nickname) {
            console.log('userData has been updated and has data');
        }
    }, [userData]);

    return (
        <>
            <div className="main1">
                <div className='header'>
                    <div className='search'>
                        <Input
                            size="large"
                            placeholder="请输入手机号添加好友"
                            prefix={<SearchOutlined />}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className='list'>
                    {userData && userData.data && userData.data.nickname? (
                        <div className='addlist'>
                <div className='avatar'>
                  <img src={ userData.data.avatar}  />
                </div>
                <div className='name'>{userData.data.nickname }</div>
                      </div>
                    ) : (
                        <div className='nomessage'>
                            <div className='icon'>
                                <ExclamationCircleOutlined />
                            </div>
                            <div className='iconmessage'>
                                暂无好友通知
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FriendNotificationComponent;