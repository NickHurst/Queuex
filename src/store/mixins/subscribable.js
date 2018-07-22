export const subscribable = {
  state: {
    subscriptions: {
      enqueue: [],
      dequeue: [],
    },
  },
  mutations: {
    subscribe(state, { enqueue, dequeue }) {
      const { enqueue: enqSubs, dequeue: deqSubs } = state.subscriptions
      state.subscriptions = {
        enqueue: enqueue ? [...enqSubs, enqueue] : enqSubs,
        dequeue: dequeue ? [...deqSubs, dequeue] : deqSubs,
      }
    },
    unsubscribe(state, { enqueue, dequeue }) {
      const { enqueue: enqSubs, dequeue: deqSubs } = state.subscriptions
      state.subscriptions = {
        enqueue: enqueue ? enqSubs.filter(s => s !== enqueue) : enqSubs,
        dequeue: dequeue ? deqSubs.filter(s => s !== dequeue) : deqSubs,
      };
    },
  },
};
