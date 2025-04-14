import { useState, useEffect } from "react";
import "./index.scss";
const FirendList = () => {
  return (
    <div className="friend-list">
      <div className="friend-list-title">通讯录</div>
      <div className="friend-list-content">
        <div className="friend-list-search">
          <input type="text" placeholder="搜索" />
        </div>
        <ul className="friend-list-content">
          <li>
            <div className="friend-list-item">
              <img src="/img/1.jpg" alt="头像" />
              <div className="friend-list-item-info">新朋友</div>
            </div>
          </li>
          <li>好友2</li>
          <li>好友3</li>
          <li>好友4</li>
          <li>好友5</li>
          <li>好友6</li>
          <li>好友7</li>
          <li>好友8</li>
        </ul>
      </div>
    </div>
  );
};

export default FirendList;
