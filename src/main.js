import Vue from 'vue'
import Queuex from './queuex';
import store from './store';

Vue.use(Queuex);

Vue.config.productionTip = false;

window.vm = new Vue({
  store,
  render: h => h('p', {}, ['Queuex']),
});

window.store = window.vm.$store;
