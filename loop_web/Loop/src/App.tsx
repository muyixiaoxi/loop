import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { MessageProvider } from "@components/MessageProvider";
import "./App.scss";

function App() {
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
