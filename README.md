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
Vue.use(Queuex); // optional -- see below

const queuex = Queuex.Store({
  // set queues to create when the store starts
  // this is optional and can be left out
  // queues can be added/removed at any time -- see below
  queues: [
    // plain queue (or { name: "foo" })
    "foo",
    // priority queue
    { name: "bar", prioritized: true },
    // priority queue with custom priorities
    {
      name: "baz",
      prioritized: {
        queues: ["a", "b", "c"],
        defaultQueue: "c",
      },
    },
  ],
  // default -- creates a queue at the top of the plugin namespace
  rootQueue: true,
  // default -- keeps the root queue but puts it in the "root" namespace
  namespaceRootQueue: false,
});

export default new Vuex.Store({
  plugins: [queuex],
});
```

The stores state tree would then look like this:

```js
{
  qx: {
    queues: {
      foo: "qx/foo",
      bar: "qx/bar",
      baz: "qx/baz",
    },
    root: {
      queue: [],
    },
    foo: {
      queue: [],
    },
    bar: {
      queues: ["high", "default", "low"],
      defaultQueue: "default",
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
// this will add the plugin without any queues to start
export default new Vuex.Store({
  plugins: [Queuex.Store({ rootQueue: false })],
});

// then is some part of the app where you'll need a queue
this.$store.dispatch("qx/register", { name: "tmp", prioritized: true });
// then do some processing with it, and when done you can remove the
// queue module entirely
this.$store.dispatch("qx/unregister", { name: "tmp" });
```

### Using the Queues

Every queue module has the `enqueue` and `dequeue` actions, and the
do exactly what you'd expect.

```js
// whatever you want to be enqueued must be set to the item
// property of the payload
this.$store.dispatch("qx/enqueue", { item: { foo: true } });
this.$store.dispatch("qx/dequeue"); // { foo: true }

// if the queue is a priority queue you can pass a priority
// otherwise whatever is set as the default will be used
this.$store.dispatch("qx/bar/enqueue", { item: { foo: true }, priority: "high" });

// you can also use the mapActions helpers too
{ ...mapActions("qx/foo", { enqueueFoo: "enqueue" }) }
```

Enqueuing something will return a Promise that gets resolved when that item
is dequeued, this could be used for simple UI notifications, or even to
possibly implement a throttled request queue:

```js
{
  actions: {
    async someAction({ commit, dispatch }, { params }) {
      const request = () => fetch("/some/api", { params });
      await dispatch("qx/requests/enqueue", { item: request, priority: "low" }, { root: true });

      // the request has been dequeued so now it can be actually called
      const data = await request();
      commit("persist", { data });

      return data;
    },
  },
},

// ...and meanwhile somewhere else -- don't do this btw
const requestQueueThrottle = (store, throttle = 300) =>
  new Promise(resolve => setTimeout(resolve, throttle))
        .then(() => store.dispatch("qx/requests/dequeue"))
        .then(() => requestQueueThrottle(store, throttle));
```

### Subscribing to Queue Events

You can also subscribe to a queue to get notified when something has
been enqueued and/or dequeued.

```js
this.$store.dispatch("qx/foo/subscribe", {
  enqueue: payload => console.log(`${payload} enqueued`),
  dequeue: payload => console.log(`${payload} dequeued`),
});

this.$store.dispatch("qx/foo/enqueue", { item: "foo" });
// console: "{ item: 'foo' } enqueued"

this.$store.dispatch("qx/foo/dequeue");
// console: "{ item: 'foo' } dequeued"
```

### Component Plugin (optional)

The component plugin can be added `Vue.use(Queuex)` which will add the
`$qx` property to components. This just provides an alternative api to
interact with the queue modules rather than manipulating the queues through
actions/mutations which can get verbose, so`$qx` provides a less verbose
wrapper.

```js
// the root queue
this.$qx; // []
this.$qx.enqueue("foo");
this.$qx; // ["foo"]
this.$qx.dequeue();
this.$qx; // []

// view the next item without dequeuing it
this.$qx.peek

// subscribing to a queue
this.$qx.on("enqueue", payload => payload);
this.$qx.on("dequeue", payload => payload);

// creating a queue
this.$qx.add("tmp");
// and removing it
this.$qx.remove("tmp");

// to access other queues just access them
// by their name ($qx.queueName) all the above
// methods available on them except for add/remove

// named queue
this.$qx.foo; // []
this.$qx.foo.enqueue("foo");
this.$qx.foo; // ["foo"]
this.$qx.foo.dequeue();
this.$qx.foo; // []

// priority queue
this.$qx.bar; // []
this.$qx.bar.enqueue("default");
this.$qx.bar; // ["default"]
this.$qx.bar.high.enqueue("high");
this.$qx.bar; // ["high", "default"]
this.$qx.bar.low.enqueue("low");
this.$qx.bar; // ["high", "default", "low"]
this.$qx.bar.dequeue();
this.$qx.bar; // ["default", "low"]
this.$qx.bar.dequeue();
this.$qx.bar; // ["low"]
this.$qx.bar.dequeue();
this.$qx.bar; // []
```
