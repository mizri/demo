// import React from 'react';
// import EmrEditor from '.';

// export default function Demo() {
//   const [visible, setVisible] = React.useState(false);

//   React.useEffect(() => {
//     setTimeout(() => {
//       setVisible(true);
//     }, 5000);
//   }, [])

//   return (
//     <div style={{ padding: '24px', height: 'calc(100vh - 48px)' }}>
//       {/* <EmrEditor
//         innerHTML="<p>这是第一个编辑器</p><p>第二行</p>"
//       /> */}
//       <EmrEditor
//         // innerHTML="<p><span>这是第一个编辑器</span></p><p id='test'>第二行</p><p><br></p>"
//         // innerHTML="都不<p>这是第一个编辑器</p><p>第二行</p><p><br></p>"
//         // innerHTML=""
//       />
//     </div>
//   );
// }

import React from 'react';
import { Input, Dropdown, Menu, Button } from 'antd';
// import 'antd/dist/antd.css';
import './index.less';

export default class Search extends React.Component {
  state = {
    visible: false,
    data: [],
  }

  lastInputValue = ''

  onFocus = () => {
    
    if (!this.state.visible) {

      this.setState({ visible: true });
    }
  }

  onBlur = () => {
    // setTimeout(() => {000280
    //   this.setState({ visible: false });
    // }, 100);
  }

  onClick = () => {
    this.inputRef.select();
  }

  onKeyDown = (event) => {
    if (event.keyCode === 13) {
      const { data } = this.state;
      if (this.inputRef.value.trim() === this.lastInputValue.trim()) return;
     const currentValue =  this.inputRef.value.replace(this.lastInputValue, '');


      data.push({
        key: currentValue,
        value: currentValue,
      });
      this.lastInputValue = this.inputRef.value;

      this.setState({
        data
      });

      this.onFocus();
    }
  }

  onDelete = (key) => {
    const data = this.state.data.filter(item => {
      return item.key !== key;
    });

    console.log(123123);
    const reg = new RegExp(key, 'img');
    this.setState({ data }, () => {
      this.inputRef.value = this.inputRef.value.replace(reg, '');
      this.lastInputValue = this.inputRef.value;
    });

    

  }

  render() {
    const { visible, data } = this.state;
    return (
      <Dropdown
        visible={visible && data.length}
        placement="bottomCenter"
        overlayClassName="test"
        overlay={<div>{
          data.map((item, i) => {
            return (
              <div style={{ border: '1px solid red', padding: '12px' }} key={i} onClick={() => this.onDelete(item.key)}>
                {item.value}
                删除
              </div>
            )
          })  
        }</div>}
        // trigger={['click']}
      >
        <input
          onClick={this.onClick}
          defaultValue=""
          ref={(ins) => this.inputRef = ins}
          onKeyDown={this.onKeyDown}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          style={{ width: '240px' }}
        />
      </Dropdown>
    )
  }
}