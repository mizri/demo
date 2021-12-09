import React from 'react';
import ReactDOM from 'react-dom';
import classname from 'classnames';
import './index.less';

function Fly(props: any) {
  const [end, setEnd] = React.useState(false);
  const ref = React.createRef<any>();
  const target = props.target;
  const rect = target.getBoundingClientRect();
  const { left: targetLeft, top: targetTop } = rect;

  React.useLayoutEffect(() => {
    const { left, top } = ref.current.getBoundingClientRect();
    ref.current.style.left = `${targetLeft}px`;
    ref.current.style.top = `${targetTop}px`;

    setTimeout(() => {
      setEnd(true);
    }, 1000);
  }, []);

  return (
    <div ref={ref} className={classname('fly', { end })}>动画</div>
  )
}


Fly.initialize = function (target: any) {
  var div = document.createElement('div');
    document.body.appendChild(div);

    ReactDOM.render(<Fly target={target} />, div);
}

export default class Amation extends React.Component {

  target: HTMLElement | null = null

  componentDidMount() {
    this.target = document.getElementById('test') as HTMLElement;

    // const rect = this.target.getBoundingClientRect();
  }

  onClick = () => {
    Fly.initialize(this.target);
  }

  render() {
    return (
      <div>
        <button onClick={this.onClick}>开始</button>
        <div id="test" style={{ position: 'absolute', top: '20px', right: '20px' }}>个人中</div>
      </div>
    )
  }
}