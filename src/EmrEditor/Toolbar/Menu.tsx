
import { Dropdown, Menu, Button } from 'antd';
import { PlusSquareOutlined, TableOutlined, PictureOutlined } from '@ant-design/icons';
import Table from './Table'
import { classPrefix } from '../constant';

export type MenuProps = {
  title: string;
}

export function Item(props: any) {
  return (
    <div className="menu-item">{props.children}</div>
  )
}

export default function Ltalic(props: MenuProps) {

  return (
    <Dropdown
      overlay={
        <Menu className={`${classPrefix}-menu`}>
          <Menu.ItemGroup key="1" title="通用">
            <Menu.Item key="1">
              <Item>
                <Table />
              </Item>
            </Menu.Item>
            <Menu.Item key="2">
              <Item>
                <PictureOutlined />
                <span>图片</span>
              </Item>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.ItemGroup key="3" title="检查项">
            <Menu.Item key="3">
              <Item>
                <TableOutlined />
                <span>表格</span>
              </Item>
            </Menu.Item>
            <Menu.Item key="4">
              <Item>
                <TableOutlined />
                <span>表格</span>
              </Item>
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu>
      }
      trigger={['click']}
      placement="bottomCenter"
    >
      <Button style={{ height: '100%' }} type="text">
        <PlusSquareOutlined />
      </Button>
    </Dropdown>
  )
}
