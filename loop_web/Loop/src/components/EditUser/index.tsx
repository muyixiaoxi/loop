import "./index.scss";
import { useState, useEffect } from "react";
import { Form, Input, Select, InputNumber, Button, message } from "antd";
import { editUser } from "@/api/user";
import userStore from "@/store/user";
import { observer } from "mobx-react-lite";
import { useOSSUpload } from "../../utils/useOSSUpload";
import saveUserToHistory from "@/utils/userHistory"; // 导入保存历史用户的函数

// 定义用户类型
type UserType = {
  age: number;
  avatar: string;
  gender: number;
  nickname: string;
  signature: string;
};

// observer 装饰器将组件变为响应式组件
const EditUser = observer(() => {
  const { userInfo, setUserInfo } = userStore;
  const [formData, setFormData] = useState<UserType>(userInfo);
  const { avatarUrl, handleUpload } = useOSSUpload();
  const historyUsers = JSON.parse(localStorage.getItem("hisuser") || "[]"); // 从本地存储中获取历史用户

  // 根据当前用户ID从历史用户中查找对应账号
  const selectedUser = historyUsers.find(
    (user: any) => user.id === userInfo.id
  );

  // 当 userInfo 变化时更新 formData
  useEffect(() => {
    setFormData(userInfo);
  }, [userInfo]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await handleUpload(file);
      if (url) {
        setFormData((prev) => ({
          ...prev,
          avatar: url,
        }));
      }
    }
    e.target.value = "";
  };

  const triggerFileInput = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: Event) =>
      handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };

  const handleSubmit = async (values: any) => {
    const updatedUserData = {
      avatar: avatarUrl || formData.avatar,
      nickname: values.nickname,
      signature: values.signature,
      gender: values.gender,
      age: values.age,
    };

    try {
      const { data, code }: any = await editUser(updatedUserData);
      if (code === 1000) {
        setUserInfo(data);
        // 保存账号信息到历史记录
        saveUserToHistory({
          id: data.id,
          phone: selectedUser.phone,
          password: selectedUser.password, // 注意：实际项目中不建议存储明文密码
          avatar: data.avatar,
          nickname: data.nickname,
          timestamp: new Date().getTime(),
        });
        message.success("个人信息修改成功");
      } else {
        message.error("个人信息修改失败");
      }
    } catch (error) {
      console.error("更新用户信息失败:", error);
      message.error("更新用户信息失败");
    }
  };

  return (
    <div className="edit-user-container">
      <div className="avatar1" onClick={triggerFileInput}>
        <img src={avatarUrl || formData?.avatar} alt="" />
        <div className="overlay">点击修改</div>
      </div>
      <Form
        name="edit_user"
        initialValues={{
          nickname: formData?.nickname,
          signature: formData?.signature,
          gender: formData?.gender || 0,
          age: formData?.age || 18,
        }}
        size="large"
        style={{ width: "80%", height: "50%", marginLeft: "16%" }}
        onFinish={handleSubmit}
        labelAlign="left"
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 14 }}
      >
        <Form.Item
          name="nickname"
          label="昵称"
          rules={[{ required: true, message: "请输入昵称" }]}
          style={{ height: "30px" }}
          className="formtitle"
        >
          <Input placeholder="请输入昵称" />
        </Form.Item>
        <Form.Item
          name="signature"
          label="个性签名"
          rules={[{ required: true, message: "请输入个性签名" }]}
          style={{ height: "30px" }}
          className="formtitle"
        >
          <Input placeholder="请输入个性签名" />
        </Form.Item>
        <Form.Item
          name="gender"
          label="性别"
          rules={[{ required: true, message: "请选择性别" }]}
          style={{ height: "30px" }}
          className="formtitle"
        >
          <Select placeholder="请选择性别">
            <Select.Option value={0}>男性</Select.Option>
            <Select.Option value={1}>女性</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="age"
          label="年龄"
          rules={[{ required: true, message: "请输入年龄" }]}
          style={{ height: "30px" }}
          className="formtitle"
        >
          <InputNumber min={1} max={100} placeholder="请输入年龄" />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" className="submitbutton">
            保存
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
});

export default EditUser;
