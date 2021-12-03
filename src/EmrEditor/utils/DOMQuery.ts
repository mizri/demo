
// import { HTML_TAG_REG } from '../constant';
import classnames from 'classnames';

export type Selector = 
  | string
  | Document
  | Node
  | NodeList
  | ChildNode
  | ChildNode[]
  | Element
  | HTMLElement
  | HTMLElement[]
  | HTMLCollection
  | EventTarget
  | null
  | undefined
  | DOMQuery<any>;

interface ClsObjType {
  [propName: string]: boolean;
}

function toArray(elements: NodeList) {
  return Array.prototype.slice.call(elements);
}

export class DOMQuery<T extends Selector>{
  // 选择器
  selector: T;
  // 选择器数量
  length: number = 0;
  // 真实dom节点数组
  elements: Array<HTMLElement>; // HTMLElement[]

  constructor(selector: T) {
    this.elements = [];
    this.selector = selector;
    // 如果是DOMQuery实例直接返回
    if (selector instanceof DOMQuery) {
      return selector;
    }

    // 判断是否是dom元素
    const nodeType = selector instanceof Node ? selector.nodeType : -1;
    // 如果是element元素或文档节点
    if ([1, 9].indexOf(nodeType) > -1) {
      this.elements = [selector as HTMLElement];
    } else if (selector instanceof Array) { // 如果是元素数组
      this.elements = selector as HTMLElement[];
    } else if (typeof selector === 'string') { // 如果是普通的选择器
      const sel = selector.replace(/\n/img, '').trim() as string;
      // 如果是标签选择器,创建一个选择器
      if (/<.+>$/img.test(sel)) {
        this.elements.push(this.createDOMByHTML(sel) as HTMLElement);
      } else {
        this.elements = toArray(document.querySelectorAll(sel));
      }
    }

    // 设置长度
    this.length = this.elements.length;
  }

  /**
   * 通过html创建DOM
   * @param selecor 选择器
   */
  createDOMByHTML(selector: Selector) {
    const $div = document.createElement('div');
    // 创建标签
    $div.innerHTML = selector as string;

    return $div.firstElementChild;
  }

  /**
   * 循环
   * @param fn 回调方法
   * @return DOMQeury
   */
  forEach(fn: (element: HTMLElement, index?: number) => void): DOMQuery<T> {
    for (let i = 0; i < this.length; i++) {
      fn.call(null, this.elements[i], i);
    }
    return this;
  }

  /**
   * some方法
   * @param fn 
   * @returns 
   */
  some(fn: (element: HTMLElement, index?: number) => boolean): boolean {
    return this.elements.some(fn);
  }

  /**
   * 最有一个非空标签即倒数第一个标签
   */
  lastNotEmpty() {
    return $(this.elements[this.length - 2]);
  }

  /**
   * 获取对应索引的元素
   * @param index 索引
   */
  get(index: number): HTMLElement {
    return this.elements[index] || null;
  }

  /**
   * 找到最后一个节点
   * @returns 
   */
  last(): HTMLElement {
    return this.elements[this.length - 1];
  }

  /**
   * 插入子节点
   * @param childNodes 子节点
   */
  prependChild(childNodes: any) {
    // 找到最后一个节点
    const last = this.childNodes().last();
    // 如果不是数组转换为数组
    if (childNodes instanceof DOMQuery) {
      childNodes = childNodes.elements;
    } else if (!(childNodes instanceof Array)) {
      childNodes = [childNodes];
    }

    // 插入节点
    this.elements.forEach((element) => {
      childNodes.forEach((node: any) => {
        element.insertBefore(node, last);
      })
    });
  }

  /**
   * 插入子节点
   * @param childNodes 子节点
   */
  appendChild(childNodes: any) {
    // 如果不是数组转换为数组
    if (childNodes instanceof DOMQuery) {
      childNodes = childNodes.elements;
    } else if (!(childNodes instanceof Array)) {
      childNodes = [childNodes];
    }
    // 插入节点
    this.elements.forEach((element) => {
      childNodes.forEach((node: any) => {
        element.appendChild(node);
      })
    });

    return this;
  }

  /**
   * 插入html
   * @param text 要插入的内容
   */
  html(text?: string): DOMQuery<any> | string {
    if (text) {
      this.elements.forEach(($element) => {
        $element.innerHTML = text;
      });
      return this;
    }
    return this.elements[0].innerHTML;
  }

  /**
   * 获取纯文本内容
   * @param text 
   */
  text(text?: string) {
    if (text) {
      this.elements.forEach(($element) => {
        $element.textContent = text;
      });
      return this;
    }
    return this.elements[0].textContent;
  }

  /**
   * 查询所有的子节点
   */
  childNodes(): DOMQuery<any> {
    const result = this.elements.map((node) => {
      return toArray(node.childNodes);
    });

    return $(result.flat());
  }

  /**
   * 获取标签
   */
  parent() {
    return $(this.elements[0].parentNode);
  }

  /**
   * 获取相邻元素
   */
  sibling() {
    // 获取相邻标签
    return $(this.elements[0].nextSibling);
  }
  
  /**
   * 添加或删除class
   * @param cslObj class名称
   */
  toggleClass(cslObj: ClsObjType): void {
    // 设置class
    this.elements.forEach((element) => {
      $.toggleClass(element, cslObj);
    });
  }
}

export default function $(selector: Selector) {
  return new DOMQuery(selector);
}

/**
  * 找到指定元素父元素为selector选择器的元素
  * @param  {[type]} el       [description]
  * @param  {[type]} selector [description]
  * @return {[type]}          [description]
  */
$.closet = function closet(el: HTMLElement | null, selector: string) {
 while (el) {
   if (el.matches(selector)) {
     break;
   }
   el = el.parentElement;
 }
 return el;
}

/**
 * 设置对象
 * @param element 元素
 * @param cslObj css对象
 */
$.toggleClass = function toggleClass(element: HTMLElement, cslObj: ClsObjType) {
  cslObj = { ...cslObj };
  // 当前的样式名称
  const currClsNames = element.getAttribute('class')?.split(/\s+/);
  // 设置样式名称
  (currClsNames || []).forEach((name) => {
    if (name && !cslObj.hasOwnProperty(name)) {
      cslObj[name] = true;
    }
  });
  element.setAttribute('class', classnames(cslObj));
}

/**
 * 在目标元素前插入
 * @param element 要插入的对象
 * @param target 目标对象
 */
$.insertBefore = function insertBefore(element: any, target: any) {
  target.parentElement?.insertBefore(element, target);
}

/**
 * 在目标元素后
 * @param element 要插入的对象
 * @param target 目标对象
 */
$.insertAfter = function insertAfter(element: any, target: any) {
  if (target.nextElementSibling) {
    $.insertBefore(element, target.nextElementSibling);
  } else {
    target.parentElement.appendChild(element);
  }
}

$.appendChild = function append(element: any, target: any) {
  target.appendChild(element);
}

$.prependChild = function prepend(element: any, target: any) {
  if (target.firstElementChild) {
    $.insertBefore(element, target.firstElementChild);
  } else {
    $.appendChild(element, target)
  }
}