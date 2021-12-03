
// 编辑器宽度
// export const EDITOR_DEFAULT_WIDTH = 794;
// export const EDITOR_DEFAULT_HEIGHT = 1123;
// 样式前缀
export const classPrefix: string = 'emr-editor';
// 最后一个有效元素是否是p标签
export const LAST_EMPTY_REG = /(<p\w*><br><\/p>)$/img;
// 是否是html标签
export const HTML_TAG_REG = /<.+>$/img;
// 空p标签
export const EMPTY_P_TAG = '<p></p>';
// 空b br标签
export const EMPTY_P_BR_TAG = '<p><br></p>';

export type ReactRef<T> = {
  current: T;
  [name: string]: any;
}