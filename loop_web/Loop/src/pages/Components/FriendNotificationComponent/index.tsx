import './index.scss';
import { Input, Button } from 'antd';
import { SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { searchUser, searchNewfriend } from '@/api/user';

const FriendNotificationComponent = () => {
  const [timer, setTimer] = useState(null);
  const [searchData, setSearch] = useState({
    phone: '',
  });
  const [newFriendData, setNewFriendData] = useState([]);
  const [userData, setUser] = useState({
    code: 1000,
    msg: '',
    data: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await searchNewfriend();
        if (result && result.data) {
          setNewFriendData(result.data);
        }
        console.log(result);
      } catch (error) {
        console.error('获取新朋友数据时出错:', error);
      }
    };
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
    if (timer) {
      clearTimeout(timer);
    }
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
        {userData && userData.data && userData.data.nickname ? (
          <div className='addlist'>
            <div className='mess'>
              <div className='avatar'>
                <img src={userData.data.avatar} />
              </div>
              <div className='zhuti'>
                <div className='name'>{userData.data.nickname}</div>
                <div className='nature'>{userData.data.signature}</div>
              </div>
            </div>
            <div className='addbutt'>
              {userData.data.is_friend ? (
                <Button className='add' type='primary' disabled>添加好友</Button>
              ) : (
                <Button className='add' type='primary'>添加好友</Button>
              )}
              {userData.data.is_friend ? (
                <Button className='send' type='primary'>发消息</Button>
              ) : (
                <Button className='send' disabled>发消息</Button>
              )}
            </div>
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
  );
};

export default FriendNotificationComponent;