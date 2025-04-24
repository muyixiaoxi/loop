import './index.scss'
import image1 from '../../../public/avatar.jpg'
import { Button, Checkbox, message } from 'antd'
import { useState } from 'react'
import { LeftOutlined } from '@ant-design/icons';
import { LoginPost } from "@/api/login";
import { useNavigate } from "react-router-dom";
import userStore from "@/store/user";
import saveUserToHistory from "../../utils/userHistory"; // 导入保存历史用户的函数

const Change = () => {
  const [checked, setChecked] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [showAccountManage, setShowAccountManage] = useState(false);
  const historyUsers = JSON.parse(localStorage.getItem('hisuser') || '[]');
  
  // 设置初始用户为历史记录中的第一条数据，如果没有则使用默认值
  const [currentUser, setCurrentUser] = useState(
    historyUsers.length > 0 
      ? {
          avatar: historyUsers[0].avatar || image1,
          nickname: historyUsers[0].nickname
        }
      : {
          avatar: image1,
          nickname: '山河.'
        }
  );
  const handleopen = () => {
    setShowAccountManage(!showAccountManage);
  };
  //添加账号
  const handlejump = () => {
    const navigate = useNavigate();
    navigate('/login')
  }
  const handleSelectAccount = (user: any) => {
    setCurrentUser({
      avatar: user.avatar || image1,
      nickname: user.nickname
    });
    setShowAccountManage(false);
  };

  const { setUserInfo, setToken } = userStore;
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!checked) {
      messageApi.warning('请先勾选隐私协议');
      return;
    }

    // 从历史账号中查找当前选中的账号
    const selectedUser = historyUsers.find(
      (user: any) => user.nickname === currentUser.nickname
    );

    if (!selectedUser) {
      messageApi.error('未找到账号信息');
      return;
    }

    try {
      const result: any = await LoginPost({
        phone: selectedUser.phone,
        password: selectedUser.password
      });

      if (result?.code === 1000) {
        setToken(result.data.token);
        setUserInfo(result.data.user);
        // 保存账号信息到历史记录
        saveUserToHistory({
          phone: selectedUser.phone,
          password: selectedUser.password, // 注意：实际项目中不建议存储明文密码
          avatar: result.data.user.avatar,
          nickname: result.data.user.nickname,
          timestamp: new Date().getTime()
        });
        navigate("/home");
        messageApi.success("登录成功");
      } else {
        messageApi.error(result.msg || "登录失败");
      }
    } catch (error) {
      messageApi.error("登录请求失败");
      console.error("登录错误:", error);
    }
  };

  return (
    <div className="zhanghao">
      {contextHolder}
      <div className={`content-container ${showAccountManage ? 'show-account' : 'show-profile'}`}>
        {/* 账号管理内容 */}
        <div className="account-manage">
          <div className="back-button" onClick={handleopen}>
            <LeftOutlined style={{ fontSize: '20px' }} />
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>历史账号</h2>
          <div className="account-list">
            {historyUsers.map((user: any) => (
              <div 
                key={user.phone} 
                className="account-card"
                onClick={() => handleSelectAccount(user)}
              >
                <img src={user.avatar || image1} alt="头像" className="account-avatar" />
                <div className="account-name">{user.nickname}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 原内容 */}
        <div className='profile-content'>
          <div className='usermess'>
            <div className='useravatar'>
              <img src={currentUser.avatar} />
            </div>
            <div className='username'>{currentUser.nickname}</div>
            <div className='usermanage'>
              <span 
                style={{color:'#1677ff',cursor: 'pointer'}} 
                onClick={handleopen}
              >
                账号管理
              </span>
              <span 
                style={{color:'#1677ff',cursor: 'pointer'}} 
                onClick={handlejump}
              >
               添加账号
              </span>
            </div>
          </div>
          <div className='oncelogin'>
            <Button 
              type='primary' 
              className='bt'
              onClick={handleLogin}
            >
              一键登录
            </Button>
            <Checkbox 
              className='mess'
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            >
              已阅读并同意<a> 服务协议 </a>和<a> Loop隐私保护指引</a>
            </Checkbox>
          </div>
        </div>
      </div>
    </div>  
  );
};

export default Change;