module.exports = {
  chainWebpack: config => {
    config.plugins.delete('html')
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')
  },
  configureWebpack: {
    entry: { lib: ['./src/queuex.js'] },
    output: { libraryExport: 'default' },
  },
};
