import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import "./App.scss";

function App() {
  return (
    <>
      <Suspense>
        {/* 这里可以放公共布局 */}
        <Outlet />
      </Suspense>
    </>
  );
}

export default App;
