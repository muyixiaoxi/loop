import './index.scss'
import { Input,Button } from 'antd';
import { SearchOutlined,PlusOutlined  } from '@ant-design/icons';
const MessageComponent = () => { 
  return (
    <>
      <div className="main1">
        <div className='header'>
          <div className='search'>
          <Input size="large" placeholder="请输入手机号或昵称" prefix={<SearchOutlined />} />
          </div>
          <div className='add'>
            <Button className='add-button' type="primary" shape="circle" icon={<PlusOutlined />} danger />
          </div>
        </div>
        <div className='list1'>
          123
        </div>
      </div>
    </>
   
  )
}
export default MessageComponent;