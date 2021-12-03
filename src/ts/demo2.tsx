import React from 'react';
import { person } from './constant';

function identity<T>(arg: T): T {
  return arg;
}

let output = identity<string>('mySrting');

let test = identity<{
  name: string,
  checked: boolean,
} | null>(null);

// ts基础类型
export default function BaseType() {

  function onClick() {
    // 直接修改为不同数据类型的数据会报错
    // isDone = 1;
    // 通过异步请求修改不会报错
    // fetch('http://yapi.gt.com/mock/183/form_designer/ok_treatment/ok_app/exam_temp').then((response) => {
    //   console.log(response);
    //   return response.json();
    // }).then((res) => {
    //   console.log(res);

    //   isDone = res.status;
    // });
  }

  return (
    <div>122</div>
  )
}