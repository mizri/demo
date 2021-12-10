// function Module(id, parent) {
//   this.id = id;
//   this.epxorts = {};
//   this.parent = parent;
//   if (parent && parent..children) {
//     parent.children.push(this);
//   }

//   this.filename = null;
//   this.loaded = false;
//   this.children = [];
// }

console.log(exports);
console.log(require);
console.log(module);
console.log(__filename);
console.log(__dirname);
console.log(module.exports === exports);