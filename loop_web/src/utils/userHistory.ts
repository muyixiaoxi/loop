const saveUserToHistory = (userData: any) => {
  const historyUsers = JSON.parse(localStorage.getItem("hisuser") || "[]");

  // 检查是否已存在相同账号
  const existingIndex = historyUsers.findIndex(
    (user: any) => user.id === userData.id
  );

  if (existingIndex >= 0) {
    // 移除已有账号
    historyUsers.splice(existingIndex, 1);
  }

  // 将新账号添加到数组开头
  historyUsers.unshift(userData);

  // 限制历史记录数量（最多保存10个）
  const maxHistory = 10;
  const trimmedHistory = historyUsers.slice(0, maxHistory);

  localStorage.setItem("hisuser", JSON.stringify(trimmedHistory));
};
export default saveUserToHistory;
