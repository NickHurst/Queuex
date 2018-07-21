import Vue from 'vue'
import Queuex from './queuex';
import App from './App.vue'
import store from './store';

Vue.use(Queuex);

Vue.config.productionTip = false

window.vm = new Vue({
  render: h => h(App),
  store,
}).$mount('#app')

window.store = window.vm.$store;
