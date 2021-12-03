import React from 'react';
import ReactDOM from 'react-dom';
import { guid } from '../utils';
import {
  classPrefix,
} from '../constant';
import './index.less';

export default class ContextMenu extends React.Component {
  /**
   * 创建右键菜单容器
   * @param event 鼠标事件对象
   * @returns 右键菜单容器
   */
  static createWrapper(event: MouseEvent): HTMLDivElement {
    // 创建容器
    const div = document.createElement('div');
    div.id = guid('context');
    div.setAttribute('class', `${classPrefix}-context-menu-wrapper`);
    // 计算容器位置
    div.style.left = `${event.pageX}px`;
    div.style.top = `${event.pageY}px`;
    div.onclick = function(event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // 插入容器
    document.body.appendChild(div);
    return div;
  }

  /**
   * 卸载组件
   * @param compoent react组件实例
   */
  static unmount(comRef: any) {
    document.body.removeChild(comRef.element);
  }

  static create(children: React.ReactElement, event: MouseEvent): any {
    const element = this.createWrapper(event);

    const instance = ReactDOM.render((
      <ContextMenu>
        {children}
      </ContextMenu>
    ), element);
    
    return {
      instance,
      element, 
    }
  }

  render() {
    return (
      <div className={`${classPrefix}-context-menu`}>
        {this.props.children}
      </div>
    );
  }
}

export function MenuItem(props: any) {
  return (
    <span>{props.children}</span>
  )
}