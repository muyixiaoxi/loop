import React, { useEffect } from "react";
import "./index.scss";

interface ChatVideoAcceptorProps {
  callerInfo: {
    name: string;
    avatar: string;
  };
  onAccept: () => void;
  onReject: () => void;
  visible: boolean;
  timeout?: number; // 超时自动拒绝时间(毫秒)
}

const ChatVideoAcceptor: React.FC<ChatVideoAcceptorProps> = ({
  callerInfo,
  onAccept,
  onReject,
  visible,
  timeout = 30000,
}) => {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onReject();
    }, timeout);

    return () => clearTimeout(timer);
  }, [visible, timeout, onReject]);

  if (!visible) return null;

  return (
    <div className="video-accept-popup">
      <div className="caller-info">
        <img
          src={callerInfo.avatar}
          alt={callerInfo.name}
          className="caller-avatar"
        />
        <div className="caller-name">{callerInfo.name} 邀请您视频通话</div>
      </div>

      <div className="action-buttons">
        <button onClick={onAccept} className="accept-button">
          接受
        </button>
        <button onClick={onReject} className="reject-button">
          拒绝
        </button>
      </div>
    </div>
  );
};

export default ChatVideoAcceptor;
