import { useState } from 'react';
import { message } from 'antd';
import { uploadToOSS } from '@/utils/oss';

export const useOSSUpload = () => {
  const [avatarUrl, setAvatarUrl] = useState('');

  const handleUpload = async (file: File) => {
    if (!file) return;

    try {
      const { url } = await uploadToOSS(file);
      setAvatarUrl(url);
      message.success("头像上传成功");
      return url;
    } catch (error) {
      console.error("文件上传失败:", error);
      message.error("文件上传失败");
      return null;
    }
  };

  return { avatarUrl, handleUpload };
};