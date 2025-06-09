import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "@ant-design/v5-patch-for-react-19";
import "./index.scss";
import "@/assets/iconfont/iconfont.css";
import routes from "./router";

const router = createBrowserRouter(routes);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
