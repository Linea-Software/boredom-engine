Title: Async Tasks – Lit

URL Source: https://lit.dev/docs/data/task/

Markdown Content:
Contents
--------

1.   [Overview](https://lit.dev/docs/data/task/#overview)
    1.   [Example](https://lit.dev/docs/data/task/#example)
    2.   [Features](https://lit.dev/docs/data/task/#features)

2.   [What is async data?](https://lit.dev/docs/data/task/#what-is-async-data)
3.   [What is a task?](https://lit.dev/docs/data/task/#what-is-a-task)
4.   [Installation](https://lit.dev/docs/data/task/#installation)
5.   [Usage](https://lit.dev/docs/data/task/#usage)
    1.   [The task function](https://lit.dev/docs/data/task/#the-task-function)
    2.   [Task status](https://lit.dev/docs/data/task/#task-status)
    3.   [Rendering Tasks](https://lit.dev/docs/data/task/#rendering-tasks)
    4.   [Running tasks](https://lit.dev/docs/data/task/#running-tasks)
    5.   [Aborting tasks](https://lit.dev/docs/data/task/#aborting-tasks)
    6.   [Task chaining](https://lit.dev/docs/data/task/#task-chaining)
    7.   [More accurate argument types in TypeScript](https://lit.dev/docs/data/task/#more-accurate-argument-types-in-typescript)

Sometimes a component needs to render data that is only available _asynchronously_. Such data might be fetched from a server, a database, or in general retrieved or computed from an async API.

While Lit's reactive update lifecycle is batched and asynchronous, Lit templates always render _synchronously_. The data used in a template must be readable at the time of rendering. To render async data in a Lit component, you must wait for the data to be ready, store it so that it's readable, then trigger a new render which can use the data synchronously. Considerations must often be made on what to render while the data is being fetched, or when the data fetch fails as well.

The `@lit/task` package provides a `Task` reactive controller to help manage this async data workflow.

`Task` is a controller that takes an async task function and runs it either manually or automatically when its arguments change. Task stores the result of the task function and updates the host element when the task function completes so the result can be used in rendering.

This is an example of using `Task` to call an HTTP API via [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). The API is called whenever the `productId` parameter changes, and the component renders a loading message when the data is being fetched.

`import {Task} from '@lit/task';class MyElement extends LitElement {@property() productId?: string;private _productTask = new Task(this, {task: async ([productId], {signal}) => {const response = await fetch(`http://example.com/product/${productId}`, {signal});if (!response.ok) { throw new Error(response.status); }return response.json() as Product;},args: () => [this.productId]});render() {return this._productTask.render({pending: () => html`<p>Loading product...</p>`,complete: (product) => html`<h1>${product.name}</h1><p>${product.price}</p>        `,error: (e) => html`<p>Error: ${e}</p>`});}}``import {Task} from '@lit/task';class MyElement extends LitElement {static properties = {productId: {},};_productTask = new Task(this, {task: async ([productId], {signal}) => {const response = await fetch(`http://example.com/product/${productId}`, {signal});if (!response.ok) { throw new Error(response.status); }return response.json();},args: () => [this.productId]});render() {return this._productTask.render({pending: () => html`<p>Loading product...</p>`,complete: (product) => html`<h1>${product.name}</h1><p>${product.price}</p>        `,error: (e) => html`<p>Error: ${e}</p>`});}}`
Task takes care of a number of things needed to properly manage async work:

*   Gathers task arguments when the host updates
*   Runs task functions when arguments change
*   Tracks the task status (initial, pending, complete, or error)
*   Saves the last completion value or error of the task function
*   Triggers a host update when the task changes status
*   Handles race conditions, ensuring that only the latest task invocation completes the task
*   Renders the correct template for the current task status
*   Allows aborting tasks with an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

This removes most of the boilerplate for correctly using async data from your code, and ensures robust handling of race conditions and other edge-cases.

What is async data?
-------------------

[Permalink to “What is async data?”](https://lit.dev/docs/data/task/#what-is-async-data)

Async data is data that's not available immediately, but may be available at some time in the future. For example, instead of a value like a string or an object that's usable synchronously, a promise provides a value in the future.

Async data is usually returned from an async API, which can come in a few forms:

*   Promises or async functions, like `fetch()`
*   Functions that accept callbacks
*   Objects that emit events, such as DOM events
*   Libraries like observables and signals

The Task controller deals in promises, so no matter the shape of your async API you can adapt it to promises to use with Task.

What is a task?
---------------

[Permalink to “What is a task?”](https://lit.dev/docs/data/task/#what-is-a-task)

At the core of the Task controller is the concept of a "task" itself.

A task is an async operation which does some work to produce data and return it in a Promise. A task can be in a few different states (initial, pending, complete, and error) and can take parameters.

A task is a generic concept and could represent any async operation. They apply best when there is a request/response structure, such as a network fetch, database query, or waiting for a single event in response to some action. They're less applicable to spontaneous or streaming operations like an open-ended stream of events, a streaming database response, etc.

`npm install @lit/task`
`Task` is a [reactive controller](https://lit.dev/docs/composition/controllers/), so it can respond to and trigger updates to Lit's reactive update lifecycle.

You'll generally have one Task object for each logical task that your component needs to perform. Install tasks as fields on your class:

`class MyElement extends LitElement {private _myTask = new Task(this, {/*...*/});}``class MyElement extends LitElement {_myTask = new Task(this, {/*...*/});}`
As a class field, the task status and value are easily available:

`this._task.status;this._task.value;`

### The task function

[Permalink to “The task function”](https://lit.dev/docs/data/task/#the-task-function)

The most critical part of a task declaration is the _task function_. This is the function that does the actual work.

The task function is given in the `task` option. The Task controller will automatically call the task function with arguments, which are supplied with a separate `args` callback. Arguments are checked for changes and the task function is only called if the arguments have changed.

The task function takes the task arguments as an _array_ passed as the first parameter, and an options argument as the second parameter:

`new Task(this, {task: async ([arg1, arg2], {signal}) => {// do async work here},args: () => [this.field1, this.field2]})`
The task function's args array and the args callback should be the same length.

Write the `task` and `args` functions as arrow functions so that the `this` reference points to the host element.

Tasks can be in one of four states:

*   `INITIAL`: The task has not been run
*   `PENDING`: The task is running and awaiting a new value
*   `COMPLETE`: The task completed successfully
*   `ERROR`: The task errored

The Task status is available at the `status` field of the Task controller, and is represented by the `TaskStatus` enum-like object, which has properties `INITIAL`, `PENDING`, `COMPLETE`, and `ERROR`.

`import {TaskStatus} from '@lit/task';// ...if (this.task.status === TaskStatus.ERROR) {// ...}`
Usually a Task will proceed from `INITIAL` to `PENDING` to one of `COMPLETE` or `ERROR`, and then back to `PENDING` if the task is re-run. When a task changes status it triggers a host update so the host element can handle the new task status and render if needed.

It's important to understand the status a task can be in, but it's not usually necessary to access it directly.

There are a few members on the Task controller that relate to the state of the task:

*   `status`: the status of the task.
*   `value`: the current value of the task, if it has completed.
*   `error`: the current error of the task, if it has errored.
*   `render()`: a method that chooses a callback to run based on the current status.

### Rendering Tasks

[Permalink to “Rendering Tasks”](https://lit.dev/docs/data/task/#rendering-tasks)

The simplest and most common API to use to render a task is `task.render()`, since it chooses the right code to run and provides it the relevant data.

`render()` takes a config object with an optional callback for each task status:

*   `initial()`
*   `pending()`
*   `complete(value)`
*   `error(err)`

You can use `task.render()` inside a Lit `render()` method to render templates based on the task status:

`render() {return html`${this._myTask.render({initial: () => html`<p>Waiting to start task</p>`,pending: () => html`<p>Running task...</p>`,complete: (value) => html`<p>The task completed with: ${value}</p>`,error: (error) => html`<p>Oops, something went wrong: ${error}</p>`,})}    `;}`
By default, Tasks will run any time the arguments change. This is controlled by the `autoRun` option, which defaults to `true`.

In _auto-run_ mode, the task will call the `args` function when the host has updated, compare the args to the previous args, and invoke the task function if they have changed. A task with an empty `args` array runs once. A task without `args` defined is in manual mode.

If `autoRun` is set to false, the task will be in _manual_ mode. In manual mode you can run the task by calling the `.run()` method, possibly from an event handler:

`class MyElement extends LitElement {private _getDataTask = new Task(this,{task: async () => {const response = await fetch(`example.com/data/`);return response.json();},args: () => []});render() {return html`<button @click=${this._onClick}>Get Data</button>    `;}private _onClick() {this._getDataTask.run();}}``class MyElement extends LitElement {_getDataTask = new Task(this,{task: async () => {const response = await fetch(`example.com/data/`);return response.json();},args: () => []});render() {return html`<button @click=${this._onClick}>Get Data</button>    `;}_onClick() {this._getDataTask.run();}}`
In manual mode you can provide new arguments directly to `run()`:

`this._task.run(['arg1', 'arg2']);`
If arguments are not provided to `run()`, they are gathered from the `args` callback.

A task function can be called while previous task runs are still pending. In these cases the result of the pending task runs will be ignored, and you should try to cancel any outstanding work or network I/O in order to save resources.

You can do with with the [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that is passed in the `signal` property of the second argument to the task function. When a pending task run is superseded by a new run, the `AbortSignal` that was passed to the pending run is aborted to signal the task run to cancel any pending work.

`AbortSignal` doesn't cancel any work automatically - it is just a signal. To cancel some work you must either do it yourself by checking the signal, or forward the signal to another API that accepts `AbortSignal`s like [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) or [`addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener).

The easiest way to use the `AbortSignal` is to forward it to an API that accepts it, like `fetch()`.

`private _task = new Task(this, {task: async (args, {signal}) => {const response = await fetch(someUrl, {signal});// ...},});``_task = new Task(this, {task: async (args, {signal}) => {const response = await fetch(someUrl, {signal});// ...},});`
Forwarding the signal to `fetch()` will cause the browser to cancel the network request if the signal is aborted.

You can also check if a signal has been aborted in your task function. You should check the signal after returning to a task function from an async call. `throwIfAborted()` is a convenient way to do this:

`private _task = new Task(this, {task: async ([arg1], {signal}) => {const firstResult = await doSomeWork(arg1);signal.throwIfAborted();const secondResult = await doMoreWork(firstResult);signal.throwIfAborted();return secondResult;},});``_task = new Task(this, {task: async ([arg1], {signal}) => {const firstResult = await doSomeWork(arg1);signal.throwIfAborted();const secondResult = await doMoreWork(firstResult);signal.throwIfAborted();return secondResult;},});`
Sometimes you want to run one task when another task completes. This can be useful if the tasks have different arguments so that the chained task may run without the first task running again. In this case it'll use the first task like a cache. To do this you can use the value of a task as an argument to another task:

`class MyElement extends LitElement {private _getDataTask = new Task(this, {task: ([dataId]) => getData(dataId),args: () => [this.dataId],});private _processDataTask = new Task(this, {task: ([data, param]) => processData(data, param),args: () => [this._getDataTask.value, this.param],});}``class MyElement extends LitElement {_getDataTask = new Task(this, {task: ([dataId]) => getData(dataId),args: () => [this.dataId],});_processDataTask = new Task(this, {task: ([data, param]) => processData(data, param),args: () => [this._getDataTask.value, this.param],});}`
You can also often use one task function and await intermediate results:

`class MyElement extends LitElement {private _getDataTask = new Task(this, {task: ([dataId, param]) => {const data = await getData(dataId);return processData(data, param);},args: () => [this.dataId, this.param],});}``class MyElement extends LitElement {_getDataTask = new Task(this, {task: ([dataId, param]) => {const data = await getData(dataId);return processData(data, param);},args: () => [this.dataId, this.param],});}`

### More accurate argument types in TypeScript

[Permalink to “More accurate argument types in TypeScript”](https://lit.dev/docs/data/task/#more-accurate-argument-types-in-typescript)

Task argument types can sometimes be inferred too loosely by TypeScript. This can be fixed by casting argument arrays with `as const`. Consider the following task, with two arguments.

`class MyElement extends LitElement {@property() myNumber = 10;@property() myText = "Hello world";_myTask = new Task(this, {args: () => [this.myNumber, this.myText],task: ([number, text]) => {// implementation omitted}});}`
As written, the type of the argument list to the task function is inferred as `Array<number | string>`.

But ideally this would be typed as a tuple `[number, string]` because the size and position of the args is fixed.

The return value of `args` can be written as `args: () => [this.myNumber, this.myText] as const`, which will result in a tuple type for the args list to the `task` function.

`class MyElement extends LitElement {@property() myNumber = 10;@property() myText = "Hello world";_myTask = new Task(this, {args: () => [this.myNumber, this.myText] as const,task: ([number, text]) => {// implementation omitted}});}`
[Edit this page](https://github.com/lit/lit.dev/edit/main/packages/lit-dev-content/site/docs/v3/data/task.md)
