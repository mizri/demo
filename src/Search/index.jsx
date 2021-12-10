import React from 'react';
import { Input, Dropdown, Menu, Button } from 'antd';
import 'antd/dist/antd.css';
import './index.less';

export default class Search extends React.Component {


  render() {
    return (
      <Dropdown
      placement="bottomCenter"
      overlay={
        <div>1231231</div>
      }
      trigger={['click']}
    >
      <Button style={{ height: '100%' }} type="text">
        abc
      </Button>
    </Dropdown>
    )
  }
}