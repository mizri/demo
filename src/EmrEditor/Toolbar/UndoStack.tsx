import { Button } from 'antd';
import { RedoOutlined, UndoOutlined } from '@ant-design/icons';

export type UndoStackProps = {
  title: string;
}

export function Undo(props: UndoStackProps) {

  return (
    <Button style={{ height: '100%' }} type="text">
      <RedoOutlined />
    </Button>
  )
}

export function Redo(props: UndoStackProps) {
  return (
    <Button style={{ height: '100%' }} type="text">
      <UndoOutlined />
    </Button>
  )
}
