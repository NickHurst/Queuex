# Queuex

A Vuex plugin for creating store modules that function as queues. Currently
supports one global (or root) queue (can be disabled), the ability to
create named queues (seperate namespaced modules), as well as priority queues
with configurable priorities.

## Warning

**If you came across this and for some reason want to start using it -- don't.
It technically "works" in the current state, but this is mostly just a PoC and
is but still early in (a slow but sure) development and these docs aren't likely
100% accurate.**

### Getting Started

```js
// store.js
import Vue from "vue";
import Vuex from "vuex";
import Queuex from "queuex";

Vue.use(Vuex);

const queue = new Queuex.Store({
  queues: [
    { name: "foo" },
    {
      name: "bar",
      prioritized: true,
    },
    {
      name: "baz",
      prioritized: true,
      priorities: ["a", "b", "c"],
      default: "c",
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
    baz: {
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

### Adding/Removing Queues

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

### Using the Queues

Every queue module has the `enqueue` and `dequeue` actions, and the
do exactly what you'd expect.

```js
// whatever you want to be enqueued must be set to the item
// property of the payload
this.$store.dispatch("queue/enqueue", { item: { foo: true } });
this.$store.dispatch("queue/dequeue"); // { foo: true }

// if the queue is a priority queue you can pass a priority
// otherwise whatever is set as the default will be used
this.$store.dispatch("queue/bar/enqueue", { item: { foo: true }, priority: "high" });

// you can also use the mapActions helpers too
{ ...mapActions("queue/foo", { enqueueFoo: "enqueue" }) }
```

Enqueuing something will return a Promise that gets resolved when that item
is dequeued, this could be used for simple UI notifications, or even to
possibly implement a throttled request queue:

```js
{
  actions: {
    async someAction({ commit, dispatch }, { params }) {
      const request = () => fetch("/some/api", { params });
      await dispatch("queue/requests/enqueue", { item: request, priority: "low" }, { root: true });

      // the request has been dequeued so now it can be actually called
      const data = await request();
      commit("persist", { data });

      return data;
    },
  },
},

// somewhere else
const requestQueueThrottle = (store, throttle = 300) =>
  new Promise(resolve => setTimeout(resolve, throttle))
        .then(() => store.dispatch("queue/requests/dequeue"))
        .then(() => requestQueueThrottle(store, throttle));
```

### Subscribing to Queue Events

You can also subscribe to a queue to get notified when something has
been enqueued and/or dequeued.

```js
this.$store.dispatch("queue/foo/subscribe", {
  mutation: "enqueue",
  handler: payload => console.log(`${payload} enqueued`),
});

this.$store.dispatch("queue/foo/enqueue", { item: "foo" });
// console: "{ item: 'foo' } enqueued"

// or you can subscribe to dequeues
this.$store.dispatch("queue/foo/subscribe", {
  mutation: "dequeue",
  handler: payload => console.log(`${payload} dequeued`),
});

this.$store.dispatch("queue/foo/dequeue");
// console: "{ item: 'foo' } dequeued"
```

### Component Plugin (optional)

The component plugin can be added as well which will add the `$queue`
property. This is just a proxy to the queue namespace on `$store.state`
with `enqueue` & `dequeue` methods added that are just aliases of the
actions:

```js
Vue.use(Queuex);

// then in some component
export default {
  // omitted...
  created() {
    // get the global queue and enqueue/dequeu items
    this.$queue; // []
    // same as store.dispatch("queue/enqueue", { item: { foo: "bar" } })
    this.$queue.enqueue({ item: "foo" }); // Promise
    this.$queue; // ["foo"]
    this.$queue.dequeue(); // "foo"
    this.$queue; // []

    // named queue
    this.$queue.foo; // []
    this.$queue.foo.enqueue({ item: "foo" }); // Promise
    this.$queue.foo; // ["foo"]
    this.$queue.foo.dequeue() // "foo"
    this.$queue.foo; // []

    // priority queue
    this.$queue.bar; // []
    this.$queue.bar.enqueue({ item: "default" }); // Promise
    this.$queue.bar; // ["default"]
    this.$queue.bar.enqueue({ item: "high", priority: "high" }); // Promise
    this.$queue.bar; // ["high", "default"]
    this.$queue.bar.enqueue({ item: "low", priority: "low" }); // Promise
    this.$queue.bar; // ["high", "default", "low"]
    this.$queue.bar.dequeue(); // "high"
    this.$queue.bar; // ["default", "low"]
    this.$queue.bar.dequeue(); // "default"
    this.$queue.bar; // ["low"]
    this.$queue.bar.dequeue(); // "low"
    this.$queue.bar; // []
  },
};
```
