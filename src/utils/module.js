export const mergeOptions = (left, right) => {
  return Object.keys(right).reduce((opts, key) => {
    if (typeof opts[key] !== 'object') return opts;
    return { ...opts, [key]: { ...left[key], ...opts[key] } };
  }, right);
};

export const getModuleState = (rootState, path) =>
  path.split('/').reduce((state, name) => state[name], rootState);

export const moduleStoreProxy = (store, name) => {
  const path = store.state.qx.queues[name];
  const state = getModuleState(store.state, path);

  return new Proxy(store, {
    get(target, prop) {
      if (prop === 'state') return state;
      if (prop === 'getters') return name => store.getters[`${path}/${name}`];
      if (prop === 'dispatch') {
        return (action, ...args) =>
          store.dispatch(`${path}/${action}`, ...args);
      }

      return undefined;
    }
  });
};
