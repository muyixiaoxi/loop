import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"; // 引入 path 模块

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 设置路径别名
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://47.93.85.12:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
