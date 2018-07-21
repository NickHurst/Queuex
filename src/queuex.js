import { proxy } from './proxy';
import { plugin } from './vuex';

export default {
  install: (Vue, opts = {}) => {
    Vue.mixin({
      beforeCreate() {
        this.$queue = proxy(this.$store || this.$options.store);
      },
    });
  },
  Store: new Proxy(plugin, {
    construct(target, args) {
      return target(...args);
    },
  }),
};
