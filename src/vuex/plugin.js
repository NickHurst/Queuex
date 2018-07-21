import { getModuleState } from '@/utils/module';
import { registerRoot } from './modules';

const DEFAULT_OPTIONS = {
  queues: [],
  namespace: 'queue',
  rootQueue: true,
  namespaceRootQueue: false,
};

export const plugin = (options = {}) => {
  const { namespace, queues, rootQueue, namespaceRootQueue } =
    { ...DEFAULT_OPTIONS,...options };

  return store => {
    registerRoot(store, { namespace, rootQueue });

    if (rootQueue) {
      store.commit(`${namespace}/register`, {
        name: 'root', namespaced: namespaceRootQueue,
      });
    }

    queues.forEach(({ name, options = {} }) =>
      store.commit(`${namespace}/register`, { name, options }));

    store.subscribe(({ type, payload }, rootState) => {
      let [, path, mutation,] = type.match(/(.*)\/(.*)/);
      if (!path.includes(namespace)) return;
      if (path === namespace) path = `${path}/root`;

      const state = getModuleState(rootState, path);

      if (['enqueue', 'dequeue'].includes(mutation)) {
        const { subscriptions: { [mutation]: handlers = [] } } = state;
        handlers.forEach(subscriber => subscriber(payload));
      }
    });
  };
};
