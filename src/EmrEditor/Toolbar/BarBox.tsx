import React from 'react';
import { Tooltip } from 'antd';
import { classPrefix } from '../constant';

export default function BarItem(props: any) {
  return (
    <div className={`${classPrefix}-box`}>
      {React.Children.map(props.children, (item: React.ReactElement) => {
        return (
          <Tooltip placement="top" title={item.props.title} autoAdjustOverflow={false}>
            <div className={`${classPrefix}-item`}>
              {item}
            </div>
          </Tooltip>
        )
      })}
    </div>
  );
}