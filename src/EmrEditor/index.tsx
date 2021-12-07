import React from 'react';
import classnames from 'classnames';
import Toolbar from './Toolbar';
import Content from './Content';
import EventHandler, { CustomEventType } from './EventHandler';
import { classPrefix, ReactRef } from './constant';
import './index.less';

export type EmrEditorProps = {
  mode?: number;
  innerHTML?: string;
}

export type EmrEditorState = {
  isFull: boolean;
}

export default class EmrEditor extends React.Component<EmrEditorProps, EmrEditorState> {
  static defaultProps: EmrEditorProps = {
    mode: 1, // 默认编辑模式
    innerHTML: '', // 默认编辑内容
  }

  state: EmrEditorState = {
    isFull: false,
  }

  // 正文组件实例
  contentRef: ReactRef<any>;
  // 解绑事件委托
  unDelegationBind: any

  constructor(props: EmrEditorProps) {
    super(props);
    // 创建正文实例
    this.contentRef = React.createRef();
    // 初始化全局事件委托
    this.unDelegationBind = EventHandler.initEventDelegationBind();
    // 订阅全屏窗口
    EventHandler.subscribe(CustomEventType.FullScreen, this.onToggleFullScreen);
  }

  componentDidMount() {
    // 初始化编辑器
    // this.contentRef.current.initialize();
  }

  componentWillUnmount() {
    this.unDelegationBind();
  }

  /**
   * 全屏
   * @param isFull 是否全屏
   */
  onToggleFullScreen = (isFull: boolean): void => {
    this.setState({ isFull });
  }

  render() {
    const { isFull } = this.state;
    const { mode, innerHTML } = this.props;

    return (
      <div className={classnames(classPrefix, { 'is-full': isFull })}>
        {/* 使用模式不显示工具条 */}
        {mode === 1 && <Toolbar />}
        {/* 主内容区域 */}
        <Content ref={this.contentRef} innerHTML={innerHTML} />
      </div>
    );
  }
}