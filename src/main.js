import Vue from 'vue'
import App from './App.vue'
import Plugins from './components/index.js'

console.log(Plugins)

Vue.use(Plugins)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
