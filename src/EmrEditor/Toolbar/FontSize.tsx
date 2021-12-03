import { Dropdown, Menu, Button } from 'antd';
import { LineHeightOutlined } from '@ant-design/icons';
import { BasisToolProps } from './BasisTool';
import * as Command from '../Command';
import { classPrefix } from '../constant';


const fontSizeList = [{
  text: '10px',
  value: '1',
}, {
  text: '13px',
  value: '1',
}, {
  text: '16px',
  value: '3',
}, {
  text: '18px',
  value: '4',
}, {
  text: '24px',
  value: '5',
}];
// , {
//   text: '32px',
//   value: '6',
// }
// , {
//   text: '48px',
//   value: '7',
// }

export default function FontSize(props: BasisToolProps) {

  function onClick(fontSize: string)  {
    Command.exec(props.order, fontSize);
  }

  return (
    <Dropdown
      placement="bottomCenter"
      overlay={
        <Menu>
          {fontSizeList.map((item) => {
            return (
              <Menu.Item key={item.value} onClick={() => onClick(item.value)}>
                <button className={`${classPrefix}-button`}>
                  <b style={{ fontSize: item.text }}>{item.text}</b>
                </button>
              </Menu.Item>
            );
          })}
        </Menu>
      }
      trigger={['click']}
    >
      <Button style={{ height: '100%' }} type="text">
        <LineHeightOutlined />
      </Button>
    </Dropdown>
  )
}