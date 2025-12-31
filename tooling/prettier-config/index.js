module.exports = {
  semi: true, // 强制使用分号
  singleQuote: true, // 使用单引号
  tabWidth: 2, // 缩进 2 空格
  trailingComma: 'es5', // ES5 尾随逗号
  printWidth: 100, // 每行最大 100 字符
  arrowParens: 'always', // 箭头函数始终使用括号
  endOfLine: 'lf', // 使用 LF 换行符
  plugins: ['prettier-plugin-tailwindcss'], // Tailwind CSS 类名排序插件
  // Tailwind CSS v4 需要指定 CSS 样式表文件（相对于各个项目根目录）
  tailwindStylesheet: './src/renderer/src/styles/index.css',
};
