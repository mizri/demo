import Selection, { RangeValueOf } from './Selection';

export enum MutationType {
  Node = 'node', // 节点类型
  Attr = 'attr', // 属性类型
  Text = 'text', // 文本类型
}

export type MutationNode = {
  addedNodes: Array<Node>,
  removedNodes: Array<Node>,
  target: Node,
  type: string,
}

export type MutationData = {
  target: Node | Element, // 变动目标对象,
  attr: string, // 变动的属性名称
  oldValue: string, // 变动前的纯文本内容
  type: MutationType | string, // 变动类型
  value: string | null, // 变动内容
  nodes: any,  // 变动的节点
}

export type CacheData<T> = {
  value?: T;
  isUndo?: boolean, // 是否撤销过
  isRedo?: boolean, // 是否恢复过
  next: CacheData<T> | null; // 上一步操作
  prev: CacheData<T> | null; // 下一步操作
}

export class Cache<T> {
  // 操作栈
  data: CacheData<T> = {
    next: null,
    prev: null,
  }

  // 允许的最大数量

  // 当前操作栈的数据数量
  size: number = 0
  // 当前显示的
  face: CacheData<T> | null
  // 第一个数据
  head: CacheData<T> | null
  // 最后一个数据
  tail: CacheData<T> | null

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
    const data: CacheData<T> = {
      // value: this.size,
      value,
      next: null,
      prev: null,
    }

    data.prev = this.face;
    this.face!.next = data;
    this.face = data;

    // 索引加一
    ++this.size;
  }

  /**
   * 获取上一个
   * @returns
   */
  prev() {
    if (this.face && this.face.prev?.value) {
      // 如果上一步是存在的才重置this.face
      this.face = this.face.prev;
      return this.face;
    }
    return null;
  }
  
  /**
   * 获取下一个
   * @returns
   */
  next() {
    if (this.face && this.face.next?.value) {
      // 如果下一步是存在的才重置this.face
      this.face = this.face.next;
      return this.face;
    }

    return null;
  }
}

export default class History {
  static create() {
    return new this();
  }

  // 节点缓存
  nodeCache: Cache<MutationData[]>
  // 选区缓存
  rangeCache: Cache<RangeValueOf>

  constructor() {
    // 节点缓存
    this.nodeCache = new Cache();
    // 选区缓存
    this.rangeCache = new Cache();
  }

  /**
   * 保存节点操作链
   * @mutations 改变的dom
   */
  saveNodeCache(mutations: MutationRecord[]): void {
    this.nodeCache.push(mutations.map((record: MutationRecord): MutationData => {
      const result: MutationData = {
        target: record.target, // 变动目标对象,
        attr: record.attributeName || '', // 变动的属性名称
        oldValue: record.oldValue || '', // 变动前的纯文本内容
        type: transformType(record), // 变动类型
        value: transformValue(record), // 变动内容
        nodes: transformNodes(record),  // 变动的节点
      };
      return result;
    }));
  }

  /**
   * 保存选区缓存
   */
  saveRangeCache() {
    this.rangeCache.push(Selection.rangeValueof());
  }

  /**
   * 重置范围选区
   * @param direction 操作方向
   */
  resetRange(direction: string) {
    // 范围
    const rangeRecord = direction === 'next' ? this.rangeCache.next() : this.rangeCache.prev();
    if (rangeRecord?.value) {
      // 恢复选区
      const range = Selection.getRange() || document.createRange();
      Selection.saveRange(range);
      Selection.setRange(rangeRecord.value);
      Selection.restoreSelection();
    }
  }

  /**
   * 恢复
   */
  redo() {
    // 节点
    let nodeRecord = this.nodeCache.face;
    if (nodeRecord?.value) {
      // 判断当前次操作是否恢复过
      if (nodeRecord.isRedo) {
        // 重置为未回恢复过
        nodeRecord.isRedo = false;
        // 将操作指向下一次
        nodeRecord = this.nodeCache.next();
      }
      if (nodeRecord?.value) {
        nodeRecord.isRedo = true;
        // 恢复dom操作
        const mutations = [...nodeRecord.value];
        // mutations.reverse();
        mutations.forEach((record: MutationData, i: number) => {
          if (record.type === MutationType.Node) {
            restoreNodes(record);
          } else if (record.type === MutationType.Text) {
            restoreTexts(record);
          } else if (record.type === MutationType.Attr) {
            restoreAttrs(record);
          }
        });
        // 重置范围选区
        this.resetRange('next');
      }
    }
  }

  /**
   * 撤销
   */
  undo() {
    // 节点
    let nodeRecord = this.nodeCache.face;
    if (nodeRecord?.value) {
      // 判断是否被撤销过
      if (nodeRecord.isUndo) {
        // 如果撤销过就还原
        nodeRecord.isUndo = false;
        // 将指针指向上一个
        nodeRecord = this.nodeCache.prev();
      }
      if (nodeRecord?.value) {
        // 将当前记录标记为撤销过
        nodeRecord.isUndo = true;
        // 撤销dom操作
        const mutations = [...nodeRecord.value];
        // 从最后一步dom反过来按顺序操作
        mutations.reverse();
        mutations.forEach((record: MutationData, i: number) => {
          if (record.type === MutationType.Node) {
            revokeNodes(record);
          } else if (record.type === MutationType.Text) {
            revokeTexts(record);
          } else if (record.type === MutationType.Attr) {
            revokeAttrs(record);
          }
        });

        // 重置范围选区
        this.resetRange('prev');
      }
    }
  }
}


/**
 * 插入DOM节点
 * @param targetNode 操作dom时的目标节点
 * @param data 节点数据
 * @param list 要处理的节点
 */
function insertNodes(targetNode: Node, data: MutationNode, list: Array<Node>) {
  const { type } = data;
  const reference = data.target;
  // 需要插入的节点在target前面
  if (type === 'insertBefore') {
    if (reference.nextSibling) {
      list.forEach((item: Node) => targetNode.insertBefore(item, reference.nextSibling));
    } else {
      list.forEach((item: Node) => targetNode.appendChild(item));
    }
  } else if (type === 'insertAfter') {
    list.forEach((item: Node) => targetNode.insertBefore(item, reference));
  } else {
    list.forEach((item: Node) => reference.appendChild(item));
  }
}

/**
 * 删除DOM节点
 * @param targetNode 删除父节点
 * @param list 要处理的节点
 */
function deleteNodes(targetNode: Node, list: Array<Node>) {
  list.forEach((node: Node) => {
    targetNode.removeChild(node);
  });
}

/**
 * 撤销操作属性
 * @param record
 */
export function revokeAttrs(record: MutationData) {
  const target = record.target as HTMLElement;
  if (record.oldValue === null) {  // 如果上次属性是不存在的
    // 移除属性值
    target.removeAttribute(record.attr);
  } else {
    target.setAttribute(record.attr, record.oldValue);
  }
}

/**
 * 恢复dom节点操作
 * @param record
 */
export function restoreNodes(record: MutationData) {
  try {
    // 如果原先是添加节点现在修改为删除
    deleteNodes(record.target, record.nodes.removedNodes);
    // 如果原先是删除现在修改为添加
    insertNodes(record.target, record.nodes, record.nodes.addedNodes);
  } catch (e) {
    console.log(e);
  }
}

/**
 * 恢复文本操作
 * @param record
 */
export function restoreTexts(record: MutationData) {
  record.target.textContent = record.value;
}

/**
 * 恢复属性操作
 * @param record
 */
export function restoreAttrs(record: MutationData) {
  (record.target as HTMLElement).setAttribute(record.attr, record.value as string);
}

/**
 * 撤销操作节点
 * @param record
 */
export function revokeNodes(record: MutationData) {
  try {
    // 如果原先是添加节点现在修改为删除
    deleteNodes(record.target, record.nodes.addedNodes);
    // 如果原先是删除现在修改为添加
    insertNodes(record.target, record.nodes, record.nodes.removedNodes);
  } catch (e) {
    console.log(e);
  }
}

/**
 * 撤销文本内容
 * @param record
 */
export function revokeTexts(record: MutationData) {
  record.target.textContent = record.oldValue;
}

/**
 * 类型转换
 * @param record 
 */
 export function transformType(record: MutationRecord) {
  switch(record.type) {
    case 'childList': {
      return MutationType.Node;
    }
    case 'attributes': {
      return MutationType.Attr;
    }
    case 'characterData': {
      return MutationType.Text;
    }
    default: return '';
  }
}

/**
 * 内容转换
 * @param record 
 */
export function transformValue(record: MutationRecord) {
  switch (record.type) {
    case 'attributes':
      return (record.target as HTMLElement).getAttribute(record.attributeName as string) || '';
    case 'characterData':
      return record.target.textContent;
    default: return '';
  }
}

/**
 * 变动节点
 * @param record 
 */
export function transformNodes(record: MutationRecord): MutationNode {
  let type;
  let target;

  if (record.previousSibling) {
    type = 'insertBefore';
    target = record.previousSibling;
  } else if (record.nextSibling) {
    type = 'insertAfter';
    target = record.nextSibling;
  } else {
    type = 'appendChild';
    target = record.target;
  }

  return {
    addedNodes: Array.from(record.addedNodes), // 增加节点
    removedNodes: Array.from(record.removedNodes), // 删除节点
    type, // 插入节点方式
    target, // 出现此操作的目标对象
  };
}
