import { mergeOptions } from '@/utils/module';
import { subscriptionsMixin as subscriptions } from './subscriptions-mixin';
import { registerQueue } from './queue';

const defaultQueues = ['high', 'default', 'low'];

export const buildPriorityQueue = ({ namespace, queues, default: defaultPriority }) =>
  mergeOptions(subscriptions, {
    namespaced: true,
    state: {
      queues,
      default: defaultPriority,
    },
    getters: {
      queue({ queues, ...state }) {
        return queues.reduce((queue, priority) => {
          const withPriority = item => ({ ...item, priority });
          return [...queue, ...state[priority].queue.map(withPriority)];
        }, []);
      },
      size(_state, { queue }) {
        return queue.length;
      },
      next(_state, { queue: [next] }) {
        return next;
      },
    },
    mutations: {
      enqueue() { /** noop */ },
      dequeue() { /** noop */ },
    },
    actions: {
      enqueue({ dispatch }, { item, priority = defaultPriority }) {
        return dispatch(`${namespace}/${priority}/enqueue`, { item }, { root: true });
      },
      dequeue({ dispatch, getters: { next: { item, priority } = {} } }) {
        if (item) dispatch(`${namespace}/${priority}/dequeue`, { item }, { root: true });
      },
    },
  });

export const registerPriorityQueue = (store, { namespace, name, queues = defaultQueues, default: defaultPriority }) => {
  const path = [...namespace.split('/'), name];

  if (!defaultPriority) defaultPriority = 'default';
  if (!queues.includes(defaultPriority)) queues.push(defaultPriority);

  store.registerModule(path, buildPriorityQueue({
    namespace: path.join('/'),
    queues,
    default: defaultPriority,
  }));

  namespace = path.join('/');
  queues.forEach(name => {
    registerQueue(store, { namespace, name });
  });
};
