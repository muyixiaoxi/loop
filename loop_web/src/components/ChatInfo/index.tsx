/**
 * 聊天信息组件 - 显示和管理聊天相关信息
 * 包括群聊信息和好友信息
 */
import "./index.scss";
import { useState, useEffect } from "react";
import {
  Switch,
  Button,
  Modal,
  Input,
  Checkbox,
  Popconfirm,
  message,
} from "antd";
import {
  UsergroupAddOutlined,
  UsergroupDeleteOutlined,
  ArrowLeftOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import {
  getGroupMemberList,
  getGroupInfo,
  getNotInGroupUserList,
  addGroupMember,
  disbandGroup,
  quitGroup,
  deleteGroupMember,
  getLowerLevelMembers,
  transferGrupOwner,
  addGroupAdmins,
  deleteGroupAdmin,
  updateGroupInfo,
} from "@/api/group";
import { deleteFriend } from "@/api/friend";
import chatStore from "@/store/chat";
import userStore from "@/store/user";
import { getFirstLetter } from "@/utils/pinyin";
import { idsearch } from "@/api/user";
import { getChatDB } from "@/utils/chat-db";
import { useOSSUpload } from "@/utils/useOSSUpload";

// 组件属性类型定义
interface ChatInfoProps {
  friendId: number; // 好友或群聊ID
  chatType?: number; // 聊天类型：1-好友 2-群聊
  refreshConversation: () => void; // 刷新会话列表的回调
  openDrawer: boolean; // 抽屉是否打开
  setOpenDrawer: (open: boolean) => void; // 设置抽屉状态的函数
}

// 成员信息类型
interface Member {
  user_id: number;
  nickname: string;
  avatar: string;
  role: number; // 角色：1-普通成员 2-管理员 3-群主
  [key: string]: any;
}

/**
 * 聊天信息主组件
 */
const ChatInfo = (props: ChatInfoProps) => {
  // 从props和store中解构所需数据
  const { friendId, refreshConversation, openDrawer, setOpenDrawer } = props;
  const { currentChatInfo, setCurrentFriendData, setCurrentChatList } =
    chatStore;
  const chatType = currentChatInfo.type;
  const { userInfo } = userStore;
  const db = getChatDB(userInfo.id); // 获取数据库连接
  const { handleUpload } = useOSSUpload(); // 上传图片到OSS

  // UI状态管理
  const [showMemberDrawer, setShowMemberDrawer] = useState(false); // 成员抽屉显示状态
  const [showManagerDrawer, setShowManagerDrawer] = useState(false); // 管理抽屉显示状态
  const [showTransferDrawer, setShowTransferDrawer] = useState(false); // 转让群主抽屉
  const [showAddAdminDrawer, setShowAddAdminDrawer] = useState(false); // 添加管理员抽屉
  const [isModalOpen, setIsModalOpen] = useState(false); // 添加成员弹窗状态
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false); // 转让群主确认弹窗
  const [showEditGroupDrawer, setShowEditGroupDrawer] = useState(false); // 编辑群信息抽屉

  // 数据状态
  const [groupMemberList, setGroupMemberList] = useState<Member[]>([]); // 群成员列表
  const [groupInfo, setGroupInfo] = useState<any>({}); // 群信息
  const [friendInfo, setFriendInfo] = useState<any>({}); // 好友信息
  const [notInGroupUserList, setNotInGroupUserList] = useState<any[]>([]); // 不在群中的用户列表
  const [lowerLevelMembers, setLowerLevelMembers] = useState<Member[]>([]); // 等级比自己低的成员
  const [editGroupInfo, setEditGroupInfo] = useState({
    name: "",
    avatar: "",
    describe: "",
  }); // 编辑群信息

  // 选择状态
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]); // 选中的用户(添加成员)
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]); // 选中的成员(删除/设置管理员)
  const [transferUserId, setTransferUserId] = useState<number>(0); // 要转让群主的用户ID

  // 操作模式
  const [isDeleteMode, setIsDeleteMode] = useState(false); // 是否处于删除模式
  const [topSwitch, setTopSwitch] = useState(false); // 置顶开关状态
  const [searchInput, setSearchInput] = useState(""); // 搜索框内容

  /**
   * 判断当前用户是否是群主或管理员
   */
  const isGroupOwnerOrAdmin = () => {
    return (
      userInfo?.id === groupInfo?.owner_id ||
      groupInfo?.admin_ids?.includes(userInfo?.id)
    );
  };
  // ===================== 数据获取方法 =====================

  /**
   * 获取并设置群成员列表
   */
  const handleGroupMemberList = async () => {
    try {
      const res: any = await getGroupMemberList(friendId);
      setGroupMemberList(res.data);
    } catch (error) {
      console.error("获取群成员列表失败:", error);
    }
  };

  /**
   * 获取并设置群信息
   */
  const handleGroupInfo = async () => {
    try {
      const res: any = await getGroupInfo(friendId);

      setGroupInfo(res.data);
    } catch (error) {
      console.error("获取群信息失败:", error);
    }
  };

  /**
   * 获取等级比自己低的成员列表(用于删除成员)
   */
  const handleLowerLevelMembers = async () => {
    try {
      const { data }: any = await getLowerLevelMembers(friendId);
      setLowerLevelMembers(data);
    } catch (error) {
      console.error("获取低等级成员失败:", error);
    }
  };

  // ===================== 成员操作方法 =====================

  /**
   * 处理成员选择
   * @param memberId 成员ID
   * @param checked 是否选中
   */
  const handleSelectMember = (memberId: number, checked: boolean) => {
    setSelectedMembers((prev) =>
      checked ? [...prev, memberId] : prev.filter((id) => id !== memberId)
    );
  };

  /**
   * 处理用户选择(添加成员)
   * @param userId 用户ID
   * @param checked 是否选中
   */
  const handleSelectUser = (userId: number, checked: boolean) => {
    setSelectedUsers((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };

  /**
   * 删除选中的成员
   */
  const handleDeleteMembers = async () => {
    try {
      await deleteGroupMember(friendId, selectedMembers);
      setSelectedMembers([]);
      setIsDeleteMode(false);
      setShowMemberDrawer(false);
      await handleGroupMemberList(); // 刷新成员列表
    } catch (error) {
      console.error("删除成员失败:", error);
    }
  };

  /**
   * 获取不在群聊中的好友
   */
  const handleAddMember = async () => {
    // 调用添加成员的逻辑，例如弹出对话框或发起添加成员的请求
    const res: any = await getNotInGroupUserList(friendId);
    setNotInGroupUserList(res.data);
    setIsModalOpen(true);
  };

  /**
   * 添加群成员
   */
  const handleAddGroupMember = async () => {
    try {
      await addGroupMember(friendId, selectedUsers);
      setIsModalOpen(false);
      setSelectedUsers([]);
      await handleGroupMemberList(); // 刷新成员列表
    } catch (error) {
      console.error("添加成员失败:", error);
    }
  };

  // ===================== 管理操作方法 =====================

  /**
   * 设置管理员
   * @param admins 管理员ID数组
   */
  const handleSetAdmin = async (admins: number[]) => {
    try {
      await addGroupAdmins(friendId, admins);
      setSelectedMembers([]);
      setShowAddAdminDrawer(false);
      await handleGroupMemberList(); // 刷新成员列表
    } catch (error) {
      console.error("设置管理员失败:", error);
    }
  };

  /**
   * 删除管理员
   * @param admin 管理员ID
   */
  const handleDeleteAdmin = async (admin: number) => {
    try {
      await deleteGroupAdmin(friendId, admin);
      await handleGroupMemberList(); // 刷新成员列表
    } catch (error) {
      console.error("删除管理员失败:", error);
    }
  };

  /**
   * 转让群主
   * @param userId 新群主ID
   */
  const handleTransferOwner = async (userId: number) => {
    try {
      await transferGrupOwner(friendId, userId);
      await handleGroupMemberList(); // 刷新成员列表
      await handleGroupInfo(); // 刷新群信息
      setIsTransferModalOpen(false);
      setShowTransferDrawer(false);
      setShowManagerDrawer(false);
    } catch (error) {
      console.error("转让群主失败:", error);
    }
  };

  /**
   * 修改群信息
   */
  const handleEditGroupInfo = async () => {
    try {
      if (!editGroupInfo.name) {
        message.error("群名称不能为空");
        return;
      }
      const Params: any = {
        group_id: friendId,
        name: editGroupInfo.name,
        avatar: editGroupInfo.avatar,
        describe: editGroupInfo.describe,
      };
      const res: any = await updateGroupInfo(Params);
      setGroupInfo(res.data); // 更新群信息
      setShowEditGroupDrawer(false);
    } catch (error) {
      console.error("修改群信息失败:", error);
    }
  };

  /**
   * 打开群信息编辑抽屉
   */
  const handleEditGroupDrawerOpen = () => {
    if (!isGroupOwnerOrAdmin()) {
      message.warning("只有管理者才能修改群信息");
      return;
    }
    setEditGroupInfo({
      name: groupInfo.name,
      avatar: groupInfo.avatar,
      describe: groupInfo.describe,
    });
    setShowEditGroupDrawer(true);
  };

  // ===================== 其他操作方法 =====================

  /**
   * 处理群操作(解散/退出/删除)
   */
  const handleGroupAction = async () => {
    try {
      await db.deleteConversation(userInfo.id, friendId, chatType);

      if (chatType === 2) {
        if (groupInfo.ownerId == userInfo.id) {
          await disbandGroup(friendId); // 群主解散群聊
        } else {
          await quitGroup(friendId); // 成员退出群聊
        }
      } else if (chatType === 1) {
        await deleteFriend(friendId); // 删除好友
      }

      refreshConversation();
      setCurrentFriendData({ id: null, nickname: "", avatar: "" });
      const list: any = await db.getUserConversations(userInfo.id);
      setCurrentChatList(list);
    } catch (error) {
      console.error("群操作失败:", error);
    }
  };

  /**
   * 清空聊天记录
   */
  const clearChatHistory = async () => {
    try {
      await db.clearMessages(userInfo.id, friendId, chatType);
      refreshConversation();
      const list: any = await db.getUserConversations(userInfo.id);
      setCurrentChatList(list);
      setOpenDrawer(false);
    } catch (error) {
      console.error("清空聊天记录失败:", error);
    }
  };

  /**
   * 上传图片
   */
  const handleUploadAvatar = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    try {
      const file = await new Promise<File | null>((resolve) => {
        input.onchange = (e: Event) => {
          const files = (e.target as HTMLInputElement).files;
          resolve(files?.[0] || null);
        };
        input.click();
      });

      if (file) {
        const url = await handleUpload(file);
        setEditGroupInfo({ ...editGroupInfo, avatar: String(url) });
        message.success("头像上传成功");
      }
    } catch (error) {
      console.error("头像上传失败:", error);
      message.error("头像上传失败");
    } finally {
      input.value = "";
    }
  };

  // ===================== 数据过滤和排序方法 =====================

  /**
   * 获取按首字母分组的用户列表
   */
  const getSortedUserList = () => {
    const groupedUsers = new Map<string, any[]>();

    // 按首字母分组
    notInGroupUserList.forEach((user: any) => {
      const firstLetter = getFirstLetter(user.user_nickname);
      if (!groupedUsers.has(firstLetter)) {
        groupedUsers.set(firstLetter, []);
      }
      groupedUsers.get(firstLetter)?.push(user);
    });

    // 按字母顺序排序
    return Array.from(groupedUsers.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  };

  /**
   * 获取过滤后的用户列表
   */
  const getFilteredUserList = () => {
    if (!searchInput.trim()) return getSortedUserList();

    const lowerKeyword = searchInput.toLowerCase();

    // 过滤匹配搜索关键字的用户
    const filteredUsers = notInGroupUserList.filter((user: any) => {
      const nickname = user.user_nickname.toLowerCase();
      const firstLetter = getFirstLetter(user.user_nickname).toLowerCase();
      return (
        nickname.includes(lowerKeyword) || firstLetter.includes(lowerKeyword)
      );
    });

    // 重新分组
    const groupedUsers = new Map<string, any[]>();
    filteredUsers.forEach((user: any) => {
      const firstLetter = getFirstLetter(user.user_nickname);
      if (!groupedUsers.has(firstLetter)) {
        groupedUsers.set(firstLetter, []);
      }
      groupedUsers.get(firstLetter)?.push(user);
    });

    return Array.from(groupedUsers.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  };

  // ===================== 生命周期和副作用 =====================

  // 监听抽屉状态变化
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!openDrawer) {
        setShowMemberDrawer(false);
        setShowManagerDrawer(false);
        setShowTransferDrawer(false);
        setShowAddAdminDrawer(false);
        setShowEditGroupDrawer(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [openDrawer]);

  // 初始化数据
  useEffect(() => {
    const fetchData = async () => {
      if (chatType === 2) {
        await handleGroupMemberList();
        await handleGroupInfo();
      } else if (chatType === 1) {
        const res: any = await idsearch(friendId);
        setFriendInfo(res.data);
      }
    };

    fetchData();
  }, [chatType, friendId]);

  // ===================== 渲染辅助方法 =====================

  /**
   * 渲染成员项
   * @param member 成员数据
   * @param withCheckbox 是否显示复选框
   */
  const renderMemberItem = (member: Member, withCheckbox = false) => (
    <div className="member-item" key={member.user_id}>
      {withCheckbox ? (
        <Checkbox
          onChange={(e) => handleSelectMember(member.user_id, e.target.checked)}
          checked={selectedMembers.includes(member.user_id)}
        >
          {renderMemberContent(member)}
        </Checkbox>
      ) : (
        renderMemberContent(member)
      )}
    </div>
  );

  /**
   * 渲染成员内容
   * @param member 成员数据
   */
  const renderMemberContent = (member: Member) => (
    <div className="member-content">
      <div style={{ display: "flex", alignItems: "center" }}>
        <img
          src={member.avatar}
          alt={member.nickname}
          className="member-avatar"
        />
        <span className="member-name">{member.nickname}</span>
      </div>
      {member.role === 3 && <span className="member-role">群主</span>}
      {member.role === 2 && <span className="member-role">管理员</span>}
    </div>
  );

  /**
   * 渲染抽屉头部
   * @param title 标题
   * @param count 计数（可选）
   * @param onBack 返回按钮点击回调
   * @param showActionButton 是否显示操作按钮
   * @param actionButtonText 操作按钮文本
   * @param onAction 操作按钮点击回调
   * @param actionDisabled 操作按钮是否禁用
   */
  const renderDrawerHeader = ({
    title,
    count,
    onBack,
    showActionButton = false,
    actionButtonText = "",
    onAction,
    actionDisabled = false,
  }: {
    title: string;
    count?: number;
    onBack: () => void;
    showActionButton?: boolean;
    actionButtonText?: string;
    onAction?: () => void;
    actionDisabled?: boolean;
  }) => (
    <div className="drawer-header">
      <div className="header-title">
        <div className="back-icon" onClick={onBack}>
          <ArrowLeftOutlined style={{ fontSize: "20px", color: "#707579" }} />
        </div>
        <h3>
          {title}
          {count !== undefined && ` (${count})`}
        </h3>
      </div>
      {showActionButton && (
        <Button
          type="primary"
          danger
          onClick={onAction}
          disabled={actionDisabled}
          className="delete-button"
        >
          {actionButtonText}
        </Button>
      )}
    </div>
  );

  return (
    <div>
      <div className="chat-drawer">
        <div>
          {chatType === 2 && (
            <div>
              <div className="chat-drawer-list-item">
                {groupMemberList
                  ?.slice(0, isGroupOwnerOrAdmin() ? 13 : 14)
                  .map((item: any) => {
                    return (
                      <div className="chat-list-item" key={item.user_id}>
                        <div className="chat-list-img">
                          <img src={item.avatar} alt="头像" />
                        </div>
                        <div className="chat-list-name">{item.nickname}</div>
                      </div>
                    );
                  })}

                <div
                  className="chat-list-item"
                  onClick={() => handleAddMember()}
                >
                  <div className="chat-list-img">
                    <UsergroupAddOutlined
                      style={{ fontSize: "50px", color: "#999" }}
                    />
                  </div>
                </div>

                {/* 群主或者管理员 */}
                {isGroupOwnerOrAdmin() && (
                  <div
                    className="chat-list-item"
                    onClick={() => {
                      handleLowerLevelMembers();
                      setIsDeleteMode(true);
                      setShowMemberDrawer(true);
                    }}
                  >
                    <div className="chat-list-img">
                      <UsergroupDeleteOutlined
                        style={{ fontSize: "50px", color: "#999" }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div
                className="more-members"
                onClick={() => {
                  setIsDeleteMode(false);
                  setShowMemberDrawer(true);
                }}
              >
                查看更多群员
              </div>
            </div>
          )}

          {chatType === 1 && (
            <div className="chat-drawer-list-item">
              <div className="chat-list-item">
                <div className="chat-list-img">
                  <img src={friendInfo?.avatar} alt="头像" />
                </div>
                <div className="chat-list-name">{friendInfo?.nickname}</div>
              </div>
            </div>
          )}

          {chatType === 2 && (
            <div className="chat-group-info">
              <div className="group-info" onClick={handleEditGroupDrawerOpen}>
                <div className="group-label"> 群聊名称</div>
                <div className="group-name">{groupInfo.name}</div>
              </div>
              <div className="group-info" onClick={handleEditGroupDrawerOpen}>
                <div className="group-label"> 群头像</div>
                <div className="group-avatar">
                  <img src={groupInfo.avatar} alt="头像" />
                </div>
              </div>
              <div
                className="group-info group-describe"
                onClick={handleEditGroupDrawerOpen}
              >
                <div className="group-label">群简介</div>
                <div className="group-describe-text">
                  {groupInfo.describe || "暂无简介"}
                </div>
              </div>
              {isGroupOwnerOrAdmin() && (
                <div
                  className="group-manager"
                  onClick={() => setShowManagerDrawer(true)}
                >
                  <div className="group-manager-label"> 群管理</div>
                </div>
              )}
            </div>
          )}

          <div className="chat-drawer-action">
            <div className="chat_action">
              <div className="switch-text">聊天置顶</div>
              <Switch
                value={topSwitch}
                onChange={() => setTopSwitch(!topSwitch)}
              />
            </div>

            <div className="chat_action">
              <div className="switch-text">消息免打扰</div>
              <Switch
                value={topSwitch}
                onChange={() => setTopSwitch(!topSwitch)}
              />
            </div>
          </div>

          <div className="chat-group-handle">
            <Popconfirm
              title=""
              description="是否确定清空聊天记录?"
              onConfirm={clearChatHistory}
              okText="Yes"
              cancelText="No"
            >
              <Button color="danger" variant="text">
                清空聊天记录
              </Button>
            </Popconfirm>
            {friendId !== userInfo.id && (
              <Popconfirm
                title=""
                description={
                  chatType === 2
                    ? groupInfo.ownerId == userInfo.id
                      ? "是否确定解散群聊？"
                      : "是否确定退出群聊？"
                    : "是否确定删除好友？"
                }
                onConfirm={handleGroupAction}
                okText="Yes"
                cancelText="No"
              >
                <Button color="danger" variant="text">
                  {/* 群聊，只有群主能解散 */}
                  {chatType === 2
                    ? groupInfo.ownerId == userInfo.id
                      ? "解散群聊"
                      : "退出群聊"
                    : "删除好友"}
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>
        {/* 群聊相关弹窗 */}
        {chatType === 2 && (
          <>
            {/* 修改抽屉容器，展示管理群成员 */}
            <div className={`member_drawer ${showMemberDrawer ? "show" : ""}`}>
              {/* 标题头部 */}
              {renderDrawerHeader({
                title: "群成员",
                count: groupMemberList?.length,
                onBack: () => {
                  setShowMemberDrawer(false);
                  setIsDeleteMode(false);
                  setSelectedMembers([]);
                },
                showActionButton: isDeleteMode,
                actionButtonText: `删除(${selectedMembers.length})`,
                onAction: handleDeleteMembers,
                actionDisabled: selectedMembers.length === 0,
              })}

              {/* 展示内容  */}
              <div className="member-list">
                {isDeleteMode ? (
                  <>
                    {/* 删除成员 */}
                    {lowerLevelMembers
                      ?.sort((a, b) => b.role - a.role) // 按角色降序排序(群主3 > 管理员2 > 普通成员1)
                      .map((member) => renderMemberItem(member, true))}
                  </>
                ) : (
                  <>
                    {/* 查看群成员 */}
                    {groupMemberList
                      ?.sort((a, b) => b.role - a.role) // 按角色降序排序(群主3 > 管理员2 > 普通成员1)
                      .map((member) => renderMemberItem(member))}
                  </>
                )}
              </div>
            </div>

            {/* 群管理内容展示抽屉 */}
            <div
              className={`manager_drawer ${showManagerDrawer ? "show" : ""}`}
            >
              {renderDrawerHeader({
                title: "群管理",
                onBack: () => setShowManagerDrawer(false),
              })}

              <div className="manager-list">
                {userInfo?.id === groupInfo?.owner_id && (
                  <div
                    className="manager-item"
                    onClick={() => {
                      setShowTransferDrawer(true);
                    }}
                  >
                    <div className="manager-item-center">群主管理权转让</div>
                  </div>
                )}

                <div className="manager-item">
                  <div className="manager-item-title"> 群主\管理员</div>
                  <div className="manager-item-list">
                    {groupMemberList
                      ?.filter((member: any) => member.role > 1) // 只显示管理员和群主
                      ?.sort((a, b) => b.role - a.role) // 按角色降序排序
                      .map((member: any) => {
                        return (
                          <div
                            className="manager-item-list-item"
                            key={member.user_id}
                          >
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <img src={member.avatar} alt="" />
                              <span>{member.nickname}</span>
                            </div>
                            <div
                              onClick={() => handleDeleteAdmin(member.user_id)}
                            >
                              {userInfo?.id === groupInfo?.owner_id &&
                                member.role == 2 && (
                                  <span className="member-role">
                                    <MinusCircleOutlined
                                      style={{ fontSize: "20px", color: "red" }}
                                    />
                                  </span>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    {/* 群主才能添加管理员 */}
                    {userInfo?.id === groupInfo?.owner_id && (
                      <div
                        className="manager-item-list-item add-manager"
                        onClick={() => {
                          // 添加管理员
                          setShowAddAdminDrawer(true);
                        }}
                      >
                        <div className="add-manager-icon">
                          <PlusCircleOutlined
                            style={{ fontSize: "20px", color: "red" }}
                          />
                        </div>
                        <div>添加管理员</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 群主转让\添加管理员抽屉 */}
            {/* 群主转让抽屉 */}
            <div
              className={`member_drawer ${showTransferDrawer ? "show" : ""}`}
            >
              {renderDrawerHeader({
                title: "转让群主",
                onBack: () => setShowTransferDrawer(false),
              })}

              <div className="member-list">
                {groupMemberList
                  ?.filter((member) => member.role < 3) // 只显示非群主和管理员
                  ?.map((member) => (
                    <div
                      onClick={() => {
                        setIsTransferModalOpen(true);
                        setTransferUserId(member.user_id);
                      }}
                    >
                      {renderMemberItem(member)}
                    </div>
                  ))}
              </div>
            </div>

            {/* 添加管理员抽屉 */}
            <div
              className={`member_drawer ${showAddAdminDrawer ? "show" : ""}`}
            >
              {renderDrawerHeader({
                title: "添加管理员",
                onBack: () => {
                  setShowAddAdminDrawer(false);
                  setSelectedMembers([]);
                },
                showActionButton: true,
                actionButtonText: `确认(${selectedMembers.length})`,
                onAction: () => {
                  handleSetAdmin(selectedMembers);
                  setShowAddAdminDrawer(false);
                },
                actionDisabled: selectedMembers.length === 0,
              })}

              <div className="member-list">
                {groupMemberList
                  ?.filter((member: any) => member.role === 1) // 只显示普通成员
                  ?.map((member: any) => renderMemberItem(member, true))}
              </div>
            </div>

            {/* 修改群信息抽屉 */}
            <div
              className={`member_drawer ${showEditGroupDrawer ? "show" : ""}`}
            >
              {renderDrawerHeader({
                title: "修改群信息",
                onBack: () => setShowEditGroupDrawer(false),
                showActionButton: true,
                actionButtonText: "保存",
                onAction: handleEditGroupInfo,
                actionDisabled: false,
              })}

              <div className="member-list">
                <div className="edit-group-item">
                  <div className="edit-label">群名称</div>
                  <Input
                    value={editGroupInfo.name}
                    onChange={(e) =>
                      setEditGroupInfo({
                        ...editGroupInfo,
                        name: e.target.value,
                      })
                    }
                    placeholder="请输入群名称"
                    showCount
                    maxLength={16}
                    status={!editGroupInfo.name.trim() ? "error" : undefined}
                  />
                  {!editGroupInfo.name.trim() && (
                    <div className="ant-form-item-explain-error">
                      群名称不能为空
                    </div>
                  )}
                </div>
                <div className="edit-group-item">
                  <div className="edit-label">群简介</div>
                  <Input.TextArea
                    value={editGroupInfo.describe}
                    onChange={(e) =>
                      setEditGroupInfo({
                        ...editGroupInfo,
                        describe: e.target.value,
                      })
                    }
                    placeholder="请输入群简介"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                    showCount
                    maxLength={100}
                  />
                </div>
                <div className="edit-group-item">
                  <div className="edit-label">群头像</div>
                  <div className="avatar-upload">
                    <img
                      src={editGroupInfo.avatar || groupInfo.avatar}
                      alt="群头像"
                      className="group-avatar-preview"
                    />
                    <Button type="primary" onClick={handleUploadAvatar}>
                      上传新头像
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 添加新成员 */}
      <Modal
        closable={false}
        open={isModalOpen}
        onOk={handleAddGroupMember}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedUsers([]);
        }}
        okText={`确认(${selectedUsers.length})`}
        cancelText="取消"
        okButtonProps={{
          disabled: selectedUsers.length === 0, // 没有选中时禁用确认按钮
        }}
        className="add-member-modal"
        width={600}
      >
        <div className="add-member">
          <Input
            placeholder="搜索成员"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <div className="add-member-list">
            {getFilteredUserList().map(([letter, users]) => (
              <div className="letter-group" key={letter}>
                <div className="letter-header">{letter}</div>
                {users.map((item: any) => (
                  <Checkbox
                    onChange={(e) =>
                      handleSelectUser(item.user_id, e.target.checked)
                    }
                    key={item.user_id}
                    checked={
                      item.is_group || selectedUsers.includes(item.user_id)
                    }
                    disabled={item.is_group}
                    className="user-checkbox"
                  >
                    <div className="member-list-item">
                      <div className="chat-list-img">
                        <img src={item.user_avatar} alt="头像" />
                      </div>
                      <div className="chat-list-name">{item.user_nickname}</div>
                    </div>
                  </Checkbox>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 转让群主提示框 */}
      <Modal
        open={isTransferModalOpen}
        onOk={() => handleTransferOwner(transferUserId)}
        onCancel={() => setIsTransferModalOpen(false)}
        okText="确定"
        cancelText="取消"
        title="提示"
        className="prompt-modal"
      >
        <p>您将自动放弃群主身份</p>
      </Modal>
    </div>
  );
};

export default ChatInfo;
