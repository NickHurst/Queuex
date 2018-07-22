import { registerPriorityQueue, registerQueue } from './index';

export const registerRoot = (store, { namespace, rootQueue }) => {
  store.registerModule(namespace, {
    namespaced: true,
    state: {
      queues: {},
    },
    getters: !rootQueue ? {} : {
      queue({ root: { queue } }) { return queue; },
      itemSeq({ root: { itemSeq } }) { return itemSeq; },
      subscriptions({ root: { subscriptions } }) { return subscriptions; },
    },
    mutations: {
      register(state, { name, namespaced = true, ...options }) {
        const path = namespaced ? `${namespace}/${name}` : namespace;
        state.queues = { ...state.queues, [name]: { ...options, path } };
      },
      unregister(state, { name }) {
        if (name === 'root') return;

        const { [name]: _deleted, ...queues } = state.queues;
        state.queues = queues;
      },
    },
  });

  store.subscribe(({ type, payload }, state) => {
    const [, path, mutation,] = type.match(/(.*)\/(.*)/);
    if (!path.includes(namespace)) return;

    if (path === namespace) {
      if (mutation === 'register') {
        const { name, prioritized = false } = payload;
        const options = typeof prioritized === 'object' ? prioritized : {}
        const register = prioritized
          ? registerPriorityQueue
          : registerQueue;

        return register(store, { name, namespace, ...options });
      }

      if (mutation === 'unregister') {
        if (payload.name === 'root') return;
        return store.unregisterModule([namespace, payload.name]);
      }
    }
  });
};
