import "./index.scss";
import { useState, useEffect } from "react";
import { Form, Input, Select, InputNumber, Button, message } from "antd";
// import { idsearch } from "@/api/user";
import { editUser } from "@/api/user";
import image1 from "../../../../public/avatar.jpg";
import { uploadToOSS } from "@/utils/oss";
import userStore from "@/store/user";
import { observer } from "mobx-react-lite";

// 定义用户类型
type UserType = {
  id: number;
  age: number;
  avatar: string;
  gender: number;
  nickname: string;
  signature: string;
};

// observer 装饰器将组件变为响应式组件
const EditUser = observer(() => {
  const { userInfo, setUserInfo } = userStore; // 获取用户信息

  // 使用 useState 来管理表单数据
  const [formData, setFormData] = useState<UserType>(userInfo);

  // 当 userInfo 变化时更新 formData
  useEffect(() => {
    // 监听 userInfo 的变化，并更新 formData
    setFormData(userInfo);
  }, [userInfo]);

  const handleUpload = async (file: File) => {
    // 上传图片到OSS
    if (!file) return;

    try {
      // 上传图片到OSS
      const { url } = await uploadToOSS(file);

      // 更新表单数据中的头像字段
      const updatedUserData = {
        ...formData,
        avatar: url,
      };
      const res: any = await editUser(updatedUserData);
      if (res && res.code === 1000) {
        setUserInfo(res.data); // 更新 store 中的用户信息
        message.success("头像修改成功");
      } else {
        message.error("头像修改失败");
      }
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
    // 处理表单提交事件
    const updatedUserData = {
      ...formData,
      nickname: values.nickname,
      signature: values.signature,
      gender: values.gender,
      age: values.age,
    };
    const res: any = await editUser(updatedUserData); // 调用 API 更新用户信息
    if (res && res.code === 1000) {
      setUserInfo(res.data); // 更新 store 中的用户信息
      message.success("个人信息修改成功");
    } else {
      message.error("个人信息修改失败");
    }
  };

  return (
    <div className="main1">
      <div className="title">修改个人信息</div>
      <div className="avatar1" onClick={triggerFileInput}>
        <img src={formData.avatar || image1} alt="avatar" />
        <div className="overlay">点击修改</div>
      </div>
      <Form
        name="edit_user"
        initialValues={{
          nickname: formData.nickname,
          signature: formData.signature,
          gender: formData.gender,
          age: formData.age,
        }}
        className="ddd"
        size="large"
        style={{ width: "80%", height: "50%", marginLeft: "16%" }}
        onFinish={handleSubmit}
        labelAlign="left"
        labelCol={{ span: 3 }}
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
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: "200px", height: "50px" }}
          >
            保存
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
});

export default EditUser;


