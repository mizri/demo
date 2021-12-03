import React from 'react';
import EmrEditor from '.';

export default function Demo() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setVisible(true);
    }, 5000);
  }, [])

  return (
    <div style={{ padding: '24px', height: 'calc(100vh - 48px)' }}>
      {/* <EmrEditor
        innerHTML="<p>这是第一个编辑器</p><p>第二行</p>"
      /> */}
      <EmrEditor
        innerHTML="<p><span>这是第一个编辑器</span></p><p id='test'>第二行</p><p><br></p>"
        // innerHTML="都不<p>这是第一个编辑器</p><p>第二行</p><p><br></p>"
        // innerHTML=""
      />
    </div>
  );
}