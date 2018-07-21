export const proxy = store => {
  return new Proxy(store.state.queue.root.queue, {
    get(target, property) {
      if (property === 'enqueue' || property === 'dequeue') {
        return item => store.dispatch(`queue/${property}`, { item });
      }
    },
  });
};
