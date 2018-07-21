# Queuex

## If you came across this don't use it because I only spent 1.5 days making it

A Vuex plugin for creating store modules that function as queues. Currently
supports one global queue (can be disabled), the ability to create named queues
(seperate namespaced modules), as well as priority queues with configurable
priorities. You can also subscribe to a queue to get notified when something has
been enqueued and/or dequeued.

Basic Usage (as of right now):

```js
// store.js
import Vue from 'vue';
import Vuex from 'vuex';
import Queuex from 'queuex';

Vue.use(Vuex);

const queue = new Queuex.Store({
  queues: [
    { name: 'foo' },
    {
      name: 'bar',
      prioritized: true,
    },
    {
      name: 'baz',
      prioritized: true,
      priorities: ['a', 'b', 'c'],
      default: 'c',
    },
  ]
});

export default new Vuex.Store({
  plugins: [queue],
});
```

The stores state tree would then look like this:

```js
{
  queue: {
    queues: {}, // queue module path registry
    global: {
      queue: [],
    },
    foo: {
      queue: [],
    },
    bar: {
      queues: ["high", "default", "low"],
      defaultQueue: "default",
      // these are the same as regular queue modules
      // except will get pulled by priority by parent module (bar)
      high: {
        queue: [],
      },
      default: {
        queue: [],
      },
      low: {
        queue: [],
      },
    },
    bar: {
      queues: ["a", "b", "c"],
      defaultQueue: "c",
      a: {
        queue: [],
      },
      b: {
        queue: [],
      },
      c: {
        queue: [],
      },
    },
  }
}
```

And the Vue plugin can be added as well (adds a `$queue` property on components):

```js
Vue.use(Queuex);

// in a component
// get the global queue and enqueue/dequeu items
this.$queue; // []
this.$queue.enqueue({ foo: "bar" }); // Promise (resolves when it is dequeued)
this.$queue; // [{ foo: "bar" }]
this.$queue.dequeue(); // { foo: "bar" }
this.$queue; // []

// named queue
this.$queue.foo; // []
this.$queue.foo.enqueue({ foo: "bar" });
this.$queue.foo; // [{ foo: "bar" }]
this.$queue.foo.dequeue() // { foo: "bar" }
this.$queue.foo; // []

// priority queue
this.$queue.bar;
this.$queue.bar.enqueue({ foo: "bar" }); // default priority
this.$queue.bar; // [{ foo: "bar" }]
this.$queue.bar.enqueue({ bar: "baz", priority: "high" });
this.$queue.bar; // [{ bar: "baz" }, { foo: "bar" }]
this.$queue.bar.dequeue(); // { bar: "baz" }
this.$queue.bar; // [{ foo: "bar" }]
```
