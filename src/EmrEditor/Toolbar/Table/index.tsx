import React from 'react';
import { Tooltip } from 'antd';
import { TableOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import EventHandler, { CustomEventType } from '../../EventHandler';
// import TableHandler from './TableHandler';
// import * as Command from '../../Command';
// import Selection from '../../Selection';
import { classPrefix } from '../../constant';
// import $ from '../../utils/DOMQuery';
import './index.less';

export type TableProps = {

}

export type GridProps = {
  onVisibleChange: (visible: boolean) => void
}

// 样式名称
const gridClassName = 'grid';
const minX = 4;
const minY = 4;

/**
 * 选择span元素
 * @returns 
 */
const querySelectorAll = () => {
  return [].slice.call(document.querySelectorAll(`.${gridClassName}`));
}

/**
 * 切换选中状态
 * @param span span元素
 * @param selected 是否选中
 */
const toggleSelected = (span: HTMLElement, selected: boolean) => {
  const spanClass = classnames(gridClassName, { selected });
  // 拼接设置
  span.setAttribute('class', spanClass);
}

export function Grid(props: GridProps) {
  // 坐标数据
  const [coord, setCoord] = React.useState<Array<number>>([minX, minY]);
  const currIndexs = React.useRef({ x: minX, y: minY });
  const position = React.useRef({ x: 0, y: 0 });
  // 当前次的坐标索引位置
  const [px, py] = coord;
  // 通过循环设置坐标组件
  const coox = new Array(px).fill(1);
  const cooy = new Array(py).fill(1);
  
  /**
   * 鼠标移动选中的表格
   * @param event 事件对象
   */
  const onMouseMove = (event: any) => {
    const element = event.target;
    // 获取id
    const id = element.getAttribute('id');
    if (id) {
      const [x, y] = id.split('@');
      // 设置选中范围
      currIndexs.current.x = x;
      currIndexs.current.y = y;
      // 判断鼠标的前进方向
      const pageX = event.pageX;
      const pageY = event.pageY;
      // x轴是否往右，往右加一，往左减一
      let xdl = 0;
      // 往右
      if (+x === px && pageX >= position.current.x) xdl = 1;
      // 往左
      if (pageX < position.current.x) xdl = -1;
      // y轴是否往下，往下加一，往上减一
      let ydl = 0;
      // 往下
      if (+y === py && pageY >= position.current.y) ydl = 1;
      // 往上
      if (pageY < position.current.y) ydl = -1;
      // 如果当前x,y等于px,py就加一行，否则少一行
      const newPx = Math.max(px + xdl, minX);
      const newPy = Math.max(py + ydl, minY);
      // 获取所有span标签通过dom设置其样式
      querySelectorAll().forEach((span: HTMLElement) => {
        const [a, b] = span.id.split('@');
        // 索引小于的增加选中状态反之去掉选中状态
        let selected = false;
        if (a <= x && b <= y) {
          selected = true;
        }
        toggleSelected(span, selected);
      });
      // 设置
      setCoord([newPx, newPy]);
      // 设置位置
      position.current.x = pageX;
      position.current.y = pageY;
    }
  };
  
  /**
   * 点击选择要创建的表格
   * @param event 事件对象
   */
  function onClick(event: any) {
    props.onVisibleChange(false);
    // 清空选中
    querySelectorAll().forEach((span: HTMLElement) => {
      toggleSelected(span, false);
    });
    // // 创建表格
    // const tableRef = TableHandler.create({
    //   rows: currIndexs.current.y,
    //   cols: currIndexs.current.x
    // });
    // // 恢复选区
    // Selection.restoreSelection();
    // // 插入表格
    // Command.exec('insertHTML', tableRef.html());
    // // 初始化表格
    // tableRef.initTableEvent();

    EventHandler.publish(CustomEventType.CreateTable, {
      rows: currIndexs.current.y,
      cols: currIndexs.current.x,
    });
  }

  return (
    <div className={`${classPrefix}-table`}
      onMouseOver={onMouseMove}
      onClick={onClick}
    >
      <table>
        <tbody>
          {cooy.map((y, yi) => {
            const ky = yi + 1; // y轴索引
            return (
              <tr key={ky}>
                {coox.map((x, xi) => {
                  const kx = xi + 1; // x轴索引
                  return (
                    <td key={kx}>
                      <button
                        id={`${kx}@${ky}`}
                        className={gridClassName}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div>{px} x {py}</div>
    </div>
  )
}

export default function Table(props: TableProps) {
  const [visible, setVisible] = React.useState<boolean>(false);

  // 控制显示与隐藏
  function onVisibleChange(visible: boolean) {
    setVisible(visible);
  }

  return (
    <Tooltip
      placement="right"
      title={<Grid onVisibleChange={onVisibleChange} />}
      color="#fff"
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <div>
        <TableOutlined />
        <span>表格</span>
      </div>
    </Tooltip>
  )
}