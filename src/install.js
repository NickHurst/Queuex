import { queueProxy } from '@/utils/queue';

export const Qx = store => {
  return new Proxy(store.getters['qx/queue'], {
    get(target, prop) {
      if (prop === 'add') {
        return (name, prioritized = false) =>
          store.dispatch('qx/register', { name, prioritized });
      }

      if (prop === 'remove') {
        return name => store.dispatch('qx/unregister', { name })
      }

      if (store.state.qx.queues.keys.includes(prop)) {
        return queueProxy(store, prop);
      }

      return queueProxy(store, 'root')[prop];
    },
  });
};

function qxInit() {
  let { store, parent } = this.$options;

  if (!store) store = parent && parent.$store;
  if (typeof store === 'function') store = store();

  this.$qx = Qx(store);
};

export default Vue => Vue.mixin({ beforeCreate: qxInit });
