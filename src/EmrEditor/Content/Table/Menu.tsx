import React from 'react';
import { Menu, Input } from 'antd';
import { MenuItem as CustomMenuItem } from '../../ContextMenu';
import { ArrowUpOutlined, ArrowDownOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';

export enum Direction {
  up = 0,
  down = 1,
  left = 2,
  right = 3,
}

export enum Ranks {
  ROW = 0,
  COL = 1,
  ALL = 3,
}

const INSERT_CONFIG = [{
  icon: <ArrowUpOutlined />,
  direction: Direction.up,
}, {
  icon: <ArrowDownOutlined />,
  direction: Direction.down,
}, {
  icon: <ArrowLeftOutlined />,
  direction: Direction.left,
}, {
  icon: <ArrowRightOutlined />,
  direction: Direction.right,
}]

export default function Menus(props: any) {
  const [nums, setNums] = React.useState<Array<number>>([1, 1, 1, 1]);

  /**
   * 
   * @param value 值
   * @param direction 插入方向
   */
  function onChange(value: string | number, direction: Direction) {
    value = +value || 1;
    nums[direction] = value;
    setNums([...nums]);
  }

  return (
    <Menu>
      {INSERT_CONFIG.map((item) => {
        const { icon, direction } = item;
        const value = nums[direction];

        return (
          <Menu.Item key={direction}>
            <button onClick={() => props.onInsert(direction, value)}>
              {icon}
              &nbsp;向{['上', '下', '左', '右'][direction]}插入&nbsp;
              <Input
                onClick={(event) => event.stopPropagation()}
                type="number"
                style={{ width: '48px' }}
                onChange={(event) => onChange(event.target.value, direction)}
                size="small"
                value={value}
              />
              &nbsp;行
            </button>
          </Menu.Item>
        )
      })}
      <Menu.Item key="5">
        <button
          onMouseEnter={(event) => props.onDeleteSelected(event, Ranks.ROW)}
          onMouseLeave={(event) => props.onDeleteSelected(event, Ranks.ROW)}
          onClick={(event) => props.onDelete(Ranks.ROW)}
        >
          删除所选行
        </button>
      </Menu.Item>
      <Menu.Item key="6">
        <button
          onMouseEnter={(event) => props.onDeleteSelected(event, Ranks.COL)}
          onMouseLeave={(event) => props.onDeleteSelected(event, Ranks.COL)}
          onClick={(event) => props.onDelete(Ranks.COL)}
        >
          删除所选列
        </button>
      </Menu.Item>
      <Menu.Item key="7">
        <button
          onClick={(event) => props.onDelete(Ranks.ALL)}
        >
          删除表格
        </button>
      </Menu.Item>
      {
        !props.collapsed
        &&
        <Menu.Item key="8">
          <button
            onClick={(event) => props.onMerge()}
          >
            合并单元格
          </button>
        </Menu.Item>
      }
      {
        props.merged
        &&
        <Menu.Item key="9">
          <button
            onClick={(event) => props.onSplit()}
          >
            拆分单元格
          </button>
        </Menu.Item>
      }
      <Menu.Item key="10">
        <CustomMenuItem>清除</CustomMenuItem>
      </Menu.Item>
    </Menu>
  )
}