import { buildQueue, registerQueue } from '@/vuex/modules/queue';

describe('buildQueue', () => {
  test('schema', () => {
    const queue = buildQueue({});
    expect(queue).toHaveProperty('state', 'getters', 'mutations', 'actions', 'namespaced');
  });

  test('namespaced true', () => {
    const queue = buildQueue({ namespaced: true });
    expect(queue.namespaced).toBe(true);
  });

  test('namespaced false', () => {
    const queue = buildQueue({ namespaced: false });
    expect(queue.namespaced).toBe(false);
  });
});

describe('store module', () => {
  const queue = buildQueue({});
  const { state, getters, mutations, actions } = queue;

  test('state', () => {
    expect(state).toMatchObject({ queue: [], itemSeq: 0 });
  });

  describe('getters', () => {
    describe('when queue is empty', () => {
      const mockState = { ...state };

      test('next is undefined', () => {
        expect(getters.next(mockState)).toBeUndefined();
      });

      test('size is 0', () => {
        expect(getters.size(mockState)).toBe(0);
      });
    });

    describe('when queue is populated', () => {
      const mockState = { ...state, queue: [1, 2, 3] };

      test('next is 1', () => {
        expect(getters.next(mockState)).toBe(1);
      });

      test('size is 3', () => {
        expect(getters.size(mockState)).toBe(3);
      });
    });
  });

  describe('mutations', () => {
    describe('enqueue', () => {
      test('inserts item into queue and increments itemSeq', () => {
        const payload = { item: true, resolve: true }
        const mockState = { ...state };
        mutations.enqueue(mockState, payload);

        expect(mockState.queue).toMatchObject([{ id: 0, ...payload }]);
        expect(mockState.itemSeq).toBe(1)
      });

      test('inserts item in last position', () => {
        const payload = { item: true, resolve: true };
        const mockState = {
          queue: [{ id: 0, ...payload }],
          itemSeq: 1,
        };
        mutations.enqueue(mockState, payload);

        expect(mockState.queue).toMatchObject([{ id: 0, ...payload }, { id: 1, ...payload }]);
        expect(mockState.itemSeq).toBe(2)
      });
    });

    describe('dequeue', () => {
      test('removes the first item in queue', () => {
        const mockState = { ...state, queue: [1, 2] };
        mutations.dequeue(mockState);

        expect(mockState.queue).toMatchObject([2]);
      });

      test('does nothing if queue is empty', () => {
        const mockState = { ...state };
        mutations.dequeue(mockState);

        expect(mockState.queue).toMatchObject([]);
      });
    });
  });

  describe('actions', () => {
    describe('enqueue', () => {
      test('commits enqueue mutations', () => {
        const commit = jest.fn();
        actions.enqueue({ commit }, { item: true });

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toEqual('enqueue');
        expect(commit.mock.calls[0][1]).toMatchObject({ item: true });
      });
    });

    describe('dequeue', () => {
      test('commits dequeue mutations', () => {
        const item = true;
        const commit = jest.fn();
        const resolve = jest.fn();
        const getters = { next: { item, resolve } };
        actions.dequeue({ commit, getters }, { item, resolve });

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toEqual('dequeue');
        expect(commit.mock.calls[0][1]).toMatchObject({ item: true });
        expect(resolve.mock.calls.length).toBe(1);
        expect(resolve.mock.calls[0][0]).toEqual(item);
      });
    });
  });
})

describe('registerQueue', () => {
  test('registers at the right path', () => {
    const registerModule = jest.fn();
    registerQueue({ registerModule }, { namespace: 'foo/bar', name: 'baz' });

    expect(registerModule.mock.calls.length).toBe(1);
    expect(registerModule.mock.calls[0][0]).toMatchObject(['foo', 'bar', 'baz']);
  });
});
