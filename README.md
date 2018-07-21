# Queuex

A Vuex plugin for creating store modules that function as queues. Currently
supports one global (root) queue (can be disabled), the ability to create named queues
(seperate namespaced modules), as well as priority queues with configurable
priorities.

**If you came across this and for some reason want to start using it -- don't.
It technically "works" in the current state, but this is mostly just a PoC and
is but still early in (a slow but sure) development and these docs aren't likely
100% accurate.**

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
    // queue module path registry
    queues: { foo: "queue/foo", bar: "queue/bar", baz: "queue/baz", },
    // the global or root queue, even though the module is namespaced
    // it's actions/getters/state are proxied by the actual root module
    // this queue can't be removed and will be created by default --
    // passing { rootQueue: false } to the Queuex.Store options will disable it
    root: {
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

Queues don't have to registered when you initialize the plugin, and can be
registered/destroyed at anypoint by invoking the `register/unregister` actions on the root
queuex module:

```js
// add the plugin without any queues (not even the global queue)
export default new Vuex.Store({
  plugins: [new Queuex.Store({ rootQueue: false })],
});

// then is some part of the app where you'll need a queue
this.$store.dispatch("queue/register", { name: "tmp", prioritized: true });
// then do some processing with it, and when done you can remove the
// queue module entirely
this.$store.dispatch("queue/unregister", { name: "tmp" });
```

Enqueuing something will return a Promise that gets resolved when that item
is dequeued, this could be used to implement a throttled api request queue:

```js
async someAction({ commit, dispatch }, { params }) {
  const request = () => fetch("/some/api", { params });
  await dispatch("queue/requests/enqueue", { request }, { root: true });
  
  // the request has been dequeued so now it can be actually called
  const data = await request();
  commit("persist", { data });
  
  return data;
};
```

You can also subscribe to a queue to get notified when something has
been enqueued and/or dequeued.

```js
this.$store.dispatch("queue/foo/subscribe", {
  mutation: "enqueue",
  handler: (val) => console.log(`${val} enqueued`),
});

this.$store.dispatch("queue/foo/enqueue", "foo");
// console: "foo enqueued"

// or you can subscribe to dequeues
this.$store.dispatch("queue/foo/subscribe", {
  mutation: "dequeue",
  handler: (val) => console.log(`${val} dequeued`),
});

this.$store.dispatch("queue/foo/dequeue");
// console: "foo dequeued"
```

And the Vue plugin can be added as well which will add the `$queue`
property on components (this is just a proxy to the queue namespace on `$store`):

```js
Vue.use(Queuex);

// then in a component
// get the global queue and enqueue/dequeu items
this.$queue; // []
this.$queue.enqueue({ foo: "bar" });
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

// enqueueing an item either from the $queue property or
// through calling the action directly will return a promise that
// will get resolved once it gets dequeued (with the item as the value it resovles with)
Array(3).keys.forEach(i =>
  this.$queue.enqueue(i).then(val => console.log(`dequeued ${val}`)),
);

this.$queue.bar.dequeue(); // 0
this.$queue.bar.dequeue(); // 1
this.$queue.bar.dequeue(); // 2
// and now console will have output:
// dequeued 0
// dequeued 1
// dequeued 2
```
