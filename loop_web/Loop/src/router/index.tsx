// src/router/index.ts
import { RouteObject } from "react-router-dom";
import App from "../App";
import Home from "@pages/Home";
import Chat from "@pages/Chat";

// 类型安全的配置
const routes: RouteObject[] = [
  {
    path: "/",
    element: <App />, // 这里直接写 JSX 是正确的
    // errorElement: <NotFound />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "chat",
        element: <Chat />,
      },
    ],
  },
];

export default routes;
