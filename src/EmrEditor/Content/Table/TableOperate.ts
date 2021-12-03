import { guid, isIntersect } from '../../utils';
import { classPrefix } from '../../constant';
import { Direction, Ranks } from './Menu';
import $ from '../../utils/DOMQuery';

const classTableDiv = `${classPrefix}-element_table_div`;
const classTableBreak = `${classPrefix}-element_table_break`;

interface Indexs {
  rowMaxNum: number;
  rowMinNum: number;
  colMaxNum: number;
  colMinNum: number;
}

enum MergeType {
  Start = 'start',
  Leap = 'Leap',
}

export default class TableDOM {
  // 表格dom实例
  table: HTMLTableElement
  colgroup: any
  tbody: any
  // 表格行数量，列数量
  rows: number
  cols: number
  // 在增加或删除表格列之前的列数
  lastRows: number = 0
  lastCols: number = 0
  // 表默认宽度
  tableWidth: number = 770

  constructor(options: any) {
    this.rows = +options.rows;
    this.cols = +options.cols;
    this.lastRows = +this.rows;
    this.lastCols = +this.cols;
    // 表格
    this.table = this.createTable();
    // 表格列宽控制
    this.colgroup = this.createTableColgroup();
    // 创建tbdoy
    this.tbody = this.ceateTableTbody();
  }

  /**
   * 创建表格dom实例
   * @returns table 表格dom实例
   */
  createTable() {
    // 创建容器
    const wrap = document.createElement('div');
    wrap.setAttribute('class', `${classPrefix}-element_table_wrap`);
    wrap.id = guid('table');
    // 创建表格
    const table = document.createElement('table');
    // 设置id
    table.id = guid('table');
    table.className = `${classPrefix}-element_table`;
    table.style.width = `${this.tableWidth}px`;
    // 插入表格
    wrap.appendChild(table);

    return table;
  }


  /**
   * 创建tableColgroup
   * @returns 
   */
  createTableColgroup() {
    this.colgroup = document.createElement('colgroup');
    // 设置id
    this.colgroup.id = guid('table');
    // 创建列宽
    this.initTableCols(this.cols);
    // 插入列宽
    this.table.appendChild(this.colgroup);

    return this.colgroup;
  }

  /**
   * 初始化宽度列
   * @param nums 列数量
   */
   initTableCols(nums: number) {
    for (let i = 0; i < nums; i++) {
      const col = this.createTableCol();
      // 插入
      this.colgroup.appendChild(col);
    }
    // 重置列宽度
    this.resetTableColgroup(nums);
  }
  
  /**
   * 计算表的宽度并且设置索引
   * @param totalCols 当前总列数
   */
  resetTableColgroup(totalCols: number) {
    this.cols = totalCols;
    // 获取所有的col
    const colsDOM = Array.from(this.colgroup.querySelectorAll('col'));
    // 列数
    const len = totalCols - 1;
    // 与上一次相比是增加列还是减少列
    let diff = totalCols - this.lastCols;
    // 计算当前列与上次列的比
    let percent = this.lastCols / totalCols;
    // 说明既不是增加也不是减少列，修正参数
    if (diff === 0) {
      diff = totalCols;
      percent = 0;
    }
    // 当前的总列宽剩余宽度
    // 如果diff === 0 这个后计算出来的restWidth === this.tableWidth
    // 如果diff > 0 说明是新增了列 percent < 1 此时就能计算出原来那些列该有的总和，新增列的宽度总和 = 列固定总宽度 - 原来列现在该有的宽度总和
    // 如果diff < 0 restWidth < 0 就是减少列 restWdith变量无用
    const restWidth = this.tableWidth - Math.ceil(this.tableWidth * percent);
    // 已计算列总和
    let countWidth = 0;
    colsDOM.forEach((col: any, index: number) => {
      // 当前宽度
      const currWidth = +col.width.replace('px', '');
      // 计算出来的实际宽度
      let newWidth = 0;
      // 如果原宽度是0，说明是新增的列
      if (currWidth === 0) {
        // 新增列每列都应该平均计算
        newWidth = Math.ceil(restWidth / diff);
        // 已计算列
        countWidth += newWidth;;
      } else if (index === len) { // 如果是最后一列
        // 最后一列等于固定列总和 - 已计算列总和
        newWidth = this.tableWidth - countWidth;
      } else {
        // 普通列按百分比计算
        newWidth = Math.ceil(percent * currWidth);
        // 已计算列
        countWidth += newWidth;;
        console.log(newWidth, percent, currWidth, 33333);
      }
      // 设置宽度
      col.width = `${newWidth}px`;
      // 设置索引
      col.setAttribute('data-index', index);
      col.id = `colgroup-${index}`;
    });
    // 上一次的列数
    this.lastCols = totalCols;
  }

  /**
   * 创建col
   * @returns 
   */
  createTableCol() {
    const col = document.createElement('col');

    return col;
  }

  /**
   * 创建表格体
   * @returns 表格体
   */
  ceateTableTbody() {
    this.tbody = document.createElement('tbody');
    // 设置id
    this.tbody.id = guid('tbody');
    // 创建tr
    this.initTableTrs(this.rows, this.cols);
    // 插入表格
    this.table.appendChild(this.tbody);

    return this.tbody;
  }

  /**
   * 初始表格行与列
   * @param rows 行数
   * @param cols 列数
   */
  initTableTrs(rows: number, cols: number) {
    for (let i = 0; i < rows; i++) {
      // 创建tr
      const tr = this.createTableTr();
      // 设置tr
      tr.setAttribute('data-row', `${i}`);
      tr.id = `row-${i}`;
      // 插入
      this.tbody.appendChild(tr);
      // 创建td
      for (let j = 0; j < cols; j++) {
        // 创建td
        const td = this.createTableTd();
        // 设置td
        td.setAttribute('data-col', `${j}`);
        td.id = `col-${j}`;
        // 插入td
        tr.appendChild(td);
      }
    }
  }

  /**
   * 增加表格行或列
   * @param direction 方向
   * @param nums 数量
   * @param td 插入的索引
   */
  increaseTableByDirection(direction: number, nums: number, element: any): void {
    // 如果向上或下插入一行
    if ([Direction.up, Direction.down].indexOf(direction) > -1) {
      const cells = this.findMergeCols(element, direction);
      // 获取第一列
      const targetNode = element.parentElement as Node;
      for (let i = 0; i < nums; i++) {
        const tr = this.createTableTr();
        // 判断上下插入方式
        direction === Direction.up ? $.insertBefore(tr, targetNode) : $.insertAfter(tr, targetNode);
        // 插入td
        for (let j = 0; j < this.cols; j++) {
          let td: HTMLTableCellElement | null = null;
          // 判断是否需要跳过不创建列
          const leap = cells.some(item => item.min <= j && item.max >= j);
          if (!leap) {
            td = this.createTableTd();
            tr.appendChild(td);
            // 设置td索引
            this.resetTdIndex(td, j);
          }
        }
        // 修改相应的td合并列数
        cells.forEach((item: any) => {
          const rowspan = this.getAttrNum(item.element, 'rowspan');
          item.element.setAttribute('rowspan', `${rowspan + nums}`);
        });
      }
      // 重置行索引
      this.resetTrIndex();
    } else { // 向左或右
      // 获取td索引
      const index = this.getAttrNum(element, 'col');
      // 查询tr
      const rowMaps = this.findMergeRows(index, direction);
      // 插入td
      Array.from(this.table.rows).forEach((tr: HTMLElement) => {
        const mergeInfo = rowMaps.get(tr);
        // 不需要插入单元格的行
        if (mergeInfo) {
          // const colspan = this.getAttrNum(mergeInfo.element, 'colspan');
          // const colIndex = this.getAttrNum(mergeInfo.element, 'col');
          if (mergeInfo.mergeType === MergeType.Start) {
            // 如果是
            mergeInfo.element.setAttribute('colspan', mergeInfo.colspan + nums);
            // 重置索引
            this.reorderTdIndex(mergeInfo.element, nums);
          } else {
            // 计算出相邻索引
            const next = tr.querySelector(`[data-col='${mergeInfo.colspan + mergeInfo.index}']`) as HTMLTableCellElement;
            this.reorderTdIndex(next, nums, true);
          }
        } else { // 需要插入单元格
          // 查询目标对象
          const targetNode = this.findMergeCell(tr, index, direction);
          // 创建td
          for (let i = 1; i <= nums; i++) {
            const td = this.createTableTd();
            // 计算插入列的索引
            // 判断插入方向
            if (direction === Direction.left) {
              // 设置td索引
              this.resetTdIndex(td, index);
              // 插入td
              targetNode === null ? $.appendChild(td, tr) : $.insertBefore(td, targetNode);
            } else {
              // 设置td索引
              this.resetTdIndex(td, i + index);
              // 插入td
              targetNode === null ? $.prependChild(td, tr) : $.insertAfter(td, targetNode);
            }

            // 如果是最后一个,从这个往后是索引都加上相应的长度
            if (i === nums) {
              this.reorderTdIndex(td, nums);
            }
          }
        }
      });
      // 插入重新计算宽度列
      this.increaseTableCols(nums, direction, index);
    }
  }

  /**
   * 创建宽度列
   * @param nums 列数量
   * @param type before or after
   * @param index index
   */
   increaseTableCols(nums: number, direction: Direction, index: number) {
    const targetNode = this.colgroup.querySelector(`col[data-index='${index}']`) as Node;
    for (let i = 0; i < nums; i++) {
      const col = this.createTableCol();
      // 插入
      direction === Direction.left ? $.insertBefore(col, targetNode) : $.insertAfter(col, targetNode)
    }
    // 重置列宽度
    this.resetTableColgroup(this.cols + nums);
  }

  /**
   * 删除行或列
   * @param indexs 行列索引
   */
  decreaseTableByRank(rank: Ranks, indexs: any): void {
    if (rank === Ranks.ROW) {
      const { top, bottom } = indexs;
      // 选出落在范围之内的tr
      const cols = Array.from(this.table.querySelectorAll('[rowspan]')).map((item) => {
        const startIndex = this.getAttrNum(item.parentElement, 'row');
        const rowspan = this.getAttrNum(item, 'rowspan');
        const endIndex = startIndex + rowspan - 1;
        // 判断是否重叠
        const max = [top, startIndex];
        const min = [bottom, endIndex];
        // 存在交叉
        if (Math.max(...max) <= Math.min(...min)) {
          return {
            startIndex,
            rowspan,
            endIndex,
            element: item,
            colIndex: this.getAttrNum(item, 'col'),
            parent: item.parentElement,
            isDelete: false,
          }
        }
        return false;
      }).filter(item => !!item);
      
      // 删除行
      let lastRowNext = document.getElementById(`row-${bottom}`)!.nextElementSibling;
      for (let i = top; i <= bottom; i++) {
        const row = document.getElementById(`row-${i}`);
        cols.forEach((col: any) => {
          // 判断是否删除到首列
          if (i === col.startIndex) {
            col.isDelete = true;
          }
          // 重置rowspan
          const newRowSpan = this.getAttrNum(col.element, 'rowspan') - 1;
          if (newRowSpan <= 1) {
            col.element.removeAttribute('rowspan');
          } else {
            col.element.setAttribute('rowspan', newRowSpan);
          }
        });
        // 将整行都移除掉
        row && this.tbody.removeChild(row);
      }

      if (lastRowNext) {
        cols.forEach((col: any) => {
          // 如果是被删除的td
          if (col.isDelete && col.endIndex > bottom) {
            let step = col.colIndex;
            let lastRowTargetCell;
            do {
              lastRowTargetCell = lastRowNext?.querySelector(`[data-col='${--step}']`);
            } while (!lastRowTargetCell && step >= 0);
            // 如果合并行被删除
            if (lastRowTargetCell) {
              $.insertAfter(col.element, lastRowTargetCell);
            } else {
              $.prependChild(col.element, lastRowNext);
            }
          }
        });
      }
      // 重置行索引
      this.resetTrIndex();
    } else {
      const { left, right } = indexs;
      const diff = right - left + 1;
      // 选出落在范围之内的td
      const cols = Array.from(this.table.querySelectorAll('[colspan]')).map((item) => {
        const startIndex = this.getAttrNum(item, 'col');
        const colspan = this.getAttrNum(item, 'colspan');
        const endIndex = startIndex + colspan - 1;

        // 判断是否重叠
        const max = [left, startIndex];
        const min = [right, endIndex];
        // 存在交叉
        if (Math.max(...max) <= Math.min(...min)) {
          return {
            startIndex,
            colspan,
            endIndex,
            element: item,
            rowIndex: this.getAttrNum(item.parentElement, 'row'),
            next: item.nextElementSibling,
            parent: item.parentElement,
            isDelete: false,
          }
        }
        return false;
      });

      // 删除行
      // let lastRowNext = document.getElementById(`row-${bottom}`)!.nextElementSibling;
      for (let i = left; i <= right; i++) {
        // 首先删除头
        this.colgroup.removeChild(document.getElementById(`colgroup-${i}`));
        // 处理单元格
        cols.forEach((col: any) => {
          // 判断是否删除到首列
          if (i === col.startIndex) {
            col.isDelete = true;
          }
          // 重置rowspan
          const newColSpan = this.getAttrNum(col.element, 'colspan') - 1;
          if (newColSpan <= 1) {
            col.element.removeAttribute('colspan');
          } else {
            col.element.setAttribute('colspan', newColSpan);
          }
        });
        // 删除td
        Array.from(this.table.rows).forEach((tr: any) => {
          const td = tr.querySelector(`[data-col='${i}']`);
          // 如果td存在
          if (td) {
            tr.removeChild(td);
          }
          // 如果是最后一列
          if (i === right) {
            let step = right;
            // 将其后面所有td索引重置
            let next;
            do {
              next = tr.querySelector(`[data-col='${++step}']`);
              next && this.resetTdIndex(next, this.getAttrNum(next, 'col') - diff);
            } while(step <= this.cols);
          }
        });
        // 处理td位移
        cols.forEach((col: any) => {
          if (col.isDelete && col.endIndex > right) {
            if (col.next) {
              $.insertBefore(col.element, col.next);
            } else {
              $.appendChild(col.element, col.element.parent);
            }
          }
        });
      }
      // 重置并且计算列索引
      this.resetTableColgroup(this.cols - diff);
    }
  }

  /**
   * 
   * @param element td元素
   * @param direction 方向
   */
  findMergeCols(element: HTMLElement, direction: Direction) {
    // 所有合并过的td集合
    // const cellMaps = new Map();
    const cells: Array<any> = [];
    // 找到td父元素tr
    const row = element.parentElement as HTMLElement;
    const index = this.getAttrNum(row, 'row');
    // 判断当前操作的td是否落在在合并过单元格的列范围之内
    Array.from(this.tbody.querySelectorAll('[rowspan]')).forEach((item: any) => {
      const minRowIndex = this.getAttrNum(item.parentElement, 'row');
      const rowspan = this.getAttrNum(item, 'rowspan') || 1;
      const maxRowIndex = minRowIndex + rowspan - 1;

      const minColIndex = this.getAttrNum(item, 'col');
      const maxColIndex = this.getAttrNum(item, 'colspan') + minColIndex - 1;
      // 区分方向
      if (
        (minRowIndex <= index && maxRowIndex > index && direction === Direction.down)
        ||
        (minRowIndex < index && maxRowIndex >= index && direction === Direction.up)
      ) {
        cells.push({
          element: item,
          index: minColIndex,
          min: minColIndex,
          max: maxColIndex,
        });
      }
    });

    return cells;
  }
  
  /**
   * 查询当前光标所在的td是否处于合并过td的范围之内 并且返回合并过的td所影响的tr
   * @param index 当前光标所在的td索引
   * @param direction 插入方向
   */
  findMergeRows(index: number, direction: Direction) {
    // 所有合并过的td集合
    const cellMaps = new Map();
    // 判断当前操作的td是否落在在合并过单元格的列范围之内
    Array.from(this.tbody.querySelectorAll('[colspan]')).forEach((item: any) => {
      // 列索引
      const minColIndex = this.getAttrNum(item, 'col');
      const colspan = this.getAttrNum(item, 'colspan') || 1;
      const maxColIndex = minColIndex + colspan - 1;
      let rowspan = this.getAttrNum(item, 'rowspan') || 1;
      // 区分方向
      if (
        (minColIndex <= index && maxColIndex > index && direction === Direction.right)
        ||
        (minColIndex < index && maxColIndex >= index && direction === Direction.left)
      ) {
        // 找到当前td所影响到的tr
        // 父tr元素
        let parent = item.parentElement;
        // 打上标记
        cellMaps.set(parent, {
          element: item,
          mergeType: MergeType.Start,
          index: this.getAttrNum(item, 'col'),
          colspan: this.getAttrNum(item, 'colspan'),
        });

        // 循环迭代出所有的受影响的tr
        while(--rowspan) {
          parent = parent.nextElementSibling;
          cellMaps.set(parent, {
            element: item,
            mergeType: MergeType.Leap,
            index: this.getAttrNum(item, 'col'),
            colspan: this.getAttrNum(item, 'colspan'),
          });
        }
      }
    });
    return cellMaps;
  }

  /**
   * 找单元格所在列是否存在合并单元格
   * @param col 单元格
   * @param direction 插入方向
   */
  findMergeCell = (tr: HTMLElement, index: number, direction: Direction) => {
    let mergeCell = tr.querySelector(`[data-col='${index}']`);
    if (!mergeCell) {
      do {
        // 选择器判断
        const selector = direction === Direction.right ? `[data-col='${--index}']` : `[data-col='${++index}']`;
        mergeCell = tr.querySelector(selector);
      } while (!mergeCell && index >= 0 && index <= this.cols );
    }
    return mergeCell;
  }

  /**
   * 合并单元格
   * @param elements td集合
   */
  mergeCells(elements: Array<HTMLElement>) {
    // td与tr的索引结合
    const colIndexs: number[] = [];
    const rowIndexs: number[] = [];

    elements.forEach((td, index) => {
      const tr = td.parentElement as HTMLElement;

      const colspan = this.getAttrNum(td, 'colspan') || 1;
      const rowspan = this.getAttrNum(tr, 'rowspan') || 1;
      const colIndex = this.getAttrNum(td, 'col');
      const rowIndex = this.getAttrNum(tr, 'row');
      // 将所有的列索引与行索引放入
      colIndexs.push(colIndex, colIndex + colspan - 1);
      rowIndexs.push(rowIndex, rowIndex + rowspan - 1);
      // 索引非0的全部删除
      if (index !== 0) {
        tr?.removeChild(td);
      }
    });
    // 计算应需要合并的行与列数
    const minColIndex = Math.min(...colIndexs);
    const maxColIndex = Math.max(...colIndexs);
    const minRowIndex = Math.min(...rowIndexs);
    const maxRowIndex = Math.max(...rowIndexs);

    // 获取第一个td进行设置
    const firstTd = elements[0];
    // 计算合并的
    firstTd.setAttribute('colspan', `${maxColIndex - minColIndex + 1}`);
    firstTd.setAttribute('rowspan', `${maxRowIndex - minRowIndex + 1}`);
  }

  /**
   * 拆分单元格
   * @param cell 合并过的单元格
   */
  splitCells(cell: HTMLTableCellElement) {
    const colIndex = this.getAttrNum(cell, 'col');
    const rowIndex = this.getAttrNum(cell.parentElement, 'row');
    const colspan = cell.colSpan;
    const rowspan = cell.rowSpan;

    // 移除合并属性
    cell.removeAttribute('colspan');
    cell.removeAttribute('rowspan');
    // 生成新的td
    Array.from(this.table.rows).forEach((row: HTMLTableRowElement) => {
      const index = this.getAttrNum(row, 'row');
      // 判断tr范围
      if (rowIndex <= index && index < rowIndex + rowspan) {
        let next;
        let i = 0;
        if (rowIndex === index) { // 如果正好是合并过的单元格所在的tr
          i = 1;
          next = cell.nextElementSibling;
        } else {
          let step = colIndex;
          // 查询出用用来插入的td
          do {
            next = row.querySelector(`[data-col='${++step}']`);
          } while(!next && step <= this.cols);
        }

        for (; i < colspan; i++) {
          // 创建td
          const td = this.createTableTd();
          // 设置索引
          this.resetTdIndex(td, colIndex + i);
          // 如果存在可插入位置
          if (next) {
            console.log(next);
            $.insertBefore(td, next);
          } else {
            $.prependChild(td, row);
          }
        }
      }

    });
  }

  /**
   * 重置行索引
   */
  resetTrIndex() {
    Array.from(this.table.rows).forEach((tr: HTMLElement, index: number) => {
      tr.setAttribute('data-row', `${index}`);
      tr.id = `row-${index}`;
    });
  }

  /**
   * 创建tr
   * @returns 
   */
  createTableTr() {
    const tr = document.createElement('tr');    
    return tr;
  }

  /**
   * 
   * @param td td元素
   * @param index 索引
   */
  resetTdIndex(td: HTMLTableCellElement, index: number) {
    td.setAttribute('data-col', `${index}`);
    td.id = `col-${index}`;
    
  }

  /**
   * 对td之后元素重排序
   * @param td 元素
   * @param step 设置步长
   * @param isSelf 是否设置当前元素
   */
  reorderTdIndex(td: HTMLTableCellElement, step: number, isSelf: boolean = false) {
    if (td) {
      let next = isSelf ? td : td.nextElementSibling as HTMLTableCellElement;
      while(next) {
        const oldIndex = this.getAttrNum(next, 'col');
        this.resetTdIndex(next, oldIndex + step);
        next = next.nextElementSibling as HTMLTableCellElement;
      }
    }
  }

  /**
   * 创建td
   * @returns td
   */
  createTableTd() {
    const td = document.createElement('td');
    td.innerHTML = `
      <div
        data-frame='1'
        class="${classTableDiv}"
      >
        <span><br /></span>
      </div>
      <div class="${classTableBreak}"><div>
    `;

    return td;
  }

  /**
   * 计算开始与结束点之间最大与做小索引
   * @param startElement 开始元素
   * @param endElement 结束元素
   */
  calSelectedIndexsAmongElements(startElement: HTMLElement, endElement: HTMLElement): any {
    // 起点列td的相关数据
    const [
      startRowIndexMax,
      startRowIndexMin,
      startColIndexMax,
      startColIndexMin
    ] = this.calSelectedIndexsAloneElement(startElement);
  
    // 终点列td的相关数据
    const [
      endRowIndexMax,
      endRowIndexMin,
      endColIndexMax,
      endColIndexMin
    ] = this.calSelectedIndexsAloneElement(endElement);
  
    // 计算row最大与最小索引值
    const rowMaxNum = Math.max(startRowIndexMax, endRowIndexMax);
    const rowMinNum = Math.min(startRowIndexMin, endRowIndexMin);
    // 计算td的最大与最小索引值
    const colMaxNum = Math.max(startColIndexMax, endColIndexMax);
    const colMinNum = Math.min(startColIndexMin, endColIndexMin);

    return {
      rowMaxNum,
      rowMinNum,
      colMaxNum,
      colMinNum,
    }
  }

  /**
   * 计算单个元素的索引值
   * @param colElement 元素
   */
  calSelectedIndexsAloneElement(colElement: HTMLElement) {
    // td
    const colspan = this.getAttrNum(colElement, 'colspan') || 1;
    const colIndexMin = this.getAttrNum(colElement, 'col');
    const colIndexMax = colIndexMin + colspan - 1;

    // tr
    const rowElement = colElement!.parentElement; // 起点td的tr
    const rowspan = this.getAttrNum(colElement, 'rowspan') || 1; // 起点td行是否合并
    const rowIndexMin = this.getAttrNum(rowElement, 'row'); // 起点tr的索引
    const rowIndexMax = rowIndexMin + rowspan - 1; // 如果起点td是进行过行合并的记录它的合并索引值

    return [rowIndexMax, rowIndexMin, colIndexMax, colIndexMin];
  }

  /**
   * 通过索引筛选元素重新计算索引
   * @param indexs 索引
   */
  resetSelectedIndexs(indexs: Indexs): Indexs {
    // 将索引装换为数组
    const rowMaxNumArray: number[]= [indexs.rowMaxNum];
    const rowMinNumArray: number[] = [indexs.rowMinNum];
    const colMaxNumArray: number[] = [indexs.colMaxNum];
    const colMinNumArray: number[] = [indexs.colMinNum];
    
    // 通过索引筛选元素
    Array.from(this.table.querySelectorAll('td')).forEach((item: HTMLElement) => {
      const [
        itemRowMaxNum,
        itemRowMinNum,
        itemColMaxNum,
        itemColMinNum
      ] = this.calSelectedIndexsAloneElement(item);
      // 判断区间是否存在交集
      const isRowMixed = isIntersect([itemRowMaxNum, itemRowMinNum], [indexs.rowMaxNum, indexs.rowMinNum]);
      const isColMixed = isIntersect([itemColMaxNum, itemColMinNum], [indexs.colMaxNum, indexs.colMinNum]);
      // 是否在范围内
      const isInRange = isRowMixed && isColMixed;
      if (isInRange) {
        // 插入队列
        rowMaxNumArray.push(itemRowMaxNum);
        rowMinNumArray.push(itemRowMinNum);
        colMaxNumArray.push(itemColMaxNum);
        colMinNumArray.push(itemColMinNum);
      }
    });
    // 重新计算新索引
    const newRowMaxNum = Math.max(...rowMaxNumArray, indexs.rowMaxNum);
    const newRowMinNum = Math.min(...rowMinNumArray, indexs.rowMinNum);
    const newColMaxNum = Math.max(...colMaxNumArray, indexs.colMaxNum);
    const newColMinNum = Math.min(...colMinNumArray, indexs.colMinNum);

    // console.log(newRowMaxNum, indexs.rowMaxNum);
    // console.log(newRowMinNum, indexs.rowMinNum);
    // console.log(newColMaxNum, indexs.colMaxNum);
    // console.log(newColMinNum, indexs.colMinNum);
    if (
      !(
        newRowMaxNum === indexs.rowMaxNum
        &&
        newRowMinNum === indexs.rowMinNum
        &&
        newColMaxNum === indexs.colMaxNum
        &&
        newColMinNum === indexs.colMinNum
      )
    ) {
      // 重新计算
      return this.resetSelectedIndexs({
        rowMaxNum: newRowMaxNum,
        rowMinNum: newRowMinNum,
        colMaxNum: newColMaxNum,
        colMinNum: newColMinNum,
      });
    }

    return indexs;
  }

  /**
   * 计算开始与结束点之间所有的应该被选中的td
   * @param startElement 开始元素
   * @param endElement 结束元素
   */
  getSelelctedRange(startElement: HTMLElement, endElement: HTMLElement): any {
    // 获取索引范围
    const indexs = this.calSelectedIndexsAmongElements(startElement, endElement);
    // 通过索引计算索引
    const result = this.resetSelectedIndexs(indexs);
    
    return result;
  }

  /**
   * 返回元素属性装换为数字
   * @param element 元素
   * @param prop 属性
   */
  getAttrNum(element: any, prop: string): number {
    const value = element.dataset[prop] || element.getAttribute(prop) || 0;
    return +value;
  }
}
