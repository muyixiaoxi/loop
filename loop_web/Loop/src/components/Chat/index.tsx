import "./index.scss";
import { observer } from "mobx-react-lite";

const Chat = observer(() => {
  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="firend-avatar">
            <img
              src="https://web.botgate.cn/api/v1/users/728aa30315ca40528a1c0f0ad0fe851a/avatar?v=1744722184867"
              alt=""
            />
          </div>
          <div className="firend-name">宝子</div>
        </div>
        <div className="chat-header-right">
          <div className="more-video">
            <svg
              fill="#E46342"
              height="34px"
              role="presentation"
              viewBox="0 0 36 36"
              width="34px"
            >
              <path d="M9 9.5a4 4 0 00-4 4v9a4 4 0 004 4h10a4 4 0 004-4v-9a4 4 0 00-4-4H9zm16.829 12.032l3.723 1.861A1 1 0 0031 22.5v-9a1 1 0 00-1.448-.894l-3.723 1.861A1.5 1.5 0 0025 15.81v4.38a1.5 1.5 0 00.829 1.342z"></path>
            </svg>
          </div>
          <div className="more-mask">
            <svg
              fill="#E46342"
              height="28px"
              role="presentation"
              viewBox="0 0 36 36"
              width="28px"
            >
              <path
                clip-rule="evenodd"
                d="M18 29C24.0751 29 29 24.0751 29 18C29 11.9249 24.0751 7 18 7C11.9249 7 7 11.9249 7 18C7 24.0751 11.9249 29 18 29ZM19.5 18C19.5 18.8284 18.8284 19.5 18 19.5C17.1716 19.5 16.5 18.8284 16.5 18C16.5 17.1716 17.1716 16.5 18 16.5C18.8284 16.5 19.5 17.1716 19.5 18ZM23 19.5C23.8284 19.5 24.5 18.8284 24.5 18C24.5 17.1716 23.8284 16.5 23 16.5C22.1716 16.5 21.5 17.1716 21.5 18C21.5 18.8284 22.1716 19.5 23 19.5ZM14.5 18C14.5 18.8284 13.8284 19.5 13 19.5C12.1716 19.5 11.5 18.8284 11.5 18C11.5 17.1716 12.1716 16.5 13 16.5C13.8284 16.5 14.5 17.1716 14.5 18Z"
                fill-rule="evenodd"
              ></path>
            </svg>
          </div>
        </div>
      </div>
      <div className="chat-center"></div>
      <div className="chat-input"></div>
    </div>
  );
});
export default Chat;
