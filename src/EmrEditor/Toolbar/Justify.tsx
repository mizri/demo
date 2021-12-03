import { Dropdown, Menu, Button } from 'antd';
import {
  AlignCenterOutlined, AlignLeftOutlined, AlignRightOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { BasisToolProps } from './BasisTool';
import * as Command from '../Command';
import { classPrefix } from '../constant';

const JustifyList = [{
  icon: <AlignCenterOutlined />,
  order: 'justifyCenter',
  text: '居中对齐',
}, {
  icon: <AlignLeftOutlined />,
  order: 'justifyLeft',
  text: '左对齐',
}, {
  icon: <AlignRightOutlined />,
  order: 'justifyRight',
  text: '右对齐',
}, {
  icon: <MenuOutlined />,
  order: 'justifyFull',
  text: '两端对齐',
}]

export default function Justify(props: BasisToolProps) {

  function onClick(order: string)  {
    Command.exec(order);
  }

  return (
    <Dropdown
      placement="bottomCenter"
      overlay={
        <Menu>
          {JustifyList.map((item) => {
            return (
              <Menu.Item key={item.order} onClick={() => onClick(item.order)}>
                <button className={`${classPrefix}-button`}>
                  {item.icon} {item.text}
                </button>
              </Menu.Item>
            );
          })}
        </Menu>
      }
      trigger={['click']}
    >
      <Button style={{ height: '100%' }} type="text">
        <AlignLeftOutlined />
      </Button>
    </Dropdown>
  )
}