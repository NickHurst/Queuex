export const mergeOptions = (left, right) => {
  return Object.keys(right).reduce((opts, key) => {
    if (typeof opts[key] !== 'object') return opts;
    return { ...opts, [key]: { ...left[key], ...opts[key] } };
  }, right);
};

export const getModuleState = (rootState, path) =>
  path.split('/').reduce((state, name) => state[name], rootState);
