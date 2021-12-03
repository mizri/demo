import React from 'react';
import Placeholder from './Placeholder';
import $, { DOMQuery } from '../utils/DOMQuery';
import { debounce } from '../utils';
import Selection from '../Selection';
import History from '../History';
import MutationDOM from '../MutationDOM';
import EventHandler, { EventType, CustomEventType } from '../EventHandler';
import * as Command from '../Command';
import Table from './Table';
import {
  classPrefix, ReactRef, LAST_EMPTY_REG,
  EMPTY_P_TAG, EMPTY_P_BR_TAG,
  // EDITOR_DEFAULT_WIDTH, EDITOR_DEFAULT_HEIGHT
} from '../constant';
import './index.less';

export type ContentProps = {
  innerHTML?: string;
}

export type ContentState = {
  visible: boolean;
}

export default class Content extends React.Component<ContentProps, ContentState> {
  static defaultProps: ContentProps = {
    innerHTML: '', // 编辑内容
  }

  state: ContentState = {
    visible: false, // 是否显示placeholder
  }

  // 历史记录
  history: History
  // 当前正在进行的操作
  operator: EventType | null = null
  // 编辑器dom实例
  contentDOMRef: ReactRef<HTMLDivElement | null>
  contentDOM: HTMLDivElement | null = null
  $contentDOM: DOMQuery<any> | null = null
  

  constructor(props: ContentProps) {
    super(props);
    // 编辑器dom实例
    this.contentDOMRef = React.createRef();
    // 历史记录
    this.history = History.create();
    // 初始化表格事件绑定
    Table.initialize();
  }


  componentDidMount() {
    this.contentDOM = this.contentDOMRef.current;
    this.$contentDOM = $(this.contentDOM);
    // 初始化选区绑定
    Selection.bindEvent({ editorDOM: this.contentDOM as HTMLDivElement });
    // 订阅删除事件
    EventHandler.on(EventType.Delete, this.onDelete);
    // 订阅输入事件
    EventHandler.on(EventType.Change, this.onChange);
    // 订阅恢复
    EventHandler.on(EventType.Redo, this.onRedoContent);
    // 订阅撤销
    EventHandler.on(EventType.Undo, this.onUndoContent);
    // 订阅创建表格事件
    EventHandler.subscribe(CustomEventType.CreateTable, this.onCreateTable);
    // 初始化DOM观察
    MutationDOM.observe(this.contentDOM as Node);
    // 绑定删除事件
    MutationDOM.subscribe(this.onSaveContent);
  }

  /**
   * 初始化选中
   */
  initialize(): void {
    // 初始化编辑器内容
    this.initHTML();
    // 创建包裹标签
    this.initHasWrapper();
    // 创建空位
    this.createEmpty();
    // 定位鼠标位置
    this.initSelection();
  }

  /**
   * 初始化编辑器内容
   */
  initHTML() {
    const $content = this.$contentDOM;
    const { innerHTML } = this.props;
    // 设置内容
    $content!.html(innerHTML);
  }

  /**
   * 初始化范围定位光标
   */
  initSelection() {
    const $children = this.$contentDOM!.childNodes();
    // 选中最有一个非空标签
    let $last = $children.lastNotEmpty();
    // 如果不存在也就是html内容为空
    if (!$last.length) $last = $(EMPTY_P_BR_TAG);
    // 插入
    this.$contentDOM!.prependChild($last);
    // 从末尾开始找到不是第一个不是空标签的位置，设置范围
    Selection.createRangeByElement($last.get(0), true, true);
    // 将范围添加到页面
    Selection.restoreSelection();
  }

  /**
   * 如果初始化传入的文本有节点没有被p标签包裹
   * 需要用p标签包裹
   */
  initHasWrapper() {
    const $content = $(this.contentDOMRef.current);
    // 获取编辑器内容区域的所有子节点
    const $contentChildNodes = $content.childNodes();
    // 判断所有的子节点是否被p标签包裹
    const isNotAllWrapByPTag = $contentChildNodes.some((node) => {
      return node.nodeType !== 1 || node.nodeName !== 'P';
    });
    // 如果存在没有被p包裹的标签
    if (isNotAllWrapByPTag) {
      // throw new Error('every node must be wrapped by `p` tag');
    }
  }

  /**
   * 如果最后一位不是<p><br /></p>标签
   * 创建空位置
   */
  createEmpty() {
    const $content = $(this.contentDOMRef.current);
    // 文本内容
    const contentHTML = $content.html() as string;
    // 判断是否存在空标签
    if (!this.testEmptyTag(contentHTML)) {
      $content.appendChild($(EMPTY_P_BR_TAG));
      // 显示palceholder
      this.setState({ visible: true });
    };
  }

  /**
   * 判断空标签
   */
  testEmptyTag(html: string): boolean {
    return LAST_EMPTY_REG.test(html.replace(/\r\n\s/img, ''));
  }

  /**
   * 内容输入改变时
   */
  onChange = () => {
    if (this.contentDOM!.textContent && this.state.visible === true) {
      this.setState({ visible: false });
    }
  }

  /**
   * 删除内容
   */
  onDelete = debounce(() => {
    const $content = this.$contentDOM;
    // 获取html与纯文本
    const html = $content!.html();
    const text = $content!.text();
    // 如果text内容已经是空的 && html不包含<p><br></p> 标签
    if (!text && !this.testEmptyTag(html as string)) {
      // 插入空标签
      Command.exec('innerHTML', EMPTY_P_BR_TAG);
      // 显示palceholder
      this.setState({ visible: true });
    } else {

    }
  }, 150)

  /**
   * 保存内容
   */
  onSaveContent = (mutations: MutationRecord[], observer: MutationObserver) => {
    if (this.operator === null) {
      this.history.save(this.contentDOM!.innerHTML);
    }
  }

  /**
   * 恢复内容
   */
  onRedoContent = () => {
    this.resetOperator(EventType.Redo);
    const data = this.history.restore();
    if (data) {
      this.contentDOM!.innerHTML = data!.value;
    }
    this.resetOperator(null, 1);
  }

  /**
   * 撤销内容
   */
  onUndoContent = () => {
    this.resetOperator(EventType.Undo);
    const data = this.history.revoke();
    if (data) {
      this.contentDOM!.innerHTML = data!.value;
    }
    this.resetOperator(null, 1);
  }

  /**
   * 重置当前操作状态
   * @param value 值
   * @param immediate 立刻执行间隔
   */
  resetOperator(value: EventType | null, immediate: number = 0) {
    if (immediate) {
      setTimeout(() => {
        this.operator = value;
      }, immediate)
    } else {
      this.operator = value;
    }
  }

  /**
   * 创建表格
   * @param options 
   */
  onCreateTable(options: any) {
    // 创建表格
    const tableRef = Table.create(options);
    // 恢复选区
    Selection.restoreSelection();
    // 插入表格
    Command.exec('insertElement', tableRef.parentElement);
    // 处理表格选区
    Table.restoreTableSelect(tableRef);
  }

  render() {
    // const { children } = this.props;
    const { visible } = this.state;

    return (
      <div
        className={`${classPrefix}-content`}
      >
        <div className={`${classPrefix}-section`}
          // style={{
          //   width: EDITOR_DEFAULT_WIDTH,
          //   height: EDITOR_DEFAULT_HEIGHT,
          // }}
        >
          <div className={`${classPrefix}-text`}
            onClick={EventHandler.onClick}
            onKeyDown={EventHandler.onKeyDown}
            onKeyUp={EventHandler.onKeyUp}
            ref={this.contentDOMRef}
            contentEditable
          />
          {/* 内容为空时placeholder */}
          <Placeholder visible={visible} />
        </div>
      </div>
    );
  }
}