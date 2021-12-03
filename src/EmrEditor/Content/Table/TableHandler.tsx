// import { guid } from '../../utils';
import Selection from '../../Selection';
import * as Command from '../../Command';
// import { classPrefix } from '../../constant';
import $ from '../../utils/DOMQuery';
// import { throtte } from '../../utils';
import EventHandler, { DelegationEventType } from '../../EventHandler';
import TableOperate from './TableOperate';
import ContextMenu from '../../ContextMenu';
import Menu, { Direction, Ranks } from './Menu';
// import TableDOM from './TableDOM';

export default class TableHandler {
  static instances: Array<TableOperate> = []
  // 行数
  static rows: number = 0
  // 列数
  static cols: number = 0
  // 是否是移动状态标志
  static rowResize: boolean = false
  static colResize: boolean = false
  // 是否可以触发移动
  static rowMoveResize: boolean = false
  static colMoveResize: boolean = false
  // 移动表格边线的索引
  static rowIndex: string = '0'
  static colIndex: string = '0'
  // 鼠标的位置
  static pageX: number = 0
  static pageY: number = 0
  // 表示否在选中
  static cellSelected: boolean = false
  // 选中table起点位置
  static startColElement: HTMLElement | null = null
  static endColElement: HTMLElement | null = null
  // 表格选中开始与结束索引
  static startRowIndex: number = 0
  static startColIndex: number = 0
  static endRowIndex: number = 0
  static endColIndex: number = 0
  // 待删除索引
  static deleteIndexs = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
  // 右键菜单实例
  static contextMenuRef: React.ReactInstance | null = null;

  static initialize() {
    // 绑定事件
    // 表格线框移动相关事件
    EventHandler.delegation(DelegationEventType.MouseMove, this.onTableLineShow.bind(this));
    EventHandler.delegation(DelegationEventType.MouseMove, this.onTableLineMove.bind(this));
    EventHandler.delegation(DelegationEventType.MouseDown, this.onTableLineToggle.bind(this));
    EventHandler.delegation(DelegationEventType.MouseUp, this.onTableLineToggle.bind(this));
    // 表现单位格选择相关事件
    EventHandler.delegation(DelegationEventType.MouseDown, this.onTableTdSelect.bind(this));
    EventHandler.delegation(DelegationEventType.MouseUp, this.onTableTdSelect.bind(this));
    EventHandler.delegation(DelegationEventType.MouseOver, this.onTableTdSelect.bind(this));
    // click清楚相关样式
    EventHandler.delegation(DelegationEventType.Click, this.onTableClick.bind(this));
    // 鼠标右键执行相关操作
    EventHandler.delegation(DelegationEventType.ContextMenu, this.onTableContextMenu.bind(this));
  }

  /**
   * 查询表格实例
   * @param table 表格实例
   */
  static findInst(table: HTMLTableElement) {
    return this.instances.find(item => item.table.id === table.id);
  }

  /**
   * 找到元素所在的table元素
   * @param element 元素
   */
  static closetTable(element: HTMLElement) {
    return $.closet(element, 'table');
  }

  /**
   * 找到table包裹元素
   * @param element 元素
   * @returns 
   */
  static closetWrap(element: HTMLElement) {
    return $.closet(element, '.emr-editor-element_table_wrap');
  }

  /**
   * 找到元素所在的td
   * @param element 元素
   * @returns 
   */
  static closetCell(element: HTMLElement) {
    return $.closet(element, 'td');
  }

  /**
   * 是否被table包裹
   * @param element 元素
   */
  static matchTable(element: HTMLElement) {
    // if .contains(element)) {
    //   return element;
    // }
    // return null;
  }

  /**
   * 计算子元素在父元素的相对位置
   * @param parentElement 父元素
   * @param childElement 子元素
   * @param isSelf 子元素的宽高也算上
   */
  static calRelativeDiff(parentElement: HTMLElement, childElement: HTMLElement, isSelf: boolean = false) {
    const parentRect = parentElement.getBoundingClientRect();
    const childRect = childElement.getBoundingClientRect();

    return {
      left: childRect.left - parentRect.left - 2 + (isSelf ? childElement.offsetWidth : 0),
      top: childRect.top - parentRect.top - 2 + (isSelf ? childElement.offsetHeight : 0),
    }
  }

  /**
   * 计算实际样式位置
   * @param diffRect 相对位置
   * @param element 元素
   * @param offset 鼠标位置
   */
  static calPostion(diffRect: any, element: HTMLElement, offset: any) {
    let { left, top } = diffRect;
    const { offsetWidth, offsetHeight } = element;
    const { offsetX, offsetY } = offset;

    // 落点在元素以中心点为中心上下左右位置
    let xd = 'left';
    let yd = 'top';
    let ix = element.dataset.col as string;;
    let iy = element.parentElement!.dataset.row as string;

    // 判断鼠标是落在元素的上半部分还是下半部分
    if (offsetHeight / 2 < offsetY) {
      top += offsetHeight + 2;
      yd = 'bottom';
    }

    // 判断鼠标是落在元素的左半部分还是右半部分
    if (offsetWidth / 2 < offsetX) {
      left += offsetWidth + 2;
      xd = 'right';
    }

    return {
      xd,
      yd,
      ix: `${xd === 'left' ? +ix - 1 : ix}`, // 确定索引
      iy: `${yd === 'top' ? +iy - 1 : iy}`, // 确定索引
      isFarTop: iy === '0' && yd === 'top', // 是否最上边框
      isFarLeft: ix === '0' && xd === 'left', // 是否是左边框
      isFarRight: ix === `${this.cols - 1}` && xd === 'right', // 是否最右边边框
      left: `${left + 1}px`,
      top: `${top + 1}px`,
    }
  }

  /**
   * 表格伸缩边线显示
   * @param event 事件对象
   */
  static onTableLineShow(event: any) {
    let element = event.target;
    if (element.tagName !== 'TD') {
      element = this.closetCell(element);
    }

    if (element) {
      const table = this.closetTable(element);
      const tableWrap = table?.parentElement as HTMLElement;
      // 移动显示的间隔
      let offset = 2;
      const offsetY = event.offsetY;
      const offsetX = event.offsetX;
      // 计算相对位置
      const diffRect = this.calRelativeDiff(tableWrap, element);
      // 计算上边框还是下边框位置
      const position = this.calPostion(diffRect, element, { offsetX, offsetY });
  
      // y轴方向
      if (!this.rowMoveResize && !this.cellSelected) {
        // 是否显示边线
        const rowResize =
          (offsetY < offset || offsetY > (element.offsetHeight - offset)) // 判断是否落在边框上下2的范围内
          && !position.isFarTop // 排除最上面的边框
          && !this.rowMoveResize && !this.colMoveResize; // 排除正在移动的情况
        if (this.rowResize !== rowResize) {
          this.rowResize = rowResize;
          // 设置样式
          $(tableWrap).toggleClass({ 'row-resize': rowResize });
          // 移进移出判断
          if (rowResize) {
            const xLine = document.createElement('div');
            xLine.setAttribute('class', 'x-line');
            tableWrap.appendChild(xLine);
            // 设置高度 判断方向
            xLine.style.top = position.top;
            // 设置索引
            this.rowIndex = position.iy;
          } else {
            // 删除
            const xLine = tableWrap.querySelector('.x-line') as HTMLElement;
            // 删除
            xLine && tableWrap.removeChild(xLine);
          }
        }
      }
  
      // x轴方向
      if (!this.colMoveResize &&  !this.cellSelected) {
        // 是否显示边线
        const colResize =
          (offsetX < offset || offsetX > (element.offsetWidth - offset)) // 判断是否落在边框左右2的范围内
          && !position.isFarLeft // 排除最左边的边框
          && !position.isFarRight // 排除最右边的边框
          && !this.rowMoveResize && !this.colMoveResize;; // 排除正在移动的情况
  
        if (this.colResize !== colResize) {
          this.colResize = colResize;
          // 设置样式
          $(tableWrap).toggleClass({ 'col-resize': colResize });
          // 移进移出判断
          if (colResize) {
            const yLine = document.createElement('div');
            yLine.setAttribute('class', 'y-line');
            tableWrap.appendChild(yLine);
            console.log(yLine);
            // 设置高度 判断方向
            yLine.style.left = position.left; // `${diffRect.top}px`
            // 设置索引
            this.colIndex = position.ix;
          } else {
            const yLine = tableWrap.querySelector('.y-line') as HTMLElement;
            // 删除
            yLine && tableWrap.removeChild(yLine);
          }
        }
      }
    }
  }

  /**
   * 边线移动
  */
  static onTableLineMove(event: MouseEvent) {
    const tableWrap = this.closetWrap(event.target as HTMLElement);
    if (!tableWrap) return;

    const table = tableWrap.querySelector('table') as HTMLTableElement;
    if (this.rowMoveResize) {
      const diffY = event.pageY - this.pageY;
      const xLine = tableWrap.querySelector('.x-line') as HTMLElement;
      if (xLine) {
        // 设置表格高度
        const row = table.querySelector(`[data-row='${this.rowIndex}']`) as HTMLElement;
        // 当前计算出来的高度
        const realHeight = row.offsetHeight + diffY;
        // 是否最小高度了
        const isMinHeigth = realHeight < 38;
        if (!isMinHeigth) {
          // 设置高度
          row.style.height = `${realHeight}px`;
          // 计算top值
          const newTop = +xLine.style.top.replace('px', '') + diffY;
          xLine.style.top = `${newTop}px`;
          // 设置鼠标位置
          this.pageY = event.pageY;
        }
      }
    }

    if (this.colMoveResize) {
      const diffX = event.pageX - this.pageX;
      const yLine = tableWrap.querySelector('.y-line') as HTMLElement;
      if (yLine) {
        // 设置表格高度
        const col = table.querySelector(`[data-index='${this.colIndex}']`) as any;
        // 找到相邻td计算宽度
        const colSibling = col.nextElementSibling;
        // 如果没有相邻的元素说明是坐右边的一条边，暂时不做处理
        if (!colSibling) return;
        // 计算当前的元素应该有的宽度
        const realWidth = +col.width.replace('px', '') + diffX;
        // 计算相邻的元素应该有的宽度
        const siblingRealWidth = +colSibling.width.replace('px', '') - diffX;
        // 判断最小宽度
        if (realWidth < 36 || siblingRealWidth < 36) return;
        // 设置宽度
        col.width = `${realWidth}px`;
        colSibling.width = `${siblingRealWidth}px`;
        // 计算left值
        const newLeft = +yLine.style.left.replace('px', '') + diffX;
        yLine.style.left = `${newLeft}px`;
        // 设置鼠标位置
        this.pageX = event.pageX;
      }
    }
  }

  /**
   * 开始或停止鼠标移动
   * @param event 事件对象
   */
  static onTableLineToggle(event: MouseEvent) {
    if (event.type === DelegationEventType.MouseDown) {
      if (!(this.rowResize || this.colResize)) return;
      //  如果当前是可移动的
      this.rowMoveResize = this.rowResize;
      this.colMoveResize = this.colResize;
      this.pageX = event.pageX;
      this.pageY = event.pageY;
    } else if (event.type === DelegationEventType.MouseUp) {
      this.rowMoveResize = false;
      this.colMoveResize = false;
    }
  }

  // 表格合并单元格相关事件
  /**
   * 合并单元格单元格选中
   * @param event 
   * @returns 
   */
  static onTableTdSelect(event: any) {
    const wrap = this.closetWrap(event.target);
    if (!wrap) return;

    const table = wrap.querySelector('table') as HTMLTableElement;
    const element = event.target;

    if (event.type === DelegationEventType.MouseDown) {
      // 如果是鼠标右键
      if (event.button === 2) {
        return;
      }
      // 选择到父亲td
      const td = this.closetCell(element) as HTMLTableCellElement;
      // 元素被包裹 && 当前不是表格边线移动状态
      if (td && !this.rowMoveResize) {
        // 记住起点td
        this.startColElement = td;
        // 先删除样式
        $('td.selected').toggleClass({ selected: false });
        // 设置为编辑状态
        this.cellSelected = true;
      }
    } else if (event.type === DelegationEventType.MouseUp) {
      // 不在选中td
      this.cellSelected = false;
    } else if (event.type === DelegationEventType.MouseOver) {
      // 元素是否被table包裹
      if (element && this.cellSelected && !this.colMoveResize) {
        // 选择到父亲td
        const td = this.closetCell(element);
        if (td) {
          const instance = this.findInst(table) as TableOperate;
          const result = instance.getSelelctedRange(this.startColElement as HTMLElement, td);
          // 设置开始真实的开始与结束索引值
          this.startRowIndex = result.rowMinNum;
          this.endRowIndex = result.rowMaxNum;
          this.startColIndex = result.colMinNum;
          this.endColIndex = result.colMaxNum;

          // 操作样式
          (Array.from(table.querySelectorAll('td'))).forEach((item: HTMLElement) => {
            const itemRowNum = +(item.parentElement!.dataset.row as string);
            const itemColNum = +(item.dataset.col as string);
            // 设置样式
            const selected =
                 (itemRowNum <= result.rowMaxNum)
              && (itemRowNum >= result.rowMinNum)
              && (itemColNum <= result.colMaxNum)
              && (itemColNum >= result.colMinNum);

            $.toggleClass(item, { selected });
          });
        }
      }
    }
  }

  /**
   * 点击后移除相关
   * @param event 事件对象
   */
  static onTableClick(event: Event) {
    const element = event.target
    const table = this.closetTable(element as HTMLElement);
    if (!table) {
      $('td.selected').toggleClass({ selected: false });
    }
    // 销毁右键菜单
    this.removeTableContextMenu();
  }

  /**
   * 右键菜单
   * @param event 事件对象
   */
  static onTableContextMenu(event: MouseEvent) {
    const td = this.closetCell(event.target as HTMLElement) as HTMLTableCellElement;
    // 如果是鼠标右键
    if (td) {
      event.preventDefault();
      event.stopPropagation();
      const table = this.closetTable(td) as HTMLTableElement;
      // 是否是合并过的单元格
      const merged = td.colSpan > 1 || td.rowSpan > 1;
      // 如果存在菜单先移除右键右键菜单
      this.removeTableContextMenu();
      // 获取光标折叠状态
      const range = Selection.getRange();
      // 创建右键菜单
      this.contextMenuRef = ContextMenu.create(
        <Menu
          onInsert={(direction: Direction, num: number) => this.onTableInsert(direction, num, table)}
          onDeleteSelected={(event: MouseEvent, rank: Ranks) => this.onTableDeleteSelected(event, rank, table)}
          onDelete={(rank: Ranks) => this.onTableDelete(rank, table)}
          onMerge={() => this.onTableMerge(table)}
          onSplit={() => this.onTableSplit(td, table)}
          merged={merged}
          collapsed={range?.collapsed}
        />,
        event,
      );
    }
  }

  /**
   * 移除右键菜单
   */
  static removeTableContextMenu() {
    if (this.contextMenuRef) {
      ContextMenu.unmount(this.contextMenuRef);
      this.contextMenuRef = null;
    }
  }

  /**
   * 插入行或列
   * @param direction 插入方向
   * @param num 插入数量
   * @param table 元素
   */
  static onTableInsert(direction: Direction, num: number, table: HTMLTableElement) {
    const instance = this.findInst(table);
    if (instance) {
      // 恢复选区
      Selection.restoreSelection();
      const range = Selection.getRange();
      const element = Selection.getRangeInElement(range as Range);
      const td = this.closetCell(element as HTMLElement);
      // 如果存在菜单先移除右键右键菜单
      this.removeTableContextMenu();
      // 插入
      instance.increaseTableByDirection(direction, num, td as HTMLElement);
    }
  }

  /**
   * 显示删除的选中行或列
   * @param event 
   * @param rank 
   * @param table
   */
  static onTableDeleteSelected(event: MouseEvent, rank: Ranks, table: HTMLTableElement): void {
    const tableWrap = table.parentElement as HTMLDivElement;
    if (event.type === 'mouseenter') {
      const instance = this.findInst(table) as TableOperate;
      // 如果是选中
      let startRowIndex = this.startRowIndex;
      let endRowIndex = this.endRowIndex;
      let startColIndex = this.startColIndex;
      let endColIndex = this.endColIndex;
      // 获取范围左上角与右下角元素
      let startRow = table.querySelector(`[data-row='${startRowIndex}']`);
      let startCell = startRow?.querySelector(`[data-col='${startColIndex}']`);
      let endRow = table.querySelector(`[data-row='${endRowIndex}']`);
      let endCell = endRow?.querySelector(`[data-col='${endColIndex}']`);
      // 如果当前不是选中进行中
      const range = Selection.getRange();
      // 如果光标是折叠状态
      if (range?.collapsed) {
        const range = Selection.getRange();
        const element = Selection.getRangeInElement(range as Range);
        const td = $.closet(element as HTMLElement, 'td');
        if (td) {
          const getAttr = instance.getAttrNum;
          startRowIndex = getAttr(td.parentElement, 'row');
          endRowIndex = startRowIndex + (getAttr(td, 'rowspan') || 1) - 1;
          startColIndex = getAttr(td, 'col');
          endColIndex = startColIndex + (getAttr(td, 'colspan') || 1) - 1;
          // 设置起点
          startRow = startCell = endRow = endCell = td;
        }
      }
      // 设置删除索引范围
      this.deleteIndexs.top = startRowIndex;
      this.deleteIndexs.bottom = endRowIndex;
      this.deleteIndexs.left = startColIndex;
      this.deleteIndexs.right = endColIndex;
      
      // 计算顶点位置
      const startRect = this.calRelativeDiff(tableWrap, startCell as HTMLElement);
      const endRect = this.calRelativeDiff(tableWrap, endCell as HTMLElement, true);
      // 创建一个div
      const div = document.createElement('div');
      if (rank === Ranks.ROW) {
        div.className = 'row-delete deleted';
        div.style.top = `${startRect.top}px`;
        div.style.height = `${endRect.top - startRect.top}px`;
      } else if (rank === Ranks.COL) {
        div.className = 'col-delete deleted';
        div.style.left = `${startRect.left}px`;
        div.style.width = `${endRect.left - startRect.left}px`;
      }
      tableWrap.appendChild(div);
    } else if (event.type === 'mouseleave') {
      // 先删除样式
      tableWrap.removeChild(tableWrap.querySelector('.deleted') as Node);
    }
  }

  /**
   * 合并单元格
   * @param table 表格
   */
   static onTableMerge(table: HTMLTableElement) {
    const instance = this.findInst(table) as TableOperate;
    if (instance) {
      const tds = Array.from(table.querySelectorAll('td.selected')) as Array<HTMLTableCellElement>;
      instance.mergeCells(tds);
      // 恢复选区
      this.restoreTableSelect(tds[0]);
      // 移除样式
      $('td.selected').toggleClass({ selected: false });
      // 如果存在菜单先移除右键右键菜单
      this.removeTableContextMenu();
    }
  }

  /**
   * 删除行列或整个表格
   * @param rank 删除类型
   * @param table
   */
  static onTableDelete(rank: Ranks, table: HTMLTableElement) {
    const instance = this.findInst(table) as TableOperate;
    if (instance) {
      const tableWrap = table.parentElement as HTMLDivElement;
      // 删除列
      if (rank === Ranks.ROW) {
        // 删除列
        instance.decreaseTableByRank(rank, this.deleteIndexs);
      } else if (rank === Ranks.COL) {
        // 删除行
        instance.decreaseTableByRank(rank, this.deleteIndexs);
      } else {
        Selection.createRangeByElement(table.parentElement);
        Selection.restoreSelection();
        Command.exec('insertHTML', '<p><br></p>');
      }
      const deleteMaskElem = tableWrap.querySelector('.deleted');
      if (deleteMaskElem) {
        tableWrap.removeChild(deleteMaskElem);
      }
      // 如果存在菜单先移除右键右键菜单
      this.removeTableContextMenu();
      // 找到第一个单元格
      this.restoreTableSelect(table.querySelector('td') as HTMLTableCellElement);
    }
  }

  /**
   * 拆分单元格
   * @param td 单元格
   */
  static onTableSplit(td: HTMLTableCellElement, table: HTMLTableElement) {
    const instance = this.findInst(table);
    if (instance) {
      // 插入
      instance.splitCells(td);
      // 恢复选区
      this.restoreTableSelect(td);
      // 如果存在菜单先移除右键右键菜单
      this.removeTableContextMenu();
    }
  }
  
  /**
   * 恢复选区
   * @param td 表格元素
   */
  static restoreTableSelect(td: HTMLTableCellElement) {
    // 获取子元素
    const child = td?.children[0];
    // 选中当前元素
    if (child) {
      Selection.createRangeByElement(child, true, true);
      Selection.restoreSelection();
    }
  }
}


// export type TableOptions = {
//   rows: number,
//   cols: number,
// }

// interface ColAttrs<T> extends HTMLElement {
//   colspan: T,
//   rowspan: T,
// }

// // const classTableDiv = `${classPrefix}-element_table_div`;
// // const classTableBreak = `${classPrefix}-element_table_break`;

// export default class TableHandler {
//   static create(options: TableOptions) {
//     return new this(options);
//   }

//   static initialize() {}

//   tableInstance: TableDOM
//   // 表格dom
//   table: HTMLTableElement
//   // 父容器p标签
//   tableWrap: HTMLElement
//   // 行数
//   rows: number = 0
//   // 列数
//   cols: number = 0
//   // 是否是移动状态标志
//   rowResize: boolean = false
//   colResize: boolean = false
//   // 是否可以触发移动
//   rowMoveResize: boolean = false
//   colMoveResize: boolean = false
//   // 移动表格边线的索引
//   rowIndex: string = '0'
//   colIndex: string = '0'
//   // 鼠标的位置
//   pageX: number = 0
//   pageY: number = 0
//   // 表示否在选中
//   cellSelected: boolean = false
//   // 选中table起点位置
//   startColElement: HTMLElement | null = null
//   endColElement: HTMLElement | null = null
//   // 表格选中开始与结束索引
//   startRowIndex: number = 0
//   startColIndex: number = 0
//   endRowIndex: number = 0
//   endColIndex: number = 0
//   // 待删除索引
//   deleteIndexs = {
//     top: 0,
//     bottom: 0,
//     left: 0,
//     right: 0
//   }
//   // 右键菜单实例
//   contextMenuRef: React.ReactInstance | null = null;

//   constructor(options: TableOptions) {
//     this.rows = options.rows;
//     this.cols = options.cols;
//     // 设置包裹标签
//     this.tableWrap = document.createElement('div');
//     this.tableWrap.setAttribute('class', `${classPrefix}-element_table_wrap`);
//     this.tableWrap.id = guid('table');

//     this.tableInstance = new TableDOM(options);
//     this.table = this.tableInstance.table;
//     // 插入到包裹中
//     this.tableWrap.appendChild(this.table);
//   }


//   /**
//    * 获取整个html文本
//    */
//   html() {
//     return this.tableWrap.outerHTML;
//   }

//   /**
//    * 获取实际dom中的table元素
//    * 插入的时候是以html插入的
//    * 因此需要重新获取table元素
//    * 绑定各种事件
//    * 创建选区范围
//    */
//    initTableEvent() {
//     this.restInstance();
//     // 获取到第一个td在下的元素创建选区
//     const td = this.table.querySelector('td');
//     // 获取子元素
//     const child = td?.children[0];
//     // 选中当前元素
//     Selection.createRangeByElement(child, true, true);
//     Selection.restoreSelection();
//     // 绑定事件
//     // 表格线框移动相关事件
//     EventHandler.delegation(DelegationEventType.MouseMove, this.middleware(this.onTableLineShow));
//     EventHandler.delegation(DelegationEventType.MouseMove, this.middleware(this.onTableLineMove));
//     EventHandler.delegation(DelegationEventType.MouseDown, this.middleware(this.onTableLineToggle));
//     EventHandler.delegation(DelegationEventType.MouseUp, this.middleware(this.onTableLineToggle));
//     // 表现单位格选择相关事件
//     EventHandler.delegation(DelegationEventType.MouseDown, this.middleware(this.onTableTdSelect));
//     EventHandler.delegation(DelegationEventType.MouseUp, this.middleware(this.onTableTdSelect));
//     EventHandler.delegation(DelegationEventType.MouseOver, this.middleware(this.onTableTdSelect));
//     // click清楚相关样式
//     EventHandler.delegation(DelegationEventType.Click, this.middleware(this.onTableClick));
//     // 鼠标右键执行相关操作
//     EventHandler.delegation(DelegationEventType.ContextMenu, this.middleware(this.onTableContextMenu));
//   }

//   // 为了弥补一个巨大设计缺陷方法
//   middleware = (callback: any) => {
//     return (event: any) => {
//       this.restInstance();
//       if (this.elementMatchToTable(event.target)) {
//         callback(event);
//       } 
//     }
//   }

//   restInstance = () => {
//     // 重置元素
//     this.tableWrap = document.getElementById(this.tableWrap.id) as HTMLElement;
//     this.tableInstance.table = this.table = document.getElementById(this.table.id) as HTMLTableElement;
//     this.tableInstance.tbody = this.table.querySelector('tbody');
//     this.tableInstance.colgroup = this.table.querySelector('colgroup');
//   }

//   /**
//    * 元素是被表格包裹的元素
//    * @param element 元素
//    */
//   elementMatchToTable(element: HTMLElement): any {
//     if (this.tableWrap.contains(element)) {
//       return element;
//     }
//     return null;
//   }

//   /**
//    * 移除右键菜单
//    */
//   removeTableContextMenu() {
//     if (this.contextMenuRef) {
//       ContextMenu.unmount(this.contextMenuRef);
//       this.contextMenuRef = null;
//     }
//   }

//   /**
//    * 右键菜单
//    * @param event 事件对象
//    */
//   onTableContextMenu = (event: MouseEvent): void => {
//     let element: any = event.target;
//     element = this.elementMatchToTable(element);
//     // 如果是鼠标右键
//     if (element) {
//       // td
//       element = $.closet(element, 'td') as any;
//       // 是否是合并过的单元格
//       const merged = element.colSpan > 1 || element.rowSpan > 1;
      
//       event.preventDefault();
//       event.stopPropagation();
//       // 如果存在菜单先移除右键右键菜单
//       this.removeTableContextMenu();
//       // 获取光标折叠状态
//       const range = Selection.getRange();
//       // 创建右键菜单
//       this.contextMenuRef = ContextMenu.create(
//         <Menu
//           onInsert={this.onTableInsert}
//           onDeleteSelected={this.onTableDeleteSelected}
//           onDelete={this.onTableDelete}
//           onMerge={this.onTableMerge}
//           onSplit={() => this.onTableSplit(element)}
//           merged={merged}
//           collapsed={range?.collapsed}
//         />,
//         event,
//       );
//     }
//   }

//   /**
//    * 插入行或列
//    * @param direction 插入方向
//    * @param num 插入数量
//    */
//   onTableInsert = (direction: Direction, num: number) => {
//     // 恢复选区
//     Selection.restoreSelection();
//     const range = Selection.getRange();
//     const element = Selection.getRangeInElement(range as Range);
//     const td = $.closet(element as HTMLElement, 'td');
//     // 如果存在菜单先移除右键右键菜单
//     this.removeTableContextMenu();
//     // 插入
//     this.tableInstance.increaseTableByDirection(direction, num, td as HTMLElement);
//   }

  // /**
  //  * 合并单元格
  //  */
  // onTableMerge = () => {
  //   const 
  //   const tds = $('td.selected').elements;
  //   this.tableInstance.mergeCells(tds);
  //   // 如果存在菜单先移除右键右键菜单
  //   this.removeTableContextMenu();
  // }

//   /**
//    * 拆分单元格
//    * @param td 单元格
//    */
//   onTableSplit = (td: HTMLTableCellElement) => {
//     // 插入
//     this.tableInstance.splitCells(td);
//     // 如果存在菜单先移除右键右键菜单
//     this.removeTableContextMenu();
//   }

//   /**
//    * 删除行列或整个表格
//    * @param rank 删除类型
//    */
//   onTableDelete = (rank: Ranks) => {
//     // 删除列
//     if (rank === Ranks.ROW) {
//       // 删除列
//       this.tableInstance.decreaseTableByRank(rank, this.deleteIndexs);
//     } else if (rank === Ranks.COL) {
//       // 删除行
//       this.tableInstance.decreaseTableByRank(rank, this.deleteIndexs);
//     } else {
//       Selection.createRangeByElement(this.tableWrap);
//       Selection.restoreSelection();
//       Command.exec('insertHTML', '<p><br></p>');
//     }

//     const deleteMaskElem = this.tableWrap.querySelector('.deleted');
//     if (deleteMaskElem) {
//       this.tableWrap.removeChild(deleteMaskElem);
//     }
//     // 如果存在菜单先移除右键右键菜单
//     this.removeTableContextMenu();
//   }

//   /**
//    * 显示删除的选中行或列
//    * @param event 
//    * @param rank 
//    */
//   onTableDeleteSelected = (event: MouseEvent, rank: Ranks) => {
//     if (event.type === 'mouseenter') {
//       // 如果是选中
//       let startRowIndex = this.startRowIndex;
//       let endRowIndex = this.endRowIndex;
//       let startColIndex = this.startColIndex;
//       let endColIndex = this.endColIndex;
//       // 获取范围左上角与右下角元素
//       let startRow = this.table.querySelector(`[data-row='${startRowIndex}']`);
//       let startCell = startRow?.querySelector(`[data-col='${startColIndex}']`);
//       let endRow = this.table.querySelector(`[data-row='${endRowIndex}']`);
//       let endCell = endRow?.querySelector(`[data-col='${endColIndex}']`);
//       // 如果当前不是选中进行中
//       const range = Selection.getRange();
//       // 如果光标是折叠状态
//       if (range?.collapsed) {
//         const range = Selection.getRange();
//         const element = Selection.getRangeInElement(range as Range);
//         const td = $.closet(element as HTMLElement, 'td');
//         if (td) {
//           const getAttr = this.tableInstance.getAttrNum;
//           startRowIndex = getAttr(td.parentElement, 'row');
//           endRowIndex = startRowIndex + (getAttr(td, 'rowspan') || 1) - 1;
//           startColIndex = getAttr(td, 'col');
//           endColIndex = startColIndex + (getAttr(td, 'colspan') || 1) - 1;
//           // 设置起点
//           startRow = startCell = endRow = endCell = td;
//         }
//       }
//       // 设置删除索引范围
//       this.deleteIndexs.top = startRowIndex;
//       this.deleteIndexs.bottom = endRowIndex;
//       this.deleteIndexs.left = startColIndex;
//       this.deleteIndexs.right = endColIndex;
      
//       // 计算顶点位置
//       const startRect = this.calRelativeDiff(this.tableWrap, startCell as HTMLElement);
//       const endRect = this.calRelativeDiff(this.tableWrap, endCell as HTMLElement, true);
//       // 创建一个div
//       const div = document.createElement('div');
//       if (rank === Ranks.ROW) {
//         div.className = 'row-delete deleted';
//         div.style.top = `${startRect.top}px`;
//         div.style.height = `${endRect.top - startRect.top}px`;
//       } else if (rank === Ranks.COL) {
//         div.className = 'col-delete deleted';
//         div.style.left = `${startRect.left}px`;
//         div.style.width = `${endRect.left - startRect.left}px`;
//       }
//       this.tableWrap.appendChild(div);
//     } else if (event.type === 'mouseleave') {
//       // 先删除样式
//       this.tableWrap.removeChild(this.tableWrap.querySelector('.deleted') as Node);
//     }
//   }

//   // ----------------------------------------------------------------
//   // 表格合并单元格相关事件
//   onTableTdSelect = (event: any) => {
//     // 鼠标按下
//     let element = event.target;

//     if (event.type === DelegationEventType.MouseDown) {
//       // 如果是鼠标右键
//       if (event.button === 2) {
//         return;
//       }
//       // 元素是否被table包裹
//       element = this.elementMatchToTable(element);
//       // 选择到父亲td
//       const td = $.closet(element, 'td') as ColAttrs<string>;
//       // 元素被包裹 && 当前不是表格边线移动状态
//       if (td && !this.rowMoveResize) {
//         // 记住起点td
//         this.startColElement = td;
//         // 先删除样式
//         $('td.selected').toggleClass({ selected: false });
//         // 设置为编辑状态
//         this.cellSelected = true;
//       }
//     } else if (event.type === DelegationEventType.MouseUp) {
//       // 不在选中td
//       this.cellSelected = false;     
//     } else if (event.type === DelegationEventType.MouseOver) {
//       // 元素是否被table包裹
//       element = this.elementMatchToTable(element);
//       if (element && this.cellSelected && !this.colMoveResize) {
//         // 选择到父亲td
//         const td = $.closet(element, 'td') as ColAttrs<string>;
//         if (td) {
//           const result = this.tableInstance.getSelelctedRange(this.startColElement as HTMLElement, td);
//           // 设置开始真实的开始与结束索引值
//           this.startRowIndex = result.rowMinNum;
//           this.endRowIndex = result.rowMaxNum;
//           this.startColIndex = result.colMinNum;
//           this.endColIndex = result.colMaxNum;

//           // 操作样式
//           ([].slice.call(this.table.querySelectorAll('td'))).forEach((item: HTMLElement) => {
//             const itemRowNum = +(item.parentElement!.dataset.row as string);
//             const itemColNum = +(item.dataset.col as string);
//             // 设置样式
//             const selected =
//                  (itemRowNum <= result.rowMaxNum)
//               && (itemRowNum >= result.rowMinNum)
//               && (itemColNum <= result.colMaxNum)
//               && (itemColNum >= result.colMinNum);
//             // 修改样式
//             $.toggleClass(item, { selected });
//           });
//         }
//       }
//     }
//   }

//   /**
//    * 点击后移除相关
//    * @param event 事件对象
//    */
//   onTableClick = (event: Event) => {
//     let element = event.target
//     // 清楚td选中
//     // 元素是否被table包裹
//     element = this.elementMatchToTable(element as HTMLElement);
//     if (!element) {
//       $('td.selected').toggleClass({ selected: false });
//     }
//     // 销毁右键菜单
//     this.removeTableContextMenu();
//   }
  
//   // ----------------------------------------------------------------
//   // 表格线框移动相关事件

//   /**
//    * 创建线条
//    * @param direction x,y轴方向
//    */
//   createLine(direction: string) {
//     const div = document.createElement('div');
//     div.setAttribute('class', `${direction}-line`);
//     this.tableWrap.appendChild(div);

//     return div;
//   }
  
//   /**
//    * 计算子元素在父元素的相对位置
//    * @param parentElement 父元素
//    * @param childElement 子元素
//    * @param isSelf 子元素的宽高也算上
//    */
//   calRelativeDiff(parentElement: HTMLElement, childElement: HTMLElement, isSelf: boolean = false) {
//     const parentRect = parentElement.getBoundingClientRect();
//     const childRect = childElement.getBoundingClientRect();

//     return {
//       left: childRect.left - parentRect.left - 2 + (isSelf ? childElement.offsetWidth : 0),
//       top: childRect.top - parentRect.top - 2 + (isSelf ? childElement.offsetHeight : 0),
//     }
//   }

//   /**
//    * 计算实际样式位置
//    * @param diffRect 相对位置
//    * @param element 元素
//    * @param offset 鼠标位置
//    */
//   calPostion(diffRect: any, element: HTMLElement, offset: any) {
//     let { left, top } = diffRect;
//     const { offsetWidth, offsetHeight } = element;
//     const { offsetX, offsetY } = offset;

//     // 落点在元素以中心点为中心上下左右位置
//     let xd = 'left';
//     let yd = 'top';
//     let ix = element.dataset.col as string;;
//     let iy = element.parentElement!.dataset.row as string;

//     // 判断鼠标是落在元素的上半部分还是下半部分
//     if (offsetHeight / 2 < offsetY) {
//       top += offsetHeight + 2;
//       yd = 'bottom';
//     }

//     // 判断鼠标是落在元素的左半部分还是右半部分
//     if (offsetWidth / 2 < offsetX) {
//       left += offsetWidth + 2;
//       xd = 'right';
//     }

//     return {
//       xd,
//       yd,
//       ix: `${xd === 'left' ? +ix - 1 : ix}`, // 确定索引
//       iy: `${yd === 'top' ? +iy - 1 : iy}`, // 确定索引
//       isFarTop: iy === '0' && yd === 'top', // 是否最上边框
//       isFarLeft: ix === '0' && xd === 'left', // 是否是左边框
//       isFarRight: ix === `${this.cols - 1}` && xd === 'right', // 是否最右边边框
//       left: `${left + 1}px`,
//       top: `${top + 1}px`,
//     }
//   }

//   /**
//    * 开始或停止鼠标移动
//    * @param event 事件对象
//    */
//   onTableLineToggle = (event: MouseEvent) => {
//     if (event.type === DelegationEventType.MouseDown) {
//       if (!(this.rowResize || this.colResize)) return;
//       //  如果当前是可移动的
//       this.rowMoveResize = this.rowResize;
//       this.colMoveResize = this.colResize;
//       this.pageX = event.pageX;
//       this.pageY = event.pageY;
//       // 将编辑器修改为不可编辑
//       // EventHandler.publish(CustomEventType.TooggleContentEdit, false);
//     } else if (event.type === DelegationEventType.MouseUp) {
//       this.rowMoveResize = false;
//       this.colMoveResize = false;
//       // 恢复为可编辑
//       // EventHandler.publish(CustomEventType.TooggleContentEdit, true);
//     }
//   }

//   /**
//    * 边线移动
//    */
//   onTableLineMove = (event: MouseEvent) => {
//     if (this.rowMoveResize) {
//       const diffY = event.pageY - this.pageY;
//       const xLine = document.querySelector('.x-line') as HTMLElement;
//       if (xLine) {
//         // 设置表格高度
//         const row = document.getElementById(`row-${this.rowIndex}`) as HTMLElement;
//         // 当前计算出来的高度
//         const realHeight = row.offsetHeight + diffY;
//         // 是否最小高度了
//         const isMinHeigth = realHeight < 38;
//         if (!isMinHeigth) {
//           // 设置高度
//           row.style.height = `${realHeight}px`;
//           // 计算top值
//           const newTop = +xLine.style.top.replace('px', '') + diffY;
//           xLine.style.top = `${newTop}px`;
//           // 设置鼠标位置
//           this.pageY = event.pageY;
//         }
//       }
//     }

//     if (this.colMoveResize) {
//       const diffX = event.pageX - this.pageX;
//       const yLine = document.querySelector('.y-line') as HTMLElement;
//       if (yLine) {
//         // 设置表格高度
//         const col = document.getElementById(`colgroup-${this.colIndex}`) as any;
//         // 找到相邻td计算宽度
//         const colSibling = col.nextElementSibling;
//         // 如果没有相邻的元素说明是坐右边的一条边，暂时不做处理
//         if (!colSibling) return;
//         // 计算当前的元素应该有的宽度
//         const realWidth = +col.width.replace('px', '') + diffX;
//         // 计算相邻的元素应该有的宽度
//         const siblingRealWidth = +colSibling.width.replace('px', '') - diffX;
//         // 判断最小宽度
//         if (realWidth < 36 || siblingRealWidth < 36) return;
//         // 设置宽度
//         col.width = `${realWidth}px`;
//         colSibling.width = `${siblingRealWidth}px`;
//         // 计算left值
//         const newLeft = +yLine.style.left.replace('px', '') + diffX;
//         yLine.style.left = `${newLeft}px`;
//         // 设置鼠标位置
//         this.pageX = event.pageX;
//       }
//     }
//   }

//   /**
//    * 判断是否可以显示拉伸边线
//    */
//   onTableLineShow = throtte((event: any) => {
//     let element = event.target;
//     // 修正参数
//     if (element.dataset.frame) {
//       element = element.parentElement;
//     }
//     if (element.tagName !== 'TD') {
//       return;
//     }
    
//     let offset = 2;
//     const offsetY = event.offsetY;
//     const offsetX = event.offsetX;
//     // 计算相对位置
//     const diffRect = this.calRelativeDiff(this.tableWrap, element);
//     // 计算上边框还是下边框位置
//     const position = this.calPostion(diffRect, element, { offsetX, offsetY });

//     // y轴方向
//     if (!this.rowMoveResize) {
//       // 是否显示边线
//       const rowResize =
//         (offsetY < offset || offsetY > (element.offsetHeight - offset)) // 判断是否落在边框上下2的范围内
//         && !position.isFarTop // 排除最上面的边框
//         && !this.rowMoveResize && !this.colMoveResize; // 排除正在移动的情况
//       if (this.rowResize !== rowResize) {
//         this.rowResize = rowResize;
//         // 设置样式
//         $(this.tableWrap).toggleClass({ 'row-resize': rowResize });
//         // 移进移出判断
//         if (rowResize) {
//           const xLine = this.createLine('x');
//           // 设置高度 判断方向
//           xLine.style.top = position.top; // `${diffRect.top}px`
//           // 设置索引
//           this.rowIndex = position.iy;
//         } else {
//           // 删除
//           const xLine = document.querySelector('.x-line') as HTMLElement;
//           // 删除
//           xLine && this.tableWrap.removeChild(xLine);
//         }
//       }
//     }

//     // x轴方向
//     if (!this.colMoveResize) {
//       // 是否显示边线
//       const colResize =
//         (offsetX < offset || offsetX > (element.offsetWidth - offset)) // 判断是否落在边框左右2的范围内
//         && !position.isFarLeft // 排除最左边的边框
//         && !position.isFarRight // 排除最右边的边框
//         && !this.rowMoveResize && !this.colMoveResize;; // 排除正在移动的情况

//       if (this.colResize !== colResize) {
//         this.colResize = colResize;
//         // 设置样式
//         $(this.tableWrap).toggleClass({ 'col-resize': colResize });
//         // 移进移出判断
//         if (colResize) {
//           const yLine = this.createLine('y');
//           // 设置高度 判断方向
//           yLine.style.left = position.left; // `${diffRect.top}px`
//           // 设置索引
//           this.colIndex = position.ix;
//         } else {
//           const yLine = document.querySelector('.y-line') as HTMLElement;
//           // 删除
//           yLine && this.tableWrap.removeChild(yLine);
//         }
//       }
//     }
//   }, 50)

// }

