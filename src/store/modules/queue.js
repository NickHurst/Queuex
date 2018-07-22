import { mergeOptions } from '@/utils/module';
import { subscribable } from '../mixins/subscribable';

export const queueModule = {
  state: {
    queue: [],
    itemSeq: 0,
  },
  getters: {
    next({ queue: [next] }) {
      return next;
    },
    size({ queue }) {
      return queue.length;
    },
  },
  mutations: {
    enqueue(state, { item, resolve }) {
      state.queue = [...state.queue, { id: state.itemSeq, item, resolve }];
      state.itemSeq += 1;
      return item;
    },
    dequeue(state) {
      const [, ...queue] = state.queue;
      state.queue = queue;
    },
  },
  actions: {
    enqueue({ commit }, { item }) {
      return new Promise(resolve => commit('enqueue', { item, resolve }));
    },
    dequeue({ commit, getters: { next: { item, resolve } } }) {
      commit('dequeue', { item });
      resolve(item);

      return item;
    },
  },
};

const buildQueue = ({ namespaced = true }) =>
  mergeOptions(subscribable, { ...queueModule, namespaced });

export const registerQueue = (store, { namespace, name, ...options }) => {
  const path = [...namespace.split('/'), name];
  store.registerModule(path, buildQueue(options));
};
