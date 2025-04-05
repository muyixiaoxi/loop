import "./index.scss";
import { useState, useEffect } from "react";
import { Form, Input, Select, InputNumber, Button, message } from "antd";
import { idsearch } from "@/api/user";
import { editUser } from "@/api/user";
import OSS from "ali-oss";
import image1 from "../../../../public/avatar.jpg";

const EditUser = () => {
  const [userData, setData] = useState({
    age: 0,
    avatar: "",
    gender: 0,
    is_friend: false,
    nickname: "",
    signature: "",
  });
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [nowdata, setNow] = useState({
    age: 0,
    avatar: "",
    gender: 0,
    nickname: "",
    signature: "",
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false); // 控制数据是否加载完成

  // 定义类型
  type FileItem = {
    name: string;
    url: string;
  };

  // OSS 配置常量
  const OSS_CONFIG = {
    accessKeyId: import.meta.env.VITE_OSS_ACCESS_KEY_ID,
    accessKeySecret: import.meta.env.VITE_OSS_ACCESS_KEY_SECRET,
    region: import.meta.env.VITE_OSS_REGION,
    bucket: import.meta.env.VITE_OSS_BUCKET,
    endpoint: import.meta.env.VITE_OSS_ENDPOINT,
    secure: true, // 使用 HTTPS
  };

  const fetchUser = async () => {
    const userdata: string | any = localStorage.getItem("loop_userdata");
    const userid = JSON.parse(userdata)?.id;
    const result: any = await idsearch(userid);
    if (result && result.code === 1000) {
      setNow(result.data);
      setIsDataLoaded(true); // 标记数据已加载
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // 初始化 OSS 客户端
  const client = new OSS(OSS_CONFIG);

  const handleUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const result = await client.put(fileName, file);
      const fileUrl = `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.region}.aliyuncs.com/${result.name}`;

      setFiles((prev) => [...prev, { name: file.name, url: fileUrl }]);
      setPreviewUrl(fileUrl);

      // 更新 userData 的 avatar 属性
      setData((prevUserData) => ({
        ...prevUserData,
        avatar: fileUrl,
      }));

      // 使用最新的 avatar 值调用 editUser
      const updatedUserData = {
        ...nowdata,
        avatar: fileUrl,
      };
      const res: any = await editUser(updatedUserData);

      if (res && res.code === 1000) {
        message.success("头像修改成功");
        // 重新获取用户数据
        fetchUser();
      } else {
        message.error("头像修改失败");
      }
    } catch (error) {
      console.error("文件上传失败:", error);
      message.error("文件上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    e.target.value = "";
  };

  const triggerFileInput = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e: Event) =>
      handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };

  const handleSubmit = async (values: any) => {
    const updatedUserData = {
      ...nowdata,
      nickname: values.nickname,
      signature: values.signature,
      gender: values.gender,
      age: values.age,
    };
    const res: any = await editUser(updatedUserData);
    if (res && res.code === 1000) {
      message.success("个人信息修改成功");
      // 重新获取用户数据
      fetchUser();
    } else {
      message.error("个人信息修改失败");
    }
  };

  return (
    <div className="main1">
      <div className="title">修改个人信息</div>
      <div className="avatar1" onClick={triggerFileInput}>
        <img src={nowdata.avatar || image1} alt="avatar" />
        <div className="overlay">点击修改</div>
      </div>
      {isDataLoaded && ( // 只有在数据加载完成后才渲染表单
        <Form
          name="edit_user"
          initialValues={{
            nickname: nowdata.nickname,
            signature: nowdata.signature,
            gender: nowdata.gender,
            age: nowdata.age,
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
      )}
    </div>
  );
};

export default EditUser;
