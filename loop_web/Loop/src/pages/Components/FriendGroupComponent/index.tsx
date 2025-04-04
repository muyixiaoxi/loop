import React, { useState } from'react';
import { Button } from 'antd';
import OSS from 'ali-oss';

const FriendGroupOSSUploadComponent = () => {
    const [fileList, setFileList] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState([]); // 新增状态用于存储上传后的 URL
    const [imgUrl, setImgUrl] =useState('')
    
  const client = new OSS({
        accessKeyId:import.meta.env.VITE_AIP_AccessKeyID, // 请替换为你的实际 AccessKey ID
        accessKeySecret: import.meta.env.VITE_AIP_AccessKeySecret, // 请替换为你的实际 AccessKey Secret
        region: 'oss-cn-beijing', // 请替换为你的 OSS 地域，如 oss-cn-hangzhou
        authorizationV4: true,
        bucket: 'loopavatar', // 请替换为你的 OSS Bucket 名称
    });

    const handleUpload = async (file) => {
        try {
            setIsUploading(true);
            const result = await client.put(file.name, file);
          console.log('文件上传成功:', result.url);
          setImgUrl(result.url)
            // 构建完整的 URL
            const url = `https://${client.options.bucket}.${client.options.endpoint}/${result.name}`;
            setFileList([...fileList, file]);
            setUploadedUrls([...uploadedUrls, url]); // 将新的 URL 添加到状态中
        } catch (error) {
            console.error('文件上传失败:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleUpload(file);
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <Button
                type="primary"
                disabled={isUploading}
                onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.onchange = handleFileChange;
                    input.click();
                }}
            >
                {isUploading? '上传中...' : '选择文件上传'}
            </Button>
            <div>
                {fileList.map((file, index) => (
                    <p key={index}>{file.name}</p>
                ))}
            </div>
            <div>
                {uploadedUrls.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                    </a>
                ))}
          <img src={imgUrl}></img>
            </div>
        </div>
    );
};

export default FriendGroupOSSUploadComponent;