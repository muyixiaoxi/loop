import { useEffect, useState, useRef } from "react";
import "./index.scss";
import MessageItem from "@/components/MessageItem";
import { getChatDB } from "@/utils/chat-db";
import userStore from "@/store/user";
import { Input, Dropdown, Modal, Form, message, Checkbox } from "antd";
import type { MenuProps } from "antd";
import { createGroup } from "@/api/group";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { getFriendList } from "@/api/friend";
import { useOSSUpload } from "../../utils/useOSSUpload"; // 引入 OSS 上传 Hook
import { observer } from "mobx-react-lite";
import chatStore from "@/store/chat";

const MessageList = observer(() => {
  const { userInfo } = userStore;
  const { currentChatList } = chatStore;
  const db = getChatDB(userInfo.id);
  const [chatList, setChatList] = useState<any[]>(currentChatList);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { avatarUrl, handleUpload } = useOSSUpload(); // 使用 OSS 上传 Hook
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [friendsList, setFriendsList] = useState<any[]>([]); // 存储好友列表
  // 新增状态，用于记录勾选成员的数量
  const [selectedMemberCount, setSelectedMemberCount] = useState(0);

  // 获取聊天列表
  const handleMessageList = async () => {
    const list = await db.getUserConversations(userInfo.id);
    setChatList(list);
  };

  const getFriendsList = async () => {
    try {
      // 使用引入的接口获取好友列表
      const friends: any = await getFriendList();
      setFriendsList(friends.data);
      console.log(friends.data, "好友列表");
    } catch (error) {
      console.error("获取好友列表失败:", error);
      message.error("获取好友列表失败，请重试");
    }
  };

  useEffect(() => {
    // 监听聊天列表变化，更新本地状态
    setChatList(currentChatList);
  }, [currentChatList]); // 确保依赖项包含 setCurrentChatList 和 chatList，以避免无限循环

  useEffect(() => {
    handleMessageList();
    getFriendsList();
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
    // 打开模态框时重置勾选成员数量
    setSelectedMemberCount(0);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await handleUpload(file);
        message.success("头像上传成功");
      } catch (error) {
        console.error("头像上传失败:", error);
        message.error("头像上传失败，请重试");
      }
    }
    // 清空输入框，以便下次选择相同文件也能触发 change 事件
    e.target.value = "";
  };

  // 监听 avatarUrl 变化，更新表单值
  useEffect(() => {
    if (avatarUrl) {
      form.setFieldsValue({
        avatar: avatarUrl,
      });
    }
  }, [avatarUrl, form]);

  const handleOk = () => {
    // 检查勾选成员数量
    if (selectedMemberCount < 2) {
      message.error("必须至少选择两人");
      return;
    }
    form
      .validateFields()
      .then(async (values) => {
        const groupData = {
          name: values.groupName,
          avatar: avatarUrl,
          describe: values.groupDescription,
          user_ids: values.groupMembers,
        };
        try {
          // 调用 createGroup 接口
          const result: any = await createGroup(groupData);
          if (result?.code === 1000) {
            message.success("创建成功");
            // 创建成功后，将新群聊信息添加到本地数据库，使用 result.data.id 作为群聊 ID
            await db.upsertConversation(userInfo.id, {
              targetId: result?.data.id,
              type: 2,
              showName: groupData.name,
              headImage: groupData.avatar,
              lastContent: "",
              unreadCount: 0,
              messages: [],
              isPinned: false,
            });
            // 刷新聊天列表
            handleMessageList();
            setIsModalVisible(false);
          } else {
            message.error("创建失败，请重试");
          }
        } catch (error) {
          console.error("调用创建群聊接口失败:", error);
          message.error("创建失败，请重试");
        }
      })
      .catch((errorInfo) => {
        console.log("表单验证失败:", errorInfo);
      });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 处理勾选成员变化的函数
  const handleMemberChange = (selectedValues: any[]) => {
    setSelectedMemberCount(selectedValues.length);
  };

  const itemFound: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <a target="_blank" rel="noopener noreferrer" onClick={showModal}>
          创建群聊
        </a>
      ),
    },
  ];
  return (
    <div className="message-list">
      <div className="message-list-content">
        <div className="message-list-search">
          <Input
            placeholder="搜索好友"
            prefix={<SearchOutlined className="search-icon" />}
            allowClear
            style={{ marginRight: 8 }}
          />
          <Dropdown menu={{ items: itemFound }} trigger={["hover"]}>
            <a onClick={(e) => e.preventDefault()}>
              <PlusOutlined style={{ fontSize: 20 }} />
            </a>
          </Dropdown>
        </div>
        <div className="message-list-item">
          {chatList.map((item: any) => (
            <MessageItem
              key={item.targetId}
              friendId={item.targetId}
              avatar={item.headImage}
              name={item.showName}
              lastContent={item.lastContent}
              lastSendTime={item.lastSendTime}
              unreadCount={item.unreadCount}
              chatType={item.type}
            />
          ))}
        </div>
      </div>
      <Modal
        title="创建群聊"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="群聊头像"
            name="avatar"
            // 添加头像必填校验规则
            rules={[{ required: true, message: "请上传群聊头像" }]}
          >
            <div
              className="custom-avatar-uploader"
              onClick={triggerFileInput}
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "10%",
                overflow: "hidden",
                border: "1px dashed #d9d9d9",
                cursor: "pointer",
                transition: "border-color 0.3s",
                position: "relative", // 添加相对定位
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="群聊头像"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : null}
              {/* 添加遮罩层 */}
              <div className="avatar-mask">
                <span>修改头像</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleFileChange}
            />
          </Form.Item>
          <Form.Item
            label="群聊名字"
            name="groupName"
            rules={[{ required: true, message: "请输入群聊名字" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="群简介"
            name="groupDescription"
            // 添加群简介必填校验规则
            rules={[{ required: true, message: "请输入群简介" }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            label="群成员"
            name="groupMembers"
            rules={[{ required: true, message: "请选择群成员" }]}
          >
            <Checkbox.Group onChange={handleMemberChange}>
              {friendsList.map((friend) => (
                <div key={friend.id}>
                  <Checkbox value={friend.id}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div>
                        {" "}
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          style={{ width: 24, height: 24, borderRadius: "50%" }}
                        />
                      </div>
                      <div style={{ marginLeft: "10px" }}>
                        {friend.nickname}
                      </div>
                    </div>
                  </Checkbox>
                </div>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

export default MessageList;
