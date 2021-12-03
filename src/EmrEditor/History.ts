export type CacheData = {
  value: string,
  next: CacheData | null,
  prev: CacheData | null,
}

export class Cache {
  // 操作栈
  data: CacheData = {
    value: '',
    next: null,
    prev: null,
  }

  size: number = 0

  // 当前显示的
  face: CacheData | null
  // 第一个数据
  head: CacheData | null
  // 最后一个数据
  tail: CacheData | null

  constructor() {
    this.face = this.data;
    this.head = this.data;
    this.tail = this.data;
  }

  /**
   * 插入链表中
   * @param value 值
   */
  push(value: any) {
    // 创建新的尾部对象
    const data: CacheData = {
      value,
      next: null,
      prev: null,
    }

    data.prev = this.face;
    this.face!.next = data;
    this.face = data;
    // console.log(this.face);
    // // 替换尾部对象
    // this.tail = data;
    // // 将当前face的next指向data
    // this.face!.next = data;
    // // data.prev = this.face;
    // // this.face!.next = data;
    // // this.face!.next = data;
    // // data.prev = this.face;
    // // 替换当前对象
    // // this.face = data;
    // 索引加一
    ++this.size;
  }

  prev() {
    this.face = this.face!.prev;
    return this.face;
  }
  
  next() {
    this.face = this.face!.next;
    return this.face;
  }
}


export default class History {
  static create() {
    return new this();
  }

  cache: Cache

  constructor() {
    this.cache = new Cache();
  }

  /**
   * 恢复
   */
  restore() {
    return this.cache.next();
  }

  /**
   * 撤销
   */
  revoke() {
    return this.cache.prev();
  }

  /**
   * 保存
   */
  save(value: any) {
    this.cache.push(value);
  }
}
