import React from 'react';
import classnames from 'classnames';
import { classPrefix } from '../constant';

export type PlaceholderProps = {
  visible: boolean;
}

export default function Placeholder(props: PlaceholderProps) {

  return (
    <p
      className={
        classnames(
          `${classPrefix}-placeholder`,
          { visible: props.visible },
        )
      }
    >
      请输入
    </p>
  );
}