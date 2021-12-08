import Selection from '../../Selection';
import * as Command from '../../Command';
// import { classPrefix } from '../../constant';
import $ from '../../utils/DOMQuery';
// import { throtte, guid } from '../../utils';
import EventHandler, { DelegationEventType } from '../../EventHandler';
import TableOperate from './TableOperate';
import ContextMenu from '../../ContextMenu';
import ContentEditor from '..';
import Menu, { Direction, Ranks } from './Menu';

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
  // 编辑器组件实例
  static contentEditorRef: ContentEditor
  // 编辑器父容器
  static contentEditorWrap: HTMLDivElement
  // 待删除索引
  static deleteIndexs = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
  // 右键菜单实例
  static contextMenuRef: React.ReactInstance | null = null;
  // 定时器
  static timer: NodeJS.Timeout

  static initialize(contentEditorRef: ContentEditor) {
    this.contentEditorRef = contentEditorRef;
    // 编辑器包裹容器
    this.contentEditorWrap = contentEditorRef.contentEditor!.parentElement as HTMLDivElement;
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
   * 断开观察连接
   */
  static disconnect() {
    this.contentEditorRef.onCompositionStart();
  }

  /**
   * 重启观察连接
   */
  static connect() {
    if (this.contentEditorRef.isComposing) {
      this.contentEditorRef.onCompositionEnd();
      // 保存一次
      this.contentEditorRef.onSaveContent([]);
    }
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
  static calRelativeDiff(parentElement: HTMLDivElement, childElement: HTMLElement, isSelf: boolean = false) {
    // 当前包裹表格的元素
    const parentRect = parentElement.getBoundingClientRect();
    // 当前触发的td
    const childRect = childElement.getBoundingClientRect();
    // 包裹编辑器的div元素
    const wrapRect = this.contentEditorWrap.getBoundingClientRect();

    return {
      left: childRect.left - wrapRect.left - 2 + (isSelf ? childElement.offsetWidth : 0),
      top: childRect.top - wrapRect.top - 2 + (isSelf ? childElement.offsetHeight : 0),
      relDiffx: parentRect.left - wrapRect.left,
      relDiffy: parentRect.top - wrapRect.top,
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
    // 是否是最下边边框
    const isFarBottom = iy === `${this.rows - 1}` && yd === 'bottom';

    return {
      xd,
      yd,
      ix: `${xd === 'left' ? +ix - 1 : ix}`, // 确定索引
      iy: `${yd === 'top' ? +iy - 1 : iy}`, // 确定索引
      isFarTop: iy === '0' && yd === 'top', // 是否最上边框
      isFarLeft: ix === '0' && xd === 'left', // 是否是左边框
      isFarRight: ix === `${this.cols - 1}` && xd === 'right', // 是否最右边边框
      isFarBottom,
      left: `${left}px`,
      top: `${isFarBottom ? top - 2 : top}px`,
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
      const table = this.closetTable(element) as HTMLTableElement;
      const tableWrap = table?.parentElement as HTMLDivElement;
      // 获取表格列数
      this.rows = table!.rows.length;
      this.cols = table!.rows[0].cells.length;
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
          $(this.contentEditorWrap).toggleClass({ 'row-resize': rowResize });
          // 移进移出判断
          if (rowResize) {
            // 断开观察链接
            const xLine = document.createElement('div');
            xLine.setAttribute('class', 'x-line');
            this.contentEditorWrap.appendChild(xLine);
            // 设置高度 判断方向
            xLine.style.top = position.top;
            xLine.style.left = `${diffRect.relDiffx}px`;
            xLine.style.width = `${table.offsetWidth}px`;
            // 设置索引
            this.rowIndex = position.iy;
            // 如果是最下边边框设置索引
            if (position.isFarBottom) {
              // 设置表格id
              xLine.setAttribute('data-id', table.id);
            }
          } else {
            // 删除
            const xLine = this.contentEditorWrap.querySelector('.x-line') as HTMLElement;
            // 删除
            xLine && this.contentEditorWrap.removeChild(xLine);
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
          $(this.contentEditorWrap).toggleClass({ 'col-resize': colResize });
          // 移进移出判断
          if (colResize) {
            const yLine = document.createElement('div');
            yLine.setAttribute('class', 'y-line');
            this.contentEditorWrap.appendChild(yLine);
            // 设置高度 判断方向
            yLine.style.left = position.left; // `${diffRect.top}px`
            yLine.style.top = `${diffRect.relDiffy}px`;
            yLine.style.height = `${table.offsetHeight}px`;
            // 设置索引
            this.colIndex = position.ix;
          } else {
            const yLine = this.contentEditorWrap.querySelector('.y-line') as HTMLElement;
            // 删除
            yLine && this.contentEditorWrap.removeChild(yLine);
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
    let table = tableWrap?.querySelector('table') as HTMLTableElement;
    
    if (this.rowMoveResize) {
      const diffY = event.pageY - this.pageY;
      const xLine = this.contentEditorWrap.querySelector('.x-line') as HTMLElement;
      // 如果不存在表格
      if (!table && xLine.dataset.id) {
        table = document.getElementById(xLine.dataset.id) as HTMLTableElement;;
      }
      // 如果表格不存在
      if (!table) return;

      if (xLine) {
        // 设置表格高度
        const row = table.querySelector(`[data-row='${this.rowIndex}']`) as HTMLElement;
        // 当前计算出来的高度
        const realHeight = row.offsetHeight + diffY;
        // 是否最小高度了
        const isMinHeigth = realHeight < 38;
        if (!isMinHeigth) {
          this.disconnect();
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
      // 表格不存在不处理
      if (!tableWrap) return;

      const diffX = event.pageX - this.pageX;
      const yLine = this.contentEditorWrap.querySelector('.y-line') as HTMLElement;
      if (yLine) {
        this.disconnect();
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
    // 重启连接
    this.connect();
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
