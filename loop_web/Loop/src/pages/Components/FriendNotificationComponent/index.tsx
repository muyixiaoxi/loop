import "./index.scss";
import { Input, Button } from "antd";
import { SearchOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { searchUser } from "@/api/user";
import { postAddFriend } from "@/api/friend";

type searchType = {
  id: number;
  age: number;
  avatar: string;
  gender: number;
  nickname: string;
  signature: string;
  is_friend: boolean;
};

const FriendNotificationComponent = () => {
  // 获取搜索数据
  const [searchData, setSearchData] = useState<searchType>();

  const [timer, setTimer] = useState(null);

  // 搜索用户
  const handleInput = async (value: any) => {
    // setSearch({ phone: value });
    console.log("输入的值为:", value);
    const result: any = await searchUser(value);
    console.log("searchUser 接口返回结果:", result);
    if (result && result.data) {
      setSearchData(result.data);
    } else {
      console.log("接口返回的数据不符合预期:", result);
    }
  };

  // 添加好友
  const addFriend = async (id: number) => {
    console.log("id:", id);
    const params: any = { friend_id: id, message: "我是你的好友" };

    const result: any = await postAddFriend(params);
  };

  // 防抖函数，防止频繁请求接口
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (timer) {
      clearTimeout(timer);
    }
    const newTimer: any = setTimeout(() => {
      handleInput(value);
    }, 1000);
    setTimer(newTimer);
  };

  return (
    <div className="main1">
      <div className="header">
        <div className="search">
          <Input
            size="large"
            placeholder="请输入手机号添加好友"
            prefix={<SearchOutlined />}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="list">
        {searchData && searchData.nickname ? (
          <div className="addlist">
            <div className="mess">
              <div className="avatar">
                <img src={searchData.avatar} />
              </div>
              <div className="zhuti">
                <div className="name">{searchData.nickname}</div>
                <div className="nature">{searchData.signature}</div>
              </div>
            </div>
            <div className="addbutt">
              {searchData.is_friend ? (
                <Button className="add" type="primary" disabled>
                  添加好友
                </Button>
              ) : (
                <Button
                  className="add"
                  type="primary"
                  onClick={() => addFriend(searchData.id)}
                >
                  添加好友
                </Button>
              )}
              {searchData.is_friend ? (
                <Button className="send" type="primary">
                  发消息
                </Button>
              ) : (
                <Button className="send" disabled>
                  发消息
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="nomessage">
            <div className="icon">
              <ExclamationCircleOutlined />
            </div>
            <div className="iconmessage">暂无好友通知</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendNotificationComponent;
