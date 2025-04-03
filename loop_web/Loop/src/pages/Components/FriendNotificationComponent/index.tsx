import './index.scss';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { searchUser, searchNewfriend } from '@/api/user';

const FriendNotificationComponent = () => {
    const [timer, setTimer] = useState(null);
    const [searchData, setSearch] = useState({
        phone: '',
    });

    useEffect(() => {
        // 定义一个异步函数
        const fetchData = async () => {
            try {
                const result = await searchNewfriend();
                console.log(result);
            } catch (error) {
                console.error('获取新朋友数据时出错:', error);
            }
        };
        // 调用异步函数
        fetchData();
    }, []);

    const handleInput = async (value) => {
        // 更新 searchData 中的 phone
        setSearch({ phone: value });
        console.log('输入的值为:', value);
        // 调用 searchUser 接口，直接使用输入的值
        const result = await searchUser(value);
        console.log(result);
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

    return (
        <>
            <div className="main1">
                <div className='header'>
                    <div className='search'>
                        <Input
                            size="large"
                            placeholder="请输入手机号或昵称"
                            prefix={<SearchOutlined />}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className='list'>
                    {/* 这里可以根据 searchData 渲染列表 */}
                    {searchData.phone && <p>当前搜索的手机号: {searchData.phone}</p>}
                </div>
            </div>
        </>
    );
};

export default FriendNotificationComponent;
    