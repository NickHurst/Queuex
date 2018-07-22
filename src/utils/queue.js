import { moduleStoreProxy } from './module';

export const queueProxy = (store, name) => {
  const queueStore = name === 'root' ? store : moduleStoreProxy(store, name);
  const queue = queueStore.state.queue || queueStore.getters('queue');

  return new Proxy(queue, {
    get(target, prop) {
      if (['enqueue', 'enq', 'push'].includes(prop)) {
        return item => queueStore.dispatch('enqueue', { item });
      }

      if (['dequeue', 'deq', 'pop'].includes(prop)) {
        return () => queueStore.dispatch('dequeue');
      }

      if (prop === 'peak') return queueStore.getters('next');

      return target[prop];
    },
  });
};
