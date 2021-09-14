const path = require('path')

module.exports = {
  publicPath: './',
  productionSourceMap: false,
  configureWebpack: {
    name: 'olMap组件',
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
        '@': path.join(__dirname, 'src'),
        // olMap: path.join(__dirname, 'public', 'js', 'olMap.common.js')
      }
    }
  },
}