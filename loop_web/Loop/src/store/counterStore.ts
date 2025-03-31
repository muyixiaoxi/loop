import { makeObservable, observable, action } from 'mobx';

class CounterStore {
  // 定义可观察的状态
  @observable count = 0;

  constructor() {
    // 使类中的属性和方法可被 MobX 观察和响应
    makeObservable(this);
  }

  // 定义修改状态的动作
  @action increment = () => {
    this.count++;
  };

  @action decrement = () => {
    this.count--;
  };
}

// 创建并导出状态管理实例
const counterStore = new CounterStore();
export default counterStore;