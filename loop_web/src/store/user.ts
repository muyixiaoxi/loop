import { makeObservable, observable, action } from "mobx";
import { makePersistable } from "mobx-persist-store"; // 正确导入方式

type UserInfo = {
  id: number;
  age: number;
  avatar: string;
  gender: number;
  nickname: string;
  signature: string;
};

class UserStore {
  userInfo: UserInfo = {
    id: 0,
    age: 0,
    avatar: "",
    gender: 0,
    nickname: "",
    signature: "",
  };

  access_token: string = "";
  refresh_token: string = "";

  constructor() {
    makeObservable(this, {
      userInfo: observable,
      access_token: observable,
      refresh_token: observable,
      setUserInfo: action,
      setToken: action,
      clearUserInfo: action,
      clearToken: action,
    });

    makePersistable(this, {
      name: "loopUserStore",
      properties: ["userInfo", "access_token", "refresh_token"],
      storage: window.localStorage,
    }).catch((e) => console.error("Persist failed:", e));
  }

  setUserInfo = (info: UserInfo) => {
    this.userInfo = info;
  };

  setToken = (token: { access_token: string; refresh_token: string }) => {
    this.access_token = token.access_token;
    this.refresh_token = token.refresh_token;
  };

  clearUserInfo = () => {
    this.userInfo = {
      id: 0,
      age: 0,
      avatar: "",
      gender: 0,
      nickname: "",
      signature: "",
    };
  };

  clearToken = () => {
    this.access_token = "";
    this.refresh_token = "";
  };
}

const userStore = new UserStore();
export default userStore;
