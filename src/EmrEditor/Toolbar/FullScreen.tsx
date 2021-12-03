import React from 'react';
import { Button } from 'antd';
import { BorderOutlined, ExpandOutlined } from '@ant-design/icons';
import EventHandler, { CustomEventType } from '../EventHandler';

export type FullScreenProps = {
  title: string;
}

export default function FullScreen(props: FullScreenProps) {
  let [isFull, setIsFull] = React.useState(false);

  function onClick() {
    // 是否全屏
    isFull = !isFull;
    setIsFull(isFull);
    // 发布全屏消息
    EventHandler.publish(CustomEventType.FullScreen, isFull);
  }
    
  return (
    <Button style={{ height: '100%' }} onClick={onClick} type="text">
      {isFull ? <ExpandOutlined /> : <BorderOutlined />}
    </Button>
  )
}