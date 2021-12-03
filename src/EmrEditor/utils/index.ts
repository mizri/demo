// 节流
export function throtte<T extends Function>(callback: T, stamp: number = 100) {
  let flag: boolean = false;
  return (...argus: []) => {
    if (!flag) {
      flag = true;
      setTimeout(() => {
        flag = false;
        callback.apply(null, argus);
      }, stamp);
    }

  }
}

// 防抖
export function debounce<T extends Function>(callback: T, stamp: number = 100) {
  let timer: NodeJS.Timer | null = null;

  return (...argus: []) => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      callback.apply(null, argus);
    }, stamp);
  }
}

// 唯一id
export function guid(prefix?: string) {
  const id = Math.random().toString(32).slice(2);
  if (prefix) {
    return `${prefix}-${id}`;
  }

  return id;
}

// 判断两个区间是否相交
export function isIntersect(arr1: number[], arr2: number[]){
  let start = [Math.min(...arr1), Math.min(...arr2)]; //区间的两个最小值
  let end = [Math.max(...arr1), Math.max(...arr2)]; //区间的两个最大值
  return Math.max(...start) <= Math.min(...end); //最大值里的最小值 是否 小于等于 最大值的最小值
}
