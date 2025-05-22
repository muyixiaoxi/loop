import React, { useEffect, useRef, useState } from "react";
import "./index.scss";

// 定义组件属性接口
interface ChatPrivateVideoProps {
  localStream: MediaStream | null; // 本地视频流
  remoteStream: MediaStream | null; // 远程视频流
  onClose: () => void; // 关闭视频通话回调
  isCaller: boolean; // 是否是呼叫方
  onStartCall?: () => void; // 开始通话回调(可选)
  onEndCall?: () => void; // 结束通话回调(可选)
}

const ChatPrivateVideo: React.FC<ChatPrivateVideoProps> = ({
  localStream,
  remoteStream,
  onClose,
  isCaller,
  onStartCall,
  onEndCall,
}) => {
  // 视频元素引用
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // 控制状态
  const [isMuted, setIsMuted] = useState(false); // 是否静音
  const [isVideoOff, setIsVideoOff] = useState(false); // 是否关闭视频

  // 监听本地视频流变化，设置到video元素
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // 监听远程视频流变化，设置到video元素
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 切换静音状态
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled; // 切换音频轨道启用状态
      });
      setIsMuted(!isMuted); // 更新状态
    }
  };

  // 切换视频状态
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled; // 切换视频轨道启用状态
      });
      setIsVideoOff(!isVideoOff); // 更新状态
    }
  };

  return (
    <div className="video-chat-container">
      {/* 视频显示区域 */}
      <div className="video-wrapper">
        {/* 远程视频 */}
        <video
          ref={remoteVideoRef}
          autoPlay // 自动播放
          playsInline // 内联播放(移动端兼容)
          className="remote-video"
        />
        {/* 本地视频(小窗) */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted // 本地视频默认静音避免回声
          className="local-video"
        />
      </div>

      {/* 控制按钮区域 */}
      <div className="control-buttons">
        {/* 如果是呼叫方且提供了开始回调，显示开始按钮 */}
        {isCaller && onStartCall && (
          <button onClick={onStartCall} className="call-button">
            开始通话
          </button>
        )}

        {/* 静音/取消静音按钮 */}
        <button
          onClick={toggleMute}
          className={`control-button ${isMuted ? "muted" : ""}`}
        >
          {isMuted ? "取消静音" : "静音"}
        </button>

        {/* 开启/关闭视频按钮 */}
        <button
          onClick={toggleVideo}
          className={`control-button ${isVideoOff ? "video-off" : ""}`}
        >
          {isVideoOff ? "开启视频" : "关闭视频"}
        </button>

        {/* 结束通话按钮 */}
        <button onClick={onClose} className="end-call-button">
          结束通话
        </button>
      </div>
    </div>
  );
};

export default ChatPrivateVideo;
