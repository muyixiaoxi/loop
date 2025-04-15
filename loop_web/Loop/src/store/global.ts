import { makeObservable, observable, action } from "mobx";
import { makePersistable } from "mobx-persist-store"; // 正确导入方式

class GlobalStore {
  isDarkMode: boolean = false; // 初始值为 false，表示默认是白天模式

  isShowUserAmend: boolean = false; // 个人信息修改弹窗是否显示

  constructor() {
    makeObservable(this, {
      isShowUserAmend: observable,
      setIsShowUserAmend: action,
    });

    makePersistable(this, {
      name: "loopGlobalStore",
      properties: ["isShowUserAmend"],
      storage: window.localStorage,
    }).catch((e) => console.error("Persist failed:", e));
  }

  setIsShowUserAmend = (bool: boolean) => {
    this.isShowUserAmend = bool;
  };
}

const globalStore = new GlobalStore();
export default globalStore;
