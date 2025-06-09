export const emoTextList = [
  "憨笑",
  "媚眼",
  "开心",
  "坏笑",
  "可怜",
  "爱心",
  "笑哭",
  "拍手",
  "惊喜",
  "打气",
  "大哭",
  "流泪",
  "饥饿",
  "难受",
  "健身",
  "示爱",
  "色色",
  "眨眼",
  "暴怒",
  "惊恐",
  "思考",
  "头晕",
  "大吐",
  "酷笑",
  "翻滚",
  "享受",
  "鼻涕",
  "快乐",
  "雀跃",
  "微笑",
  "贪婪",
  "红心",
  "粉心",
  "星星",
  "大火",
  "眼睛",
  "音符",
  "叹号",
  "问号",
  "绿叶",
  "燃烧",
  "喇叭",
  "警告",
  "信封",
  "房子",
  "礼物",
  "点赞",
  "举手",
  "拍手",
  "点头",
  "摇头",
  "偷瞄",
  "庆祝",
  "疾跑",
  "打滚",
  "惊吓",
  "起跳",
];

/**
 * 	将文本转换为图片
 * @param content 需要替换的内容
 * @param extClass 额外的class
 * @returns  替换后的内容
 */

export const transform = (content: string, extClass: string): string => {
  return content.replace(/#[\u4E00-\u9FA5]{1,3};/gi, (text: string) =>
    textToImg(text, extClass)
  );
};

/**
 * 将匹配结果替换表情图片
 * @param emoText 匹配结果
 * @param extClass 额外的class
 * @returns 图片地址
 */
export const textToImg = (emoText: string, extClass: string): string => {
  const word = emoText.replace(/#|;/gi, "");
  const idx = emoTextList.indexOf(word);
  if (idx === -1) {
    return emoText;
  }
  const url = new URL(`../assets/emoji/${idx}.gif`, import.meta.url).href;
  return `<img src="${url}" class="${extClass}" />`;
};

/**
 * 将匹配结果替换表情图片
 * @param emoText 匹配结果
 * @returns 图片地址
 */
export const textToUrl = (emoText: string): string => {
  const word = emoText.replace(/#|;/gi, "");
  const idx = emoTextList.indexOf(word);
  if (idx === -1) {
    return "";
  }
  return new URL(`../assets/emoji/${idx}.gif`, import.meta.url).href;
};
