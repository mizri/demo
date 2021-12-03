import { Button } from 'antd';
import * as Icon from '@ant-design/icons';
import * as Command from '../Command';

export type BasisToolProps = {
  title: string;
  order: string;
  icon?: any;
}

// 将Icon转换为普通对象
const IconFont: any = {};
Object.entries(Icon).forEach(([key, value]) => {
  IconFont[key] = value;
});

export default function BasisTool(props: BasisToolProps) {
  function onClick() {
    Command.exec(props.order);
  }
  // 操作对应的图标
  const Font = IconFont[props.icon];

  return (
    <Button style={{ height: '100%' }} onClick={onClick} type="text">
      <Font  />
    </Button>
  )
}