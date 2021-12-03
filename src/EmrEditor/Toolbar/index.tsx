import React from 'react';
import { classPrefix } from '../constant';
import BarBox from './BarBox';
import FontSize from './FontSize';
import Justify from './Justify';
// import Table from './Table';
import FullScreen from './FullScreen';
import { Redo, Undo } from './UndoStack';
import BasisTool from './BasisTool'
import Menu from './Menu';
import './index.less';

export type ToolBarProps = {
  // classPrefix: string;
}

export default function Toolbar(props: ToolBarProps) {
  // const { classPrefix } = props;

  return (
    <div className={`${classPrefix}-bar`}>
      <BarBox>
        <Menu title="插入" />
      </BarBox>
      <div className="line" />
      <BarBox>
        <BasisTool title="加粗" order="bold" icon="BoldOutlined" />
        <BasisTool title="斜体" order="italic" icon="ItalicOutlined" />
        <BasisTool title="下划线" order="underline" icon="UnderlineOutlined" />
        <BasisTool title="删除线" order="strikeThrough" icon="StrikethroughOutlined" />
        <FontSize title="字号" order="fontSize" />
        <Justify title="对其方式" order="justify" />
        {/* <Table title="表格" /> */}
      </BarBox>
      <div className="line" />
      <BarBox>
        <Redo title="恢复" />
        <Undo title="撤销" />
        <FullScreen title="全屏/窗口" />
      </BarBox>
    </div>
  );
}