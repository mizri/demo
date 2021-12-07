
import $ from './utils/DOMQuery'

export type Callback = (event: any) => void;

interface EventHooks<T> extends Array<any> {
  [index: number]: T;
}

// -------------------------------编辑器相关操作事件------------------
export enum EventType {
  Undo /*              */ = 'undo', // 撤销
  Redo /*              */ = 'redo', // 恢复
  Enter /*             */ = 'enter', // 回车
  Click /*             */ = 'click', // 点击
  Delete /*            */ = 'delete',// 删除
  Change /*            */ = 'change', // 文本改变
  CompositionStart/*   */ = 'compositionStart', // 开始中文输入
  CompositionEnd/*     */ = 'compositionEnd', // 结束中文输入
  // GlobalClick /*   */ = 'globalClick', // 全局点击
};

// 编辑器事件对应的keycode码
export const EVENT_KEY_CODE_BACKSAPCE /*   */ = 8; // backspace 键
export const EVENT_KEY_CODE_DELTE /*       */ = 46; // delete 键
export const EVENT_KEY_CODE_ENTER /*       */ = 13; // 回车 键
export const EVENT_KEY_CODE_Z /*           */ = 90; // 字母 z
// ----------------------------------------------------------------


// -----------------------------自定义事件---------------------------
export enum CustomEventType {
  FullScreen /*           */ = 'fullScreen', // 全屏
  TooggleContentEdit/*    */ = 'disableContentEditable', // 切换编辑器是否可编辑
  CreateTable /*          */ = 'createTable', // 创建表格
}
// ----------------------------------------------------------------


// -----------------------------全文档事件委托-----------------------
export enum DelegationEventType {
  MouseMove /*    */ = 'mousemove', // 鼠标移动
  MouseDown /*    */ = 'mousedown', // 鼠标按下
  MouseUp /*      */ = 'mouseup', // 鼠标抬起
  MouseOver /*    */ = 'mouseover', // 鼠标over
  Click /*        */ = 'click', // 点击事件
  ContextMenu /*  */ = 'contextmenu', // 右键菜单
}
// ----------------------------------------------------------------

// 事件中心
export class EventHandler {
  contentDOM: HTMLElement | null = null
  $content: any  
  // 自定义事件回调集合
  customEventHooksFullScreen: /*            */ EventHooks<Callback> = [] // 全屏
  customEventHooksTooggleContentEdit: /*    */ EventHooks<Callback> = [] // 禁用编辑状态
  customEventHooksCreateTable: /*           */ EventHooks<Callback> = [] // 创建表格

  // 编辑器相关操作事件回调集合
  eventHooksUndo: /*                */ EventHooks<Callback> = [] // 撤销回调事件集合
  eventHooksRedo: /*                */ EventHooks<Callback> = [] // 恢复回调事件集合
  eventHooksEnter: /*               */ EventHooks<Callback> = [] // 回车回调事件集合
  eventHooksClick: /*               */ EventHooks<Callback> = [] // 点击回调事件集合
  eventHooksDelete: /*              */ EventHooks<Callback> = [] // 删除回调事件集合
  eventHooksKeyChange: /*           */ EventHooks<Callback> = [] // 普通键盘输入回调事件集合
  eventHooksCompositionStart: /*    */ EventHooks<Callback> = [] // 开始中文输入回调事件集合
  eventHooksCompositionEnd: /*      */ EventHooks<Callback> = [] // 开始中文输入回调事件集合

  // 全文档事件委托回调
  eventHooksDelegationClick: /*       */ EventHooks<Callback> = [] // 委托点击
  eventHooksDelegationMouseMove: /*   */ EventHooks<Callback> = [] // 委托移动
  eventHooksDelegationMouseDown:/*    */ EventHooks<Callback> = [] // 委托按下
  eventHooksDelegationMouseUp: /*     */ EventHooks<Callback> = [] // 委托弹起
  eventHooksDelegationMouseOver: /*   */ EventHooks<Callback> = [] // 委托over
  eventHooksDelegationContextMenu: /* */ EventHooks<Callback> = [] // contextMenu

  constructor() {
    this.initEventDelegationBind();
  }

  /**
   * 初始化全局绑定
   */
  initEventDelegationBind() {
    window.onload = () => {
      // 绑定全局点击事件
      document.body.addEventListener(DelegationEventType.Click, this.onDelegationEventExec);
      // 绑定全局鼠标移动事件
      document.body.addEventListener(DelegationEventType.MouseMove, this.onDelegationEventExec);
      // 绑定全局鼠标按下
      document.body.addEventListener(DelegationEventType.MouseDown, this.onDelegationEventExec);
      // 绑定全局鼠标抬起
      document.body.addEventListener(DelegationEventType.MouseUp, this.onDelegationEventExec);
      // 绑定全局over
      document.body.addEventListener(DelegationEventType.MouseOver, this.onDelegationEventExec);
      // 右键菜单
      document.body.addEventListener(DelegationEventType.ContextMenu, this.onDelegationEventExec);
    }

    return () => {
      document.body.removeEventListener(DelegationEventType.Click, this.onDelegationEventExec);
      document.body.removeEventListener(DelegationEventType.MouseMove, this.onDelegationEventExec);
      document.body.addEventListener(DelegationEventType.MouseDown, this.onDelegationEventExec);
      document.body.addEventListener(DelegationEventType.MouseUp, this.onDelegationEventExec);
      document.body.addEventListener(DelegationEventType.ContextMenu, this.onDelegationEventExec);
    }
  }

  /**
   * 相关事件回调
   * @param event 事件对象
   */
  onDelegationEventExec = (event: MouseEvent) => {
    const queue = this.switchDelegationQueue(event.type as DelegationEventType);
    
    // 执行
    queue.length && queue.forEach((func) => {
      func.call(null, event);
      // if (event.button === 2) {
      //   event.preventDefault();
      //   event.stopPropagation();
      // }
    });
  }

  /**
   * 事件委托
   * @param delegationEventType 事件类型
   * @param callback 回调
   */
  delegation(delegationEventType: DelegationEventType, callback: Callback) {
    const queue = this.switchDelegationQueue(delegationEventType);
    const index = queue.push(callback);

    return () => {
      // 删除事件
      queue.splice(index, 1);
    }
  }

  /**
   * 根据事件类型判断事件委托
   * @param delegationEventType 事件类型
   */
  switchDelegationQueue(delegationEventType: DelegationEventType): EventHooks<Callback> {
    let queue: EventHooks<Callback> = [];

    switch (delegationEventType) {
      case DelegationEventType.Click: {
        queue = this.eventHooksDelegationClick;
        break;
      }
      case DelegationEventType.MouseMove: {
        queue = this.eventHooksDelegationMouseMove;
        break;
      }

      case DelegationEventType.MouseDown: {
        queue = this.eventHooksDelegationMouseDown;
        break;
      }

      case DelegationEventType.MouseUp: {
        queue = this.eventHooksDelegationMouseUp;
        break;
      }

      case DelegationEventType.MouseOver: {
        queue = this.eventHooksDelegationMouseOver;
        break;
      }

      case DelegationEventType.ContextMenu: {
        queue = this.eventHooksDelegationContextMenu;
        break;
      }
    }

    return queue
  }
  

  //----------------------------------------------------------------
  // 以下为编辑操作相关事件注册
  //----------------------------------------------------------------

  /**
   * 注册自定义事件
   * @param customEventType 自定义事件类型
   * @param callback 回调事件
   */
  subscribe(customEventType: CustomEventType, callback: Callback) {
    const queue = this.switchCustomQueue(customEventType);
    // 插入对应的队列
    const index = queue.push(callback);
    return () => {
      // 删除事件
      queue.splice(index, 1);
    }
  }

  /**
   * 发布自定义事件
   * @param customEventType 自定义事件类型
   * @param options 自定义回调参数
   */
  publish(customEventType: CustomEventType, ...options: any) {
    const queue = this.switchCustomQueue(customEventType);
    queue.forEach((func) => func.call(null, ...options));
  }

  /**
   * 根据事件类型判断自定义事件队列
   * @param customEventType 自定义事件类型
   */
  switchCustomQueue(customEventType: CustomEventType): EventHooks<Callback> {
    let queue: EventHooks<Callback> = [];
    switch (customEventType) {
      case CustomEventType.FullScreen: {
        queue = this.customEventHooksFullScreen;
        break;
      }
      case CustomEventType.TooggleContentEdit: {
        queue = this.customEventHooksTooggleContentEdit;
        break;
      }
      case CustomEventType.CreateTable: {
        queue = this.customEventHooksCreateTable;
      }
    }

    return queue
  }

  //----------------------------------------------------------------
  // 以下为编辑操作相关事件注册
  //----------------------------------------------------------------
  /**
   * 注册对应的DOM事件类型
   * @param eventType 事件类型
   * @param callback 事件回调
   */
  on(eventType: EventType, callback: Callback) {
    const queue = this.switchEventQueue(eventType);
    // 插入对应的队列
    const index = queue.push(callback);

    return () => {
      // 删除事件
      queue.splice(index, 1);
    }
  }

  /**
   * 解绑
   * @param eventType 事件类型
   */
  off(eventType?: EventType) {
    const queue = this.switchEventQueue(eventType);
    // 如果存在就清空
    if (queue.length) {
      queue.length = 0;
    } else {
      this.eventHooksDelete = [];
      this.eventHooksEnter = [];
      this.eventHooksClick = [];
      this.eventHooksUndo = [];
      this.eventHooksRedo = [];
      this.eventHooksKeyChange = [];
      this.eventHooksCompositionStart = [];
      this.eventHooksCompositionEnd = [];
    }

  }

  /**
   * 根据事件类型判断编辑器操作队列
   * @param eventType 编辑器操作事件类型
   */
  switchEventQueue(eventType?: EventType): EventHooks<Callback> {
    let queue: EventHooks<Callback> = [];
    switch (eventType) {
      case EventType.Delete: {
        queue = this.eventHooksDelete;
        break;
      }
      case EventType.Change: {
        queue = this.eventHooksKeyChange;
        break;
      }
      case EventType.Undo: {
        queue = this.eventHooksUndo;
        break;
      }
      case EventType.Redo: {
        queue = this.eventHooksRedo;
        break;
      }
      case EventType.CompositionStart: {
        queue = this.eventHooksCompositionStart;
        break;
      }
      case EventType.CompositionEnd: {
        queue = this.eventHooksCompositionEnd;
        break;
      }
      default: {
        queue = []
      }
    }

    return queue;
  }

  // 自定义发布订阅
  /**
   * 执行回调函数
   * @param queues 回调队列
   */
  callQueuestack(queues: EventHooks<Callback>, event: any) {
    queues.forEach((func) => func.call(null, event))
  }

  // 以下是dom事件回调
  /**
   * 点击事件
   * @param event 事件对象
   */
  onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    this.eventHooksClick.forEach((func) => {
      func.call(null, event);
    });
  }

  /**
   * 中文输入开始
   */
  onCompositionStart = () => {
    this.eventHooksCompositionStart.forEach((func) => {
      func.call(null);
    });
  }

  /**
   * 中文输入结束
   */
   onCompositionEnd = () => {
    this.eventHooksCompositionEnd.forEach((func) => {
      func.call(null);
    });
  }

  /**
   * 键盘按下
   * @param event 事件对象
   */
  onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // 判断keyCode对应事件
    switch (event.keyCode) {
      // delete 与 back
      case EVENT_KEY_CODE_DELTE:
      case EVENT_KEY_CODE_BACKSAPCE: {
        // 处理所有的删除事件
        this.callQueuestack(this.eventHooksDelete, event);
        break;
      }
      case EVENT_KEY_CODE_ENTER: {
        // 处理所有的回车事件
        this.callQueuestack(this.eventHooksEnter, event);
        break;
      }
      // 处理撤销与恢复键
      case EVENT_KEY_CODE_Z: {
        // 判断是否撤销或恢复
        if (event.ctrlKey || event.metaKey) {
          // shift键摁下恢复 否则撤销 
          event.shiftKey
            ?
              this.callQueuestack(this.eventHooksRedo, event)
            :
              this.callQueuestack(this.eventHooksUndo, event);
          event.preventDefault();
          event.stopPropagation();
        } else {
          this.callQueuestack(this.eventHooksKeyChange, event);
        }
        break; 
      }
      default: {
        break;
      }
    }
  }

  /**
   * 键盘弹起
   * @param event 事件对象
   */
   onKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      [
        EVENT_KEY_CODE_DELTE,
        EVENT_KEY_CODE_BACKSAPCE,
        EVENT_KEY_CODE_ENTER
      ].indexOf(event.keyCode) === -1
    ) {
      this.callQueuestack(this.eventHooksKeyChange, event);
    }
    // this.eventHooksClick.forEach((func) => {
    //   func.call(null, event);
    // });
  }
}

export default new EventHandler();