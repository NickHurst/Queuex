import { mergeOptions } from '@/utils/module';
import { subscribable } from '../mixins/subscribable';
import { registerQueue } from './queue';

const DEFAULT_QUEUE = 'default';
const DEFAULT_QUEUES = ['high', 'default', 'low'];

export const priorityQueueModule = (namespace = '', queues, defaultQueue) => ({
  namespaced: true,
  state: {
    queues,
    defaultQueue,
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
    enqueue({ dispatch }, { item, priority = defaultQueue }) {
      return dispatch(`${namespace}/${priority}/enqueue`, { item }, { root: true });
    },
    dequeue({ dispatch, getters: { next: { item, priority } = {} } }) {
      if (item) dispatch(`${namespace}/${priority}/dequeue`, { item }, { root: true });
    },
  },
});

const buildQueue = ({ namespace, queues, defaultQueue }) => {
  const queueModule = priorityQueueModule(namespace, queues, defaultQueue);
  return mergeOptions(subscribable, queueModule);
}

export const registerPriorityQueue = (store, { namespace, name, ...queueOpts }) => {
  let { queues = DEFAULT_QUEUES, defaultQueue = DEFAULT_QUEUE } = queueOpts;

  namespace = [...namespace.split('/'), name].join('/');
  if (!queues.includes(defaultQueue)) queues.push(defaultQueue);

  store.registerModule(namespace, buildQueue({ namespace, queues, defaultQueue }));
  queues.forEach(name => { registerQueue(store, { namespace, name }) });
};
