import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import "./index.scss";

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">页面不存在</h2>
        <p className="not-found-description">
          您访问的页面可能已被移除、重命名或暂时不可用
        </p>
        <Button
          type="primary"
          onClick={handleGoHome}
          className="not-found-button"
          aria-label="返回首页"
          size="large"
        >
          返回首页
        </Button>
      </div>
    </div>
  );
}
