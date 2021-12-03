import TableHandler from './TableHandler';
import TableOperate from './TableOperate';
import Selection from '../../Selection';
import './index.less';

export default class Table {
  static initialize() {
    TableHandler.initialize();
  }

  /**
   * 
   * @param options 创建安表格
   */
  static create(options: any) {
    const instance = new TableOperate(options)
    TableHandler.instances.push(instance);
    return instance.table;
  }

  /**
   * 恢复选择表格
   * @param table 表格
   */
  static restoreTableSelect(table: HTMLTableElement) {
    // 获取到第一个td在下的元素创建选区
    const td = table.querySelector('td');
    // 获取子元素
    const child = td?.children[0];
    // 选中当前元素
    Selection.createRangeByElement(child, true, true);
    Selection.restoreSelection();
  }
}
