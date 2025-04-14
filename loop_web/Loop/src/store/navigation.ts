import { makeObservable, observable, action } from "mobx";
import { makePersistable } from "mobx-persist-store"; // 正确导入方式

class NavigationStore {
  currentRoute: string = "conversation";

  constructor() {
    makeObservable(this, {
      currentRoute: observable,
      setCurrentRoute: action,
    });
    makePersistable(this, {
      name: "loopNavigationStore",
      properties: ["currentRoute"],
      storage: window.localStorage,
    }).catch((e) => console.error("Persist failed:", e));
  }

  setCurrentRoute = (route: string) => {
    this.currentRoute = route;
  };
}

const navigationStore = new NavigationStore();
export default navigationStore;
