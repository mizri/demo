
import Selection from './Selection';
import $ from './utils/DOMQuery';

// 将标签替换为css
document.execCommand('styleWithCSS', false, 'true');

/**
 * 执行富文本操作
 * @param name 命令
 * @param value 值
 */
export function execCommand(name: string, value: string): void {
  document.execCommand(name, false, value);
}

/**
 * 返回是否存在命令
 * @param name 命令
 * @returns 
 */
export function execCommandValue(name: string): string {
  return document.queryCommandValue(name);
}

/**
 * 返回 指定命令 在对象内的状态码
 * 1表示指定命令在对象内已执行
 * 0表示指定命令在对象内未执行，处于可执行状态
 * -1表示指定命令在对象内处于不可用状态
 * @param name 
 */
export function execCommandState(name: string): boolean {
  return document.queryCommandState(name);
}

/**
 * 确定浏览器是否支持指定的编辑指令
 * @param name 命令
 * @returns 
 */
export function execCommandSupported(name: string): boolean {
  return document.queryCommandSupported(name);
}

/**
 * 插入html字符串
 * @param html html字符串
 */
export function execInsertHTML(html: string): void {
  const range = Selection.getRange();
  // 如果不存在范围选区
  if (!range) return;
  // 非IE
  if (execCommandSupported('insertHTML')) {
    execCommand('insertHTML', html);
  } else { // IE插入
    // 首先删除选区选中的内容
    range.deleteContents();
    // 创建dom
    const $element = $(html);
    // 判断插入纯文本还是html
    if ($element.length) {
      execInsertElement($element.get(0));
    } else {
      // 插入纯文本
      range.insertNode(document.createTextNode(html));
    }
  }
}

export function execInsertElement(dom: HTMLElement | Node) {
  const range = Selection.getRange();
  // 如果不存在范围选区
  if (!range) return;

  range.deleteContents();
  range.insertNode(dom);
}

/**
 * 执行富文本命令
 * @param name 命令
 * @param value 命令值
 * @returns 
 */
export function exec(name: string, value?: any): void {
  // 选区
  const selection = window.getSelection();
  // 如果不存在选区就不执行任何命令
  if (!selection) {
    return;
  }

  if (name === 'inserHTML') { // 插入html
    execInsertHTML(value as string);
  } else if (name === 'insertElement') { // 插入元素
    execInsertElement(value as HTMLElement)
  } else {
    document.execCommand(name, false, value);
  }
}