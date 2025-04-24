import "./index.scss";
import { useState, useEffect } from "react";
import { Form, Input, Select, InputNumber, Button, message } from "antd";
import { editUser } from "@/api/user";
import { uploadToOSS } from "@/utils/oss";
import userStore from "@/store/user";
import { observer } from "mobx-react-lite";

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

  // 使用 useState 来管理表单数据
  const [formData, setFormData] = useState<UserType>(userInfo);

  // 当 userInfo 变化时更新 formData
  useEffect(() => {
    setFormData(userInfo);
  }, [userInfo]);

  const handleUpload = async (file: File) => {
    if (!file) return;

    try {
      // 上传图片到OSS
      const { url } = await uploadToOSS(file);
      
      // 只更新本地状态，不调用接口
      setFormData(prev => ({
        ...prev,
        avatar: url
      }));
      message.success("头像上传成功，请点击保存以更新信息");
    } catch (error) {
      console.error("文件上传失败:", error);
      message.error("文件上传失败");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 处理文件选择事件
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    e.target.value = "";
  };

  // 触发文件输入框的点击事件，以打开文件选择对话框
  const triggerFileInput = () => {
    const input = document.createElement("input");
    input.type = "file";
    // 设置文件选择对话框的过滤条件，只允许选择图片文件
    input.accept = "image/*";
    input.onchange = (e: Event) =>
      handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };

  const handleSubmit = async (values: any) => {
    // 使用最新的 formData 中的 avatar
    const updatedUserData = {
      avatar: formData.avatar,
      nickname: values.nickname,
      signature: values.signature,
      gender: values.gender,
      age: values.age,
    };

    try {
      const res: any = await editUser(updatedUserData);
      if (res && res.code === 1000) {
        setUserInfo(res.data);
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
        <img src={formData?.avatar} alt="" />
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
