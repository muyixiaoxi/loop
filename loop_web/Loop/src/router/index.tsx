import { RouteObject } from "react-router-dom";
import App from "../App";
import Home from "@pages/Home";
import Login from "@pages/Login";
import NotFound from "@pages/NotFound";
// 类型安全的配置
const routes: RouteObject[] = [
  {
    path: "/",
    element: <App />, // 这里直接写 JSX 是正确的
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "home",
        element: <Home />,
      },
    
    ],
  },
];

export default routes;
