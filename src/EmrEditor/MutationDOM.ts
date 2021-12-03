
export type mutationCallback = (mutations: MutationRecord[], observer: MutationObserver) => void

export class MutationDOM {
  constructor() {
    // callback: mutationCallback
    // 实例化dom观察
    this.observer = new MutationObserver((mutations: MutationRecord[], observer: MutationObserver) => {
      this.queues.forEach((func) => {
        func.call(null, mutations, observer);
      })
    });
  }

  // 默认的配置
  defaultOptions: MutationObserverInit = {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true,
  }

  // 观察实例对象
  observer: MutationObserver
  // 回调队列
  queues: mutationCallback[] = []

  /**
   * 订阅一个回调队列
   * @param callback 
   * @returns 
   */
  subscribe(callback: mutationCallback) {
    const index = this.queues.push(callback);

    return () => {
      this.queues.splice(index, 1);
    };
  }

  /**
   * 全部解绑
   */
  unSubscribe() {
    this.queues = [];
  }

  /**
   * 观察
   * @param targetNode 节点对象
   * @param options 配置
   */
  observe(targetNode: Node, options: MutationObserverInit = {}) {
    this.observer.observe(targetNode, { ...this.defaultOptions, ...options });
  }

  // 停止观察
  disconnect() {
    this.observer.disconnect();
  }
}

export default new MutationDOM();