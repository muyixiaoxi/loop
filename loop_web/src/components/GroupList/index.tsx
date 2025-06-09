import "./index.scss";
import { useEffect, useState, useRef, useCallback } from "react";
import { Form, Modal, Input, message, Checkbox } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { getFirstLetter } from "@/utils/pinyin";
import { createGroup, getGroupList } from "@/api/group";
import { getFriendList } from "@/api/friend";
import userStore from "@/store/user";
import ChatStore from "@/store/chat";
import { getChatDB } from "@/utils/chat-db";
import { useOSSUpload } from "../../utils/useOSSUpload";
import { debounce } from "@/utils";

const GroupList = observer(() => {
  // 状态管理
  const [form] = Form.useForm();
  const { userInfo } = userStore;
  const db = getChatDB(userInfo.id);
  const { setCurrentFriendData, setCurrentMessages, setCurrentChatInfo } =
    ChatStore;

  // 组件状态
  const [groupList, setGroupList] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMemberCount, setSelectedMemberCount] = useState(0);
  const [friendsList, setFriendsList] = useState<any[]>([]);

  // 文件上传相关
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { avatarUrl, handleUpload } = useOSSUpload();

  // ========== 数据获取方法 ==========

  /** 获取群聊列表数据 */
  const getGroupListData = async () => {
    try {
      const res: any = await getGroupList();
      setGroupList(res.data);
    } catch (error) {
      console.error("获取群聊列表出错:", error);
    }
  };

  /** 获取好友列表数据 */
  const getFriendsList = async () => {
    try {
      const friends: any = await getFriendList();
      setFriendsList(friends.data);
    } catch (error) {
      console.error("获取好友列表出错:", error);
      message.error("获取好友列表失败，请重试");
    }
  };

  // ========== 群聊列表处理方法 ==========

  /**
   * 处理搜索输入变化（带防抖）
   */
  const handleSearchChange = useCallback(
    debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchKeyword(e.target.value.trim().toLowerCase());
    }, 500),
    []
  );

  /** 处理新建会话 */
  const handleNewConversation = async (data: any) => {
    const params = {
      id: data.id,
      nickname: data.name,
      avatar: data.avatar,
    };
    setCurrentFriendData(params);

    const res: any = await db.getConversation(userInfo.id, data.id, 2);
    setCurrentMessages(res?.messages);
    setCurrentChatInfo({ type: 2 });
  };

  /** 获取排序后的群聊列表 */
  const getSortedGroupList = useCallback(() => {
    if (!groupList || groupList.length === 0) return [];

    const groupedGroups = new Map<string, any[]>();
    groupList.forEach((group: any) => {
      if (!group?.name) return;

      const firstLetter = getFirstLetter(group.name);
      groupedGroups.set(firstLetter, [
        ...(groupedGroups.get(firstLetter) || []),
        group,
      ]);
    });
    return Array.from(groupedGroups.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [groupList]);

  /** 获取筛选后的群聊列表 */
  const getFilteredGroupList = useCallback(() => {
    if (!groupList || groupList.length === 0) return [];

    if (!searchKeyword?.trim()) return getSortedGroupList();

    const lowerKeyword = searchKeyword.toLowerCase();
    const filteredGroups = groupList.filter((group: any) => {
      if (!group?.name) return false;

      const groupName = group.name.toLowerCase();
      const firstLetter = getFirstLetter(group.name).toLowerCase();
      return (
        groupName.includes(lowerKeyword) || firstLetter.includes(lowerKeyword)
      );
    });

    const groupedGroups = new Map<string, any[]>();
    filteredGroups.forEach((group: any) => {
      const firstLetter = getFirstLetter(group.name);
      groupedGroups.set(firstLetter, [
        ...(groupedGroups.get(firstLetter) || []),
        group,
      ]);
    });

    return Array.from(groupedGroups.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [groupList, searchKeyword, getSortedGroupList]);

  // ========== 创建群聊相关方法 ==========

  /** 显示创建群聊模态框 */
  const showModal = () => {
    getFriendsList();
    setIsModalVisible(true);
    form.resetFields();
    setSelectedMemberCount(0);
  };

  /** 处理创建群聊提交 */
  const handleOk = () => {
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
          const result: any = await createGroup(groupData);
          if (result?.code === 1000) {
            message.success("创建成功");
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
            // 更新群聊
            getGroupListData();
            setIsModalVisible(false);
          } else {
            message.error("创建失败，请重试");
          }
        } catch (error) {
          console.error("调用创建群聊接口失败:", error);
          message.error("创建失败，请重试");
        }
      })
      .catch(console.error);
  };

  /** 取消创建群聊 */
  const handleCancel = () => setIsModalVisible(false);

  // ========== 头像上传相关方法 ==========

  const triggerFileInput = () => fileInputRef.current?.click();

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
    e.target.value = "";
  };

  // ========== 副作用钩子 ==========
  useEffect(() => {
    getGroupListData();
  }, []);

  useEffect(() => {
    if (avatarUrl) {
      form.setFieldsValue({ avatar: avatarUrl });
    }
  }, [avatarUrl, form]);

  // ========== 渲染部分 ==========

  return (
    <div className="group-page">
      {/* 搜索栏 */}
      <div className="header">
        <Input
          placeholder="搜索群聊"
          prefix={<SearchOutlined className="search-icon" />}
          allowClear
          onChange={handleSearchChange}
        />
        <PlusOutlined
          style={{ fontSize: 20, marginLeft: 10 }}
          onClick={() => showModal()}
        />
      </div>

      {/* 群聊列表 */}
      <div className="group-list">
        {getFilteredGroupList().map(([letter, groups]) => (
          <div className="group-section" key={letter}>
            <div className="section-header">{letter}</div>
            {groups.map((item: any) => (
              <div
                key={item.id}
                className="group-item"
                onClick={() => handleNewConversation(item)}
              >
                <div className="group-item-avatar">
                  <img src={item.avatar} alt="群头像" />
                </div>
                <div className="group-item-info">
                  {item.name}
                  <div className="group-item-desc">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 创建群聊模态框 */}
      <Modal
        title="创建群聊"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={`创建${selectedMemberCount}`}
        cancelText="取消"
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          {/* 头像上传 */}
          <Form.Item
            label="群聊头像"
            name="avatar"
            rules={[{ required: true, message: "请上传群聊头像" }]}
          >
            <div className="custom-avatar-uploader" onClick={triggerFileInput}>
              {avatarUrl && <img src={avatarUrl} alt="群聊头像" />}
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

          {/* 群聊名称 */}
          <Form.Item
            label="群聊名字"
            name="groupName"
            rules={[
              {
                validator: (_, value) =>
                  value?.trim()
                    ? Promise.resolve()
                    : Promise.reject(new Error("群聊名字不能为空")),
              },
            ]}
          >
            <Input showCount maxLength={16} />
          </Form.Item>

          {/* 群简介 */}
          <Form.Item
            label="群简介"
            name="groupDescription"
            rules={[
              {
                validator: (_, value) =>
                  value?.trim()
                    ? Promise.resolve()
                    : Promise.reject(new Error("群简介不能为空")),
              },
            ]}
          >
            <Input.TextArea
              style={{ height: 80, resize: "none" }}
              autoSize={{ minRows: 3, maxRows: 5 }}
              showCount
              maxLength={100}
            />
          </Form.Item>

          {/* 群成员选择 */}
          <Form.Item
            label="群成员"
            name="groupMembers"
            rules={[{ required: true, message: "请选择群成员" }]}
          >
            <Checkbox.Group
              onChange={(values) => setSelectedMemberCount(values.length)}
            >
              {friendsList.map((friend) => (
                <div key={friend.id}>
                  <Checkbox value={friend.id}>
                    <div className="member-item">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="member-avatar"
                      />
                      <span className="member-name">{friend.nickname}</span>
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

export default GroupList;
