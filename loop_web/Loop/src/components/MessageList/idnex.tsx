import React from "react";
import "./index.scss";
import MessageItem from "@/components/MessageItem";

const MessageList = () => {
  const item = [
    {
      avatar:
        "https://web.botgate.cn/api/v1/users/f83c9d5efde54b23955b0cb70c4d6d2a/avatar?v=",
      name: "二狗还得哈啥可啊手动阀是大家·卡萨丁",
      desc: "这是二狗的简介阿斯顿发放的啊手动阀第三方杀手大噶山豆根阿斯顿发生",
    },
    {
      avatar:
        "https://web.botgate.cn/api/v1/users/f83c9d5efde54b23955b0cb70c4d6d2a/avatar?v=",
      name: "二狗还得哈啥可啊手动阀是大家·卡萨丁",
      desc: "这是二狗的简介阿斯顿发放的啊手动阀第三方杀手大噶山豆根阿斯顿发生",
    },
  ];
  return (
    <div className="message-list">
      {item.map((item, index) => (
        <MessageItem
          key={index}
          avatar={item.avatar}
          name={item.name}
          desc={item.desc}
        />
      ))}
    </div>
  );
};
export default MessageList;
