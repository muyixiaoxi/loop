import { makeObservable, observable, action } from "mobx";
import { makePersistable } from "mobx-persist-store"; // 正确导入方式

class GlobalStore {
  isDarkMode: boolean = false; // 初始值为 false，表示默认是白天模式
  isShowUserAmend: boolean = false; // 个人信息修改弹窗是否显示
  currentRoute: string = "chat"; // 当前主页路由
  timeDifference: number = 0; // 服务器和本地时差

  constructor() {
    // 使用makeObservable函数将isShowUserAmend属性设置为可观察的，setIsShowUserAmend方法设置为可行动的
    makeObservable(this, {
      isShowUserAmend: observable,
      currentRoute: observable,
      timeDifference: observable,
      setCurrentRoute: action,
      setIsShowUserAmend: action,
      setTimeDifference: action,
    });

    // 使用makePersistable函数将this对象持久化到localStorage中，并设置存储的名称为loopGlobalStore，属性为isShowUserAmend
    makePersistable(this, {
      name: "loopGlobalStore",
      properties: ["isShowUserAmend"],
      storage: window.localStorage,
    }).catch((e) => console.error("Persist failed:", e));
  }

  setIsShowUserAmend = (bool: boolean) => {
    this.isShowUserAmend = bool;
  };

  // 设置当前主页路由
  setCurrentRoute = (route: string) => {
    this.currentRoute = route;
  };

  // 设置时差
  setTimeDifference = (difference: number) => {
    this.timeDifference = difference;
  };

  // 最新时间
  getCurrentTimeDifference = () => {
    return Date.now() + this.timeDifference;
  };
}

const globalStore = new GlobalStore();
export default globalStore;
