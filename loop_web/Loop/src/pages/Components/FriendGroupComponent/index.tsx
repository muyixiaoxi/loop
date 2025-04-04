import React, { useState } from "react";
import { Button, message } from "antd";
import OSS from "ali-oss";

// 定义类型
type FileItem = {
  name: string;
  url: string;
};

// OSS 配置常量
const OSS_CONFIG = {
  accessKeyId: import.meta.env.VITE_OSS_ACCESS_KEY_ID,
  accessKeySecret: import.meta.env.VITE_OSS_ACCESS_KEY_SECRET,
  region: import.meta.env.VITE_OSS_REGION,
  bucket: import.meta.env.VITE_OSS_BUCKET,
  endpoint: import.meta.env.VITE_OSS_ENDPOINT,
  secure: true, // 使用 HTTPS
};

const FriendGroupOSSUploadComponent: React.FC = () => {
  // 状态管理
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // 初始化 OSS 客户端
  const client = new OSS(OSS_CONFIG);

  /**
   * 处理文件上传
   * @param file 要上传的文件对象
   */
  const handleUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);

      // 生成唯一的文件名（避免覆盖）
      const fileName = `${Date.now()}_${file.name}`;

      // 上传文件到 OSS
      const result = await client.put(fileName, file);

      // 构建完整的访问 URL
      const fileUrl = `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.region}.aliyuncs.com/${result.name}`;

      // 更新状态
      setFiles((prev) => [...prev, { name: file.name, url: fileUrl }]);
      setPreviewUrl(fileUrl);

      message.success("文件上传成功");
    } catch (error) {
      console.error("文件上传失败:", error);
      message.error("文件上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 处理文件选择变化
   * @param e 文件输入事件
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // 重置 input 值，允许重复选择同一文件
    e.target.value = "";
  };

  /**
   * 触发文件选择对话框
   */
  const triggerFileInput = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e: Event) =>
      handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };

  return (
    <div className="oss-upload-container">
      <div className="upload-controls">
        <Button
          type="primary"
          loading={isUploading}
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          {isUploading ? "上传中..." : "选择文件上传"}
        </Button>
      </div>

      {/* 上传文件列表 */}
      {files.length > 0 && (
        <div className="file-list">
          <h3>已上传文件:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 图片预览 */}
      {previewUrl && (
        <div className="image-preview">
          <h3>图片预览:</h3>
          <img
            src={previewUrl}
            alt="上传预览"
            style={{ maxWidth: "100%", maxHeight: "300px" }}
          />
        </div>
      )}
    </div>
  );
};

export default FriendGroupOSSUploadComponent;
