import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { MessageProvider } from "@components/MessageProvider";
import { useNavigate } from "react-router-dom";
import { setHttpNavigate } from "@/utils/request";
import "./App.scss";
function App() {
  const navigate = useNavigate();
  // 初始化HTTP导航
  useEffect(() => {
    setHttpNavigate(navigate);
  }, [navigate]);

  return (
    <MessageProvider>
      <Suspense>
        {/* 这里可以放公共布局 */}
        <Outlet />
      </Suspense>
    </MessageProvider>
  );
}

export default App;
