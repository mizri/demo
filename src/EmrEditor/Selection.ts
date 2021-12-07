import { Selector } from './utils/DOMQuery';

interface Options {
  editorDOM: HTMLDivElement
}

export type RangeValueOf = {
  start: [Node, number],
  end: [Node, number],
  collapsed: boolean,
  root: Node,
}

export class Selection {
  // 当前的范围选区
  currentRange: Range | null | undefined = null
  // 编辑器dom
  editorDOM: HTMLDivElement | null = null

  /**
   * 绑定事件
   * @param options 参数
   * @returns 
   */
  bindEvent(options: Options) {
    this.editorDOM = options.editorDOM;
    // 绑定范围选择事件
    document.addEventListener('selectionchange', this.onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', this.onSelectionChange);
    }
  }

  /**
   * 监听选区改变
   */
  onSelectionChange = () => {
    // return this.saveRange();
  }

  saveRange(range?: Range) {
    if (range) {
      // 保存已有选区
      this.currentRange = range
    } else {
      try {
        // 获取当前的选区
        const range = this.getRange();
        if (range && this.editorDOM === document.activeElement) {
          // 获取选区范围dom,防止保存了错误的选区
          this.saveRange(range);
        }
      } catch(e) {

      }
    }
  }

  /**
   * 获取范围
   */
  getSelection() {
    return window.getSelection() || document.getSelection();
  }

  /**
   * 获取当前选区范围
   * @returns 范围
   */
  getRange() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount) {
      return selection.getRangeAt(0);
    }
    return null;
  }

  /**
   * 设置范围
   * @param options 
   */
  setRange(options: RangeValueOf) {
    if (this.currentRange) {
      this.currentRange.setStart(...options.start);
      this.currentRange.setEnd(...options.end);
      // if (options.collapsed) {
      //   this.currentRange.collapse(options.collapsed);
      // }
    }
  }

  /**
   * 获取选区范围的dom元素
   * @param range 选区范围
   */
  getRangeInElement(range: Range) {
    return range.commonAncestorContainer.parentNode;
  }

  /**
   * 构造函数
   * @param $element dom元素
   * @param isContent 是否选中元素还是元素子元素 true:是 false:否
   * @param collapsed 是否折叠选区 true:是 false:否
   * @return DOMQeury
   */
  createRangeByElement(element: Selector, isContent?: boolean, collapsed?: boolean): void {
    // 创建一个范围
    const range = document.createRange();
    // 判断选中
    isContent ? range.selectNodeContents(element as Node) : range.selectNode(element as Node);
    // 如果需要折叠
    if (collapsed) {
      range.collapse(collapsed);
    }
    // 保存当前选区；
    this.saveRange(range);
  }

  /**
   * 通过范围删除元素
   * @param elem dom元素
   */
  selectRangeByEelment(elem: any, toStart?: any, isContent?: boolean): void {
    
    const range = document.createRange()
    if (isContent) {
      range.selectNodeContents(elem)
    } else {
      // 如果用户没有传入 isContent 参数，那就默认为 false
      range.selectNode(elem);
    }

    if (toStart != null) {
      // 传入了 toStart 参数，折叠选区。如果没传入 toStart 参数，则忽略这一步
      range.collapse(toStart);
      if (!toStart) {
        this.saveRange(range);
        // this.editor.selection.moveCursor(elem)
      }
    }

    // 存储 range
    this.saveRange(range);
  }

  /**
   * 移除所有选区
   */
  removeSelection() {
    // 获取选区
    const selection = this.getSelection();
    // 清除选区
    if (selection) {
      selection.removeAllRanges();
    }
  }

  /**
   * 恢复选区范围
   */
  restoreSelection() {
    // 获取选区
    const selection = this.getSelection();
    // 清除选区
    if (selection) {
      selection.removeAllRanges();
      // 如果存在范围
      if (this.currentRange) {
        selection.addRange(this.currentRange);
      }
    }
  }

  /**
   * 将当前range转为普通对象
   * @returns 
   */
  rangeValueof(): RangeValueOf | null {
    const range = this.getRange();
    if (range) {
      return {
        start: [range.startContainer, range.startOffset],
        end: [range.endContainer, range.endOffset],
        root: range.commonAncestorContainer,
        collapsed: range.collapsed,
      }
    }
    return null;
  }
}

export default new Selection();