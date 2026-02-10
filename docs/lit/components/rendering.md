Title: Rendering – Lit

URL Source: https://lit.dev/docs/components/rendering/

Markdown Content:
Contents
--------

1.   [Renderable values](https://lit.dev/docs/components/rendering/#renderable-values)
2.   [Writing a good render() method](https://lit.dev/docs/components/rendering/#writing-a-good-render()-method)
3.   [Composing templates](https://lit.dev/docs/components/rendering/#composing-templates)
4.   [When templates render](https://lit.dev/docs/components/rendering/#when-templates-render)
5.   [DOM encapsulation](https://lit.dev/docs/components/rendering/#dom-encapsulation)
6.   [See also](https://lit.dev/docs/components/rendering/#see-also)

Add a template to your component to define what it should render. Templates can include _expressions_, which are placeholders for dynamic content.

To define a template for a Lit component, add a `render()` method:

Write your template in HTML inside a JavaScript [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) using Lit's [`html`](https://lit.dev/docs/api/templates/#html) tag function.

Lit templates can include JavaScript _expressions_. You can use expressions to set text content, attributes, properties, and event listeners. The `render()` method can also include any JavaScript—for example, you can create local variables for use in expressions.

Renderable values
-----------------

[Permalink to “Renderable values”](https://lit.dev/docs/components/rendering/#renderable-values)

Typically, the component's `render()` method returns a single `TemplateResult` object (the same type returned by the `html` tag function). However, it can return anything that Lit can render as the child of an HTML element:

*   Primitive values like string, number, or boolean.
*   `TemplateResult` objects created by the `html` function.
*   DOM Nodes.
*   The sentinel values [`nothing`](https://lit.dev/docs/templates/conditionals/#conditionally-rendering-nothing) and [`noChange`](https://lit.dev/docs/templates/custom-directives/#signaling-no-change).
*   Arrays or iterables of any of the supported types.

This is _almost identical_ to the set of values that can be rendered to a Lit [child expression](https://lit.dev/docs/templates/expressions/#child-expressions). The one difference is that a child expression can render an `SVGTemplateResult`, returned by the [`svg`](https://lit.dev/docs/api/templates/#svg) function. This kind of template result can only be rendered as the descendant of an `<svg>` element.

Writing a good render() method
------------------------------

[Permalink to “Writing a good render() method”](https://lit.dev/docs/components/rendering/#writing-a-good-render()-method)

To take best advantage of Lit's functional rendering model, your `render()` method should follow these guidelines:

*   Avoid changing the component's state.
*   Avoid producing any side effects.
*   Use only the component's properties as input.
*   Return the same result when given the same property values.

Following these guidelines keeps the template deterministic, and makes it easier to reason about the code.

In most cases you should avoid making DOM updates outside of `render()`. Instead, express the component's template as a function of its state, and capture its state in properties.

For example, if your component needs to update its UI when it receives an event, have the event listener set a reactive property that is used in `render()`, rather than manipulate the DOM directly.

For more information, see [Reactive properties](https://lit.dev/docs/components/properties/).

Composing templates
-------------------

[Permalink to “Composing templates”](https://lit.dev/docs/components/rendering/#composing-templates)

You can compose Lit templates from other templates. The following example composes a template for a component called `<my-page>` from smaller templates for the page's header, footer, and main content:

In this example, the individual templates are defined as instance methods, so a subclass could extend this component and override one or more templates.

### TO DO

Move example to composition section, add xref.

You can also compose templates by importing other elements and using them in your template:

When templates render
---------------------

[Permalink to “When templates render”](https://lit.dev/docs/components/rendering/#when-templates-render)

A Lit component renders its template initially when it's added to the DOM on a page. After the initial render, any change to the component's reactive properties triggers an update cycle, re-rendering the component.

Lit batches updates to maximize performance and efficiency. Setting multiple properties at once triggers only one update, performed asynchronously at microtask timing.

During an update, only the parts of the DOM that change are re-rendered. Although Lit templates look like string interpolation, Lit parses and creates static HTML once, and then only updates changed values in expressions after that, making updates very efficient.

For more information about the update cycle, see [What happens when properties change](https://lit.dev/docs/components/properties/#when-properties-change).

DOM encapsulation
-----------------

[Permalink to “DOM encapsulation”](https://lit.dev/docs/components/rendering/#dom-encapsulation)

Lit uses shadow DOM to encapsulate the DOM a component renders. Shadow DOM lets an element create its own, isolated DOM tree that's separate from the main document tree. It's a core feature of the web components specifications that enables interoperability, style encapsulation, and other benefits.

For more information about shadow DOM, see [Shadow DOM v1: Self-Contained Web Components](https://developers.google.com/web/fundamentals/web-components/shadowdom)on Web Fundamentals.

For more information about working with shadow DOM in your component, see [Working with shadow DOM](https://lit.dev/docs/components/shadow-dom/).

*   [Shadow DOM](https://lit.dev/docs/components/shadow-dom/)
*   [Templates overview](https://lit.dev/docs/templates/overview/)
*   [Template expressions](https://lit.dev/docs/templates/expressions/)

[Edit this page](https://github.com/lit/lit.dev/edit/main/packages/lit-dev-content/site/docs/v3/components/rendering.md)
