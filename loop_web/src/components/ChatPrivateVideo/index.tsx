import "./index.scss";
import React, { useEffect, useRef, useState } from "react";
import userStore from "@/store/user";
// 定义组件属性接口
interface ChatPrivateVideoProps {
  localStream: MediaStream | null; // 本地视频流
  remoteStream: MediaStream | null; // 远程视频流
  onClose: () => void; // 关闭视频通话回调
  callerAvatar?: string; // 新增对方头像
  callerName?: string; // 新增对方名称
}

const ChatPrivateVideo: React.FC<ChatPrivateVideoProps> = ({
  localStream,
  remoteStream,
  onClose,
  callerAvatar,
  callerName,
}) => {
  const { userInfo } = userStore;
  // 视频元素引用
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // 控制状态
  const [isMuted, setIsMuted] = useState(false); // 是否静音
  const [isVideoOff, setIsVideoOff] = useState(false); // 是否关闭视频

  // 监听本地视频流变化，设置到video元素
  // 添加useEffect监听流变化
  useEffect(() => {
    if (remoteVideoRef.current) {
      if (remoteStream) {
        // console.log("设置远程视频流", remoteStream.getTracks());
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }

    if (localVideoRef.current) {
      if (localStream) {
        // console.log("设置本地视频流", localStream.getTracks());
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [remoteStream, localStream]);

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
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
        ) : callerAvatar ? (
          <div className="caller-avatar-container">
            <img
              src={callerAvatar}
              alt={callerName || "对方头像"}
              className="caller-avatar"
            />
            <div className="caller-name">{callerName || "对方"}</div>
          </div>
        ) : null}
        {/* 本地视频(小窗) */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`local-video ${isVideoOff ? "hidden" : "show"}`}
        />

        <div
          className={`me-avatar-container ${!isVideoOff ? "hidden" : "show"}`}
        >
          <img
            src={userInfo.avatar} // 使用当前用户头像
            alt="我的头像"
            className="me-avatar"
          />
        </div>
      </div>

      {/* 控制按钮区域 */}
      <div className="control-buttons">
        {/* 静音/取消静音按钮 */}
        <button
          onClick={toggleMute}
          className={`control-button ${isMuted ? "muted" : ""}`}
        >
          {isMuted ? (
            <svg
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="5750"
              width="30"
              height="30"
            >
              <path
                d="M55.168 55.168c16.64-16.64 43.648-16.64 60.352 0l853.312 853.312a42.688 42.688 0 1 1-60.352 60.352l-185.664-185.664a373.76 373.76 0 0 1-169.344 62.144v43.264h83.008c22.848 0 41.472 18.368 41.472 41.088 0 22.656-18.56 40.96-41.472 40.96h-248.96a41.28 41.28 0 0 1-41.472-40.96c0-22.656 18.56-41.088 41.536-41.088h82.944v-43.264c-186.688-20.416-331.84-176.896-331.84-366.976 0-22.656 18.56-40.96 41.472-40.96 22.912 0 41.472 18.304 41.472 40.96 0 158.592 129.984 287.168 290.368 287.168 55.424 0 107.2-15.36 151.232-41.92l-37.056-37.056a245.312 245.312 0 0 1-359.552-217.216V327.04L55.232 115.52a42.688 42.688 0 0 1 0-60.352zM512 53.312a245.312 245.312 0 0 1 245.312 245.376v170.624c0 27.392-4.48 53.696-12.736 78.208-4.864 14.528-7.296 21.76-14.208 23.424-6.976 1.6-12.8-4.224-24.32-15.808l-380.8-380.8c-7.36-7.36-11.072-11.008-11.264-16-0.256-4.928 2.816-8.64 9.024-16.128A244.8 244.8 0 0 1 512 53.312zM843.84 437.312a41.28 41.28 0 0 0-41.472 41.024c0 43.072-9.6 83.84-26.688 120.512-4.16 8.768-6.208 13.184-5.504 17.152 0.704 4.032 3.904 7.232 10.368 13.632l24.192 24.256c10.496 10.496 15.744 15.744 22.144 14.72 6.4-0.896 9.728-7.168 16.32-19.712 26.88-51.008 42.112-108.992 42.112-170.56a41.28 41.28 0 0 0-41.472-40.96z"
                fill="#333333"
                p-id="5751"
              ></path>
            </svg>
          ) : (
            <svg
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="5473"
              width="30"
              height="30"
            >
              <path
                d="M512 53.312a245.312 245.312 0 0 0-245.312 245.376v170.624a245.312 245.312 0 0 0 490.624 0V298.688A245.312 245.312 0 0 0 512 53.312z"
                fill="#333333"
                p-id="5474"
              ></path>
              <path
                d="M221.632 478.336a41.28 41.28 0 0 0-41.472-40.96 41.28 41.28 0 0 0-41.472 40.96c0 190.08 145.152 346.56 331.84 366.976v43.264H387.584a41.28 41.28 0 0 0-41.536 41.088c0 22.656 18.56 40.96 41.536 40.96h248.896a41.28 41.28 0 0 0 41.472-40.96 41.28 41.28 0 0 0-41.472-41.088H553.472v-43.264c186.688-20.416 331.84-176.896 331.84-366.976a41.28 41.28 0 0 0-41.472-40.96 41.28 41.28 0 0 0-41.472 40.96c0 158.592-129.984 287.168-290.368 287.168S221.632 636.928 221.632 478.336z"
                fill="#333333"
                p-id="5475"
              ></path>
            </svg>
          )}
        </button>

        {/* 开启/关闭视频按钮 */}
        <button
          onClick={toggleVideo}
          className={`control-button ${isVideoOff ? "video-off" : ""}`}
        >
          {!isVideoOff ? (
            <svg
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="17579"
              width="30"
              height="30"
            >
              <path
                d="M907.712 642.592l-2.624-302.592-204.256 145.056 206.88 157.536z m-39.68-354.784a64 64 0 0 1 101.056 51.648l2.624 302.592a64 64 0 0 1-102.752 51.456l-206.912-157.536a64 64 0 0 1 1.728-103.104l204.256-145.056z"
                fill="#000000"
                p-id="17580"
              ></path>
              <path
                d="M144 256a32 32 0 0 0-32 32v417.376a32 32 0 0 0 32 32h456.32a32 32 0 0 0 32-32V288a32 32 0 0 0-32-32H144z m0-64h456.32a96 96 0 0 1 96 96v417.376a96 96 0 0 1-96 96H144a96 96 0 0 1-96-96V288a96 96 0 0 1 96-96z"
                fill="#000000"
                p-id="17581"
              ></path>
            </svg>
          ) : (
            <svg
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="18684"
              width="30"
              height="30"
            >
              <path
                d="M106.912 152.096A32 32 0 1 1 149.12 103.904l768 672a32 32 0 0 1-42.176 48.192l-768-672z"
                fill="#000000"
                p-id="18685"
              ></path>
              <path
                d="M732.672 462.4l-37.056-52.16 172.416-122.432a64 64 0 0 1 101.056 51.648l2.624 302.592a63.904 63.904 0 0 1-20.16 47.2l-43.84-46.656-2.624-302.592-172.416 122.432z m-34.72-54.016l35.616 53.184c-10.752 7.2-24.32 12.16-37.216 12.16a64 64 0 0 1-64-64V288a32 32 0 0 0-32-32h-205.952V192h205.952a96 96 0 0 1 96 96v121.28c0.416-0.224 1.088-0.544 1.6-0.896zM632.32 608h64v97.376a96 96 0 0 1-96 96H144a96 96 0 0 1-96-96V288a96 96 0 0 1 96-96h96v64h-96a32 32 0 0 0-32 32v417.376a32 32 0 0 0 32 32h456.32a32 32 0 0 0 32-32V608z"
                fill="#000000"
                p-id="18686"
              ></path>
            </svg>
          )}
        </button>

        {/* 结束通话按钮 */}
        <button onClick={onClose} className="end-call-button">
          <svg
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2436"
            width="30"
            height="30"
          >
            <path
              d="M0 511.573689c0 182.461282 97.199001 351.2806 255.786844 443.363863s352.985845 92.083264 511.573689 0 255.786844-260.902581 255.786844-443.363863C1023.147377 228.502914 794.644463 0 511.573689 0S0 228.502914 0 511.573689z"
              fill="#BD0000"
              p-id="2437"
            ></path>
            <path
              d="M511.573689 485.995004c75.030808 0 155.177352 6.820983 155.177352 42.631141 0 49.452123-6.820983 86.967527 92.083264 97.199001 97.199001 10.231474 85.262281-61.388843 85.262281-109.135721 0-54.56786-129.598668-133.009159-332.522897-131.303913s-332.522898 78.441299-330.817652 133.009159c0 47.746878-11.936719 119.367194 85.262281 109.13572 98.904246-10.231474 92.083264-47.746878 92.083264-97.199-1.705246-37.515404 78.441299-44.336386 153.472107-44.336387"
              fill="#FFFFFF"
              p-id="2438"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatPrivateVideo;
