import Vue from 'vue';
import Vuex from 'vuex';
import Queuex from './queuex';

Vue.use(Vuex);
Vue.use(Queuex);

const queue = Queuex.Store({
  queues: [
    { name: 'foo' },
    {
      name: 'bar',
      options: { priority: true },
    },
    {
      name: 'baz',
      options: {
        priority: true,
        queues: ['a', 'b', 'c'],
        default: 'c',
      },
    },
  ]
});

export default new Vuex.Store({
  plugins: [queue],
});
