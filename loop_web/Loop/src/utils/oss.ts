import OSS from "ali-oss";

// OSS配置类型
interface OSSConfig {
    accessKeyId: string;
    accessKeySecret: string;
    region: string;
    bucket: string;
    endpoint: string;
    secure: boolean;
}

// 上传结果类型
interface UploadResult {
    url: string;
    fileName: string;
}

// OSS配置常量
const OSS_CONFIG: OSSConfig = {
    accessKeyId: import.meta.env.VITE_OSS_ACCESS_KEY_ID,
    accessKeySecret: import.meta.env.VITE_OSS_ACCESS_KEY_SECRET,
    region: import.meta.env.VITE_OSS_REGION,
    bucket: import.meta.env.VITE_OSS_BUCKET,
    endpoint: import.meta.env.VITE_OSS_ENDPOINT,
    secure: true, // 使用 HTTPS
};

// 初始化OSS客户端
const client = new OSS(OSS_CONFIG);

/**
 * 上传文件到OSS
 * @param file 要上传的文件
 * @returns Promise<UploadResult> 上传结果
 */
export const uploadToOSS = async (file: File): Promise<UploadResult> => {
    if (!file) {
        throw new Error("No file provided");
    }

    const fileName = `${Date.now()}_${file.name}`;
    const result = await client.put(fileName, file);
    const fileUrl = `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.region}.aliyuncs.com/${result.name}`;

    return {
        url: fileUrl,
        fileName: file.name,
    };
};