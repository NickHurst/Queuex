export const subscriptionsMixin = {
  state: {
    subscriptions: {
      enqueue: [],
      dequeue: [],
    },
  },
  mutations: {
    subscribe(state, { mutation, callback }) {
      const subscriptions = state.subscriptions[mutation];
      state.subscriptions = {
        ...state.subscriptions,
        [mutation]: [...subscriptions, callback],
      };
    },
    unsubscribe(state, { mutation, callback }) {
      const subscriptions = state.subscriptions[mutation];
      state.subscriptions = {
        ...state.subscriptions,
        [mutation]: subscriptions.filter(s => s !== callback),
      };
    },
  },
};
