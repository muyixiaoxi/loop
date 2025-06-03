import { Modal } from "antd";
import { observer } from "mobx-react-lite";
import { useRef, useEffect } from "react";
import "./index.scss";

interface GroupVideoChatProps {
  visible: boolean;
  onClose: () => void;
  localStream: MediaStream | null;
  remoteStreams: Record<number, MediaStream>; // 使用用户ID作为key
  participants: Array<{
    id: number;
    name: string;
    avatar: string;
  }>;
}

const GroupVideoChat = observer((props: GroupVideoChatProps) => {
  const { visible, onClose, localStream, remoteStreams, participants } = props;
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  console.log("participants-------------", participants);

  // 设置本地视频流
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // 动态计算视频布局
  const calculateLayout = () => {
    const container = videoContainerRef.current;
    if (!container) return;

    const count = Object.keys(remoteStreams).length + (localStream ? 1 : 0);
    // 根据参与者数量动态调整布局
    container.style.gridTemplateColumns =
      count <= 4 ? "repeat(2, 1fr)" : "repeat(3, 1fr)";
  };

  useEffect(() => {
    calculateLayout();
    window.addEventListener("resize", calculateLayout);
    return () => window.removeEventListener("resize", calculateLayout);
  }, [remoteStreams, localStream]);

  return (
    <Modal
      className="group-video-modal"
      title="群视频通话"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      <div className="video-container" ref={videoContainerRef}>
        {/* 本地视频 */}
        {localStream && (
          <div className="video-item local-video">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="video-element"
            />
            <div className="video-info">
              <span>我</span>
            </div>
          </div>
        )}

        {/* 远程视频流 */}
        {participants.map((participant) => {
          const stream = remoteStreams[participant.id];
          // if (!stream) return null;
          // console.log("remoteStreams", remoteStreams);
          // console.log("participant", participant);

          return (
            <div className="video-item" key={participant.id}>
              <video
                autoPlay
                playsInline
                className="video-element"
                ref={(el) => {
                  if (el) el.srcObject = stream;
                }}
              />
              <div className="video-info">
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="avatar"
                />
                <span>{participant.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
});

export default GroupVideoChat;
