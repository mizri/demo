import React from 'react';
import { person } from './constant';

let isDone: boolean = false;
let decLiteral: number = 6;
let hexLiteral: number = 0xf00d;
let binaryLiteral: number = 0b1010;
let octalLiteral: number = 0o744;

let name: string = person.name;
let age: number = person.age;
let sentence: string = `hello, my name is ${name} age is ${age}`;

// ts基础类型
export default function BaseType() {

  function onClick() {

    // 直接修改为不同数据类型的数据会报错
    // isDone = 1;
    // 通过异步请求修改不会报错
    fetch('http://yapi.gt.com/mock/183/form_designer/ok_treatment/ok_app/exam_temp').then((response) => {
      console.log(response);
      return response.json();
    }).then((res) => {
      console.log(res);

      isDone = res.status;
    });
  }

  return (
    <div>
      <div>{isDone}</div>
      <div>{decLiteral}</div>
      <div>{hexLiteral}</div>
      <div>{binaryLiteral}</div>
      <div>{octalLiteral}</div>
      <div>{sentence}</div>
      <div><button onClick={onClick}>点修改</button></div>
    </div>
  )
}