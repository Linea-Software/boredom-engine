Title: Reactive Controllers – Lit

URL Source: https://lit.dev/docs/composition/controllers/

Markdown Content:
Contents
--------

1.   [Using a controller](https://lit.dev/docs/composition/controllers/#using-a-controller)
2.   [Writing a controller](https://lit.dev/docs/composition/controllers/#writing-a-controller)
    1.   [Controller initialization](https://lit.dev/docs/composition/controllers/#controller-initialization)
    2.   [Lifecycle](https://lit.dev/docs/composition/controllers/#lifecycle)
    3.   [Controller host API](https://lit.dev/docs/composition/controllers/#controller-host-api)
    4.   [Building controllers from other controllers](https://lit.dev/docs/composition/controllers/#building-controllers-from-other-controllers)
    5.   [Controllers and directives](https://lit.dev/docs/composition/controllers/#controllers-and-directives)

3.   [Use cases](https://lit.dev/docs/composition/controllers/#use-cases)
    1.   [External inputs](https://lit.dev/docs/composition/controllers/#external-inputs)
    2.   [Asynchronous tasks](https://lit.dev/docs/composition/controllers/#asynchronous-tasks)

4.   [See also](https://lit.dev/docs/composition/controllers/#see-also)

A reactive controller is an object that can hook into a component's [reactive update cycle](https://lit.dev/docs/components/lifecycle/#reactive-update-cycle). Controllers can bundle state and behavior related to a feature, making it reusable across multiple component definitions.

You can use controllers to implement features that require their own state and access to the component's lifecycle, such as:

*   Handling global events like mouse events
*   Managing asynchronous tasks like fetching data over the network
*   Running animations

Reactive controllers allow you to build components by composing smaller pieces that aren't themselves components. They can be thought of as reusable, partial component definitions, with their own identity and state.

Reactive controllers are similar in many ways to class mixins. The main difference is that they have their own identity and don't add to the component's prototype, which helps contain their APIs and lets you use multiple controller instances per host component. See [Controllers and mixins](https://lit.dev/docs/composition/overview/#controllers-and-mixins) for more details.

Using a controller
------------------

[Permalink to “Using a controller”](https://lit.dev/docs/composition/controllers/#using-a-controller)

Each controller has its own creation API, but typically you will create an instance and store it with the component:

`class MyElement extends LitElement {private clock = new ClockController(this, 1000);}`
The component associated with a controller instance is called the host component.

The controller instance registers itself to receive lifecycle callbacks from the host component, and triggers a host update when the controller has new data to render. This is how the `ClockController` example periodically renders the current time.

A controller will typically expose some functionality to be used in the host's `render()` method. For example, many controllers will have some state, like a current value:

`render() {return html`<div>Current time: ${this.clock.value}</div>    `;}`
Since each controller has it's own API, refer to specific controller documentation on how to use them.

Writing a controller
--------------------

[Permalink to “Writing a controller”](https://lit.dev/docs/composition/controllers/#writing-a-controller)

A reactive controller is an object associated with a host component, which implements one or more host lifecycle callbacks or interacts with its host. It can be implemented in a number of ways, but we'll focus on using JavaScript classes, with constructors for initialization and methods for lifecycles.

### Controller initialization

[Permalink to “Controller initialization”](https://lit.dev/docs/composition/controllers/#controller-initialization)

A controller registers itself with its host component by calling `host.addController(this)`. Usually a controller stores a reference to its host component so that it can interact with it later.

`class ClockController implements ReactiveController {private host: ReactiveControllerHost;constructor(host: ReactiveControllerHost) {// Store a reference to the hostthis.host = host;// Register for lifecycle updateshost.addController(this);}}``class ClockController {constructor(host) {// Store a reference to the hostthis.host = host;// Register for lifecycle updateshost.addController(this);}}`
You can add other constructor parameters for one-time configuration.

`class ClockController implements ReactiveController {private host: ReactiveControllerHost;timeout: numberconstructor(host: ReactiveControllerHost, timeout: number) {this.host = host;this.timeout = timeout;host.addController(this);}``class ClockController {constructor(host, timeout) {this.host = host;this.timeout = timeout;host.addController(this);}`
Once your controller is registered with the host component, you can add lifecycle callbacks and other class fields and methods to the controller to implement the desired state and behavior.

The reactive controller lifecycle, defined in the `ReactiveController` interface, is a subset of the reactive update cycle. LitElement calls into any installed controllers during its lifecycle callbacks. These callbacks are optional.

*   `hostConnected()`:
    *   Called when the host is connected.
    *   Called after creating the `renderRoot`, so a shadow root will exist at this point.
    *   Useful for setting up event listeners, observers, etc.

*   `hostUpdate()`:
    *   Called before the host's `update()` and `render()` methods.
    *   Useful for reading DOM before it's updated (for example, for animations).

*   `hostUpdated()`:
    *   Called after updates, before the host's `updated()` method.
    *   Useful for reading DOM after it's modified (for example, for animations).

*   `hostDisconnected()`:
    *   Called when the host is disconnected.
    *   Useful for cleaning up things added in `hostConnected()`, such as event listeners and observers.

For more information, see [Reactive update cycle](https://lit.dev/docs/components/lifecycle/#reactive-update-cycle).

### Controller host API

[Permalink to “Controller host API”](https://lit.dev/docs/composition/controllers/#controller-host-api)

A reactive controller host implements a small API for adding controllers and requesting updates, and is responsible for calling its controller's lifecycle methods.

This is the minimum API exposed on a controller host:

*   `addController(controller: ReactiveController)`
*   `removeController(controller: ReactiveController)`
*   `requestUpdate()`
*   `updateComplete: Promise<boolean>`

You can also create controllers that are specific to `HTMLElement`, `ReactiveElement`, `LitElement` and require more of those APIs; or even controllers that are tied to a specific element class or other interface.

`LitElement` and `ReactiveElement` are controller hosts, but hosts can also be other objects like base classes from other web components libraries, components from frameworks, or other controllers.

### Building controllers from other controllers

[Permalink to “Building controllers from other controllers”](https://lit.dev/docs/composition/controllers/#building-controllers-from-other-controllers)

Controllers can be composed of other controllers as well. To do this create a child controller and forward the host to it.

`class DualClockController implements ReactiveController {private clock1: ClockController;private clock2: ClockController;constructor(host: ReactiveControllerHost, delay1: number, delay2: number) {this.clock1 = new ClockController(host, delay1);this.clock2 = new ClockController(host, delay2);}get time1() { return this.clock1.value; }get time2() { return this.clock2.value; }}``class DualClockController {constructor(host, delay1, delay2) {this.clock1 = new ClockController(host, delay1);this.clock2 = new ClockController(host, delay2);}get time1() { return this.clock1.value; }get time2() { return this.clock2.value; }}`

### Controllers and directives

[Permalink to “Controllers and directives”](https://lit.dev/docs/composition/controllers/#controllers-and-directives)

Combining controllers with directives can be a very powerful technique, especially for directives that need to do work before or after rendering, like animation directives; or controllers that need references to specific elements in a template.

There are two main patterns of using controllers with directives:

*   Controller directives. These are directives that themselves are controllers in order to hook into the host lifecycle.
*   Controllers that own directives. These are controllers that create one or more directives for use in the host's template.

For more information about writing directives, see [Custom directives](https://lit.dev/docs/templates/custom-directives/).

#### Controller directives

[Permalink to “Controller directives”](https://lit.dev/docs/composition/controllers/#controller-directives)

Reactive controllers do not need to be stored as instance fields on the host. Anything added to a host using `addController()` is a controller. In particular, a directive can also be a controller. This enables a directive to hook into the host lifecycle.

#### Controllers that own directives

[Permalink to “Controllers that own directives”](https://lit.dev/docs/composition/controllers/#controllers-that-own-directives)

Directives do not need to be standalone functions, they can be methods on other objects as well, such as controllers. This can be useful in cases where a controller needs a specific reference to an element in a template.

For example, imagine a ResizeController that lets you observe an element's size with a ResizeObserver. To work we need both a ResizeController instance, and a directive that is placed on the element we want to observe:

`class MyElement extends LitElement {private _textSize = new ResizeController(this);render() {return html`<textarea ${this._textSize.observe()}></textarea><p>The width is ${this._textSize.contentRect?.width}</p>    `;}}``class MyElement extends LitElement {_textSize = new ResizeController(this);render() {return html`<textarea ${this._textSize.observe()}></textarea><p>The width is ${this._textSize.contentRect?.width}</p>    `;}}`
To implement this, you create a directive and call it from a method:

`class ResizeDirective {/* ... */}const resizeDirective = directive(ResizeDirective);export class ResizeController {/* ... */observe() {// Pass a reference to the controller so the directive can// notify the controller on size changes.return resizeDirective(this);}}`

### TO DO

*   Review and cleanup this example

Reactive controllers are very general and have a very broad set of possible use cases. They are particularly good for connecting a component to an external resource, like user input, state management, or remote APIs. Here are a few common use cases.

### External inputs

[Permalink to “External inputs”](https://lit.dev/docs/composition/controllers/#external-inputs)

Reactive controllers can be used to connect to external inputs. For example, keyboard and mouse events, resize observers, or mutation observers. The controller can provide the current value of the input to use in rendering, and request a host update when the value changes.

#### Example: MouseMoveController

[Permalink to “Example: MouseMoveController”](https://lit.dev/docs/composition/controllers/#example:-mousemovecontroller)

This example shows how a controller can perform setup and cleanup work when its host is connected and disconnected, and request an update when an input changes:

### Asynchronous tasks

[Permalink to “Asynchronous tasks”](https://lit.dev/docs/composition/controllers/#asynchronous-tasks)

Asynchronous tasks, such as long running computations or network I/O, typically have state that changes over time, and will need to notify the host when the task state changes (completes, errors, etc.).

Controllers are a great way to bundle task execution and state to make it easy to use inside a component. A task written as a controller usually has inputs that a host can set, and outputs that a host can render.

`@lit/task` contains a generic `Task` controller that can pull inputs from the host, execute a task function, and render different templates depending on the task state.

You can use `Task` to create a custom controller with an API tailored for your specific task. Here we wrap `Task` in a `NamesController` that can fetch one of a specified list of names from a demo REST API. `NameController` exposes a `kind` property as an input, and a `render()` method that can render one of four templates depending on the task state. The task logic, and how it updates the host, are abstracted from the host component.

### TO DO

*   Animations

*   [Reactive update cycle](https://lit.dev/docs/components/lifecycle/#reactive-update-cycle)
*   [@lit/task](https://www.npmjs.com/package/@lit/task)

[Edit this page](https://github.com/lit/lit.dev/edit/main/packages/lit-dev-content/site/docs/v3/composition/controllers.md)
