import { proxy } from './proxy';
import { plugin } from './vuex';

export default {
  install: (Vue, opts = {}) => {
    Vue.mixin({
      beforeCreate() {
        this.$qx = proxy(this.$store || this.$options.store);
      },
    });
  },
  Store: plugin,
};
