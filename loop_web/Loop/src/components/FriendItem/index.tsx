import React from "react";
import "./index.scss";
import { Avatar } from "antd";

type FriendItemProps = {
  name: string; // 好友名称
  desc: string; // 好友描述
  avatar: string; // 好友头像
};

/**
 * 好友列表项组件
 * @param props 组件属性
 * @returns 好友列表项组件
 * */
const FriendItem = (props: FriendItemProps) => {
  const { name, desc, avatar } = props;
  return (
    <div className="friend-item ">
      <div className="friend-avatar">
        <Avatar src={avatar} className="friend-avatar-img"></Avatar>
      </div>
      <div className="friend-info">
        <div className="friend-name-time">
          <div className="friend-name">{name}</div>
          <div className="friend-time">20:28</div>
        </div>
        <div className="friend-desc">{desc}</div>
      </div>
    </div>
  );
};
export default FriendItem;
