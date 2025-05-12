
import pinyin from 'pinyin';

// 获取昵称的首字母
export const getFirstLetter = (nickname: string): string => {
  if (!nickname) return '#';
  const firstChar = nickname[0];
  // 判断是否是汉字
  if (/^[\u4e00-\u9fa5]$/.test(firstChar)) {
    return pinyin(firstChar, {
      style: pinyin.STYLE_FIRST_LETTER
    })[0][0].toUpperCase();
  }
  // 判断是否是字母
  if (/^[a-zA-Z]$/.test(firstChar)) {
    return firstChar.toUpperCase();
  }
  // 其他字符
  return '#';
};