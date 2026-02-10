Title: Conditionals – Lit

URL Source: https://lit.dev/docs/templates/conditionals/

Markdown Content:
Contents
--------

1.   [Conditionals with the conditional (ternary) operator](https://lit.dev/docs/templates/conditionals/#conditionals-with-the-conditional-(ternary)-operator)
2.   [Conditionals with if statements](https://lit.dev/docs/templates/conditionals/#conditionals-with-if-statements)
3.   [Caching template results: the cache directive](https://lit.dev/docs/templates/conditionals/#caching-template-results:-the-cache-directive)
4.   [Conditionally rendering nothing](https://lit.dev/docs/templates/conditionals/#conditionally-rendering-nothing)

Since Lit leverages normal Javascript expressions, you can use standard Javascript control flow constructs like [conditional operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator), function calls, and `if` or `switch` statements to render conditional content.

JavaScript conditionals also let you combine nested template expressions, and you can even store template results in variables to use elsewhere.

Conditionals with the conditional (ternary) operator
----------------------------------------------------

[Permalink to “Conditionals with the conditional (ternary) operator”](https://lit.dev/docs/templates/conditionals/#conditionals-with-the-conditional-(ternary)-operator)

Ternary expressions with the conditional operator, `?`, are a great way to add inline conditionals:

`render() {return this.userName? html`Welcome ${this.userName}`: html`Please log in <button>Login</button>`;}`

Conditionals with if statements
-------------------------------

[Permalink to “Conditionals with if statements”](https://lit.dev/docs/templates/conditionals/#conditionals-with-if-statements)

You can express conditional logic with if statements outside of a template to compute values to use inside of the template:

`render() {let message;if (this.userName) {message = html`Welcome ${this.userName}`;} else {message = html`Please log in <button>Login</button>`;}return html`<p class="message">${message}</p>`;}`
Alternately, you can factor logic into a separate function to simplify your template:

`getUserMessage() {if (this.userName) {return html`Welcome ${this.userName}`;} else {return html`Please log in <button>Login</button>`;}}render() {return html`<p>${this.getUserMessage()}</p>`;}`

Caching template results: the cache directive
---------------------------------------------

[Permalink to “Caching template results: the cache directive”](https://lit.dev/docs/templates/conditionals/#caching-template-results:-the-cache-directive)

In most cases, JavaScript conditionals are all you need for conditional templates. However, if you're switching between large, complicated templates, you might want to save the cost of recreating DOM on each switch.

In this case, you can use the `cache`_directive_. The cache directive caches DOM for templates that aren't being rendered currently.

`render() {return html`${cache(this.userName ?html`Welcome ${this.userName}`:html`Please log in <button>Login</button>`)}`;}`
See the [cache directive](https://lit.dev/docs/templates/directives/#cache) for more information.

Conditionally rendering nothing
-------------------------------

[Permalink to “Conditionally rendering nothing”](https://lit.dev/docs/templates/conditionals/#conditionally-rendering-nothing)

Sometimes, you may want to render nothing in one branch of a conditional operator. This is commonly needed for child expressions and also sometimes needed in attribute expressions.

For child expressions, the values `undefined`, `null`, the empty string (`''`), and Lit's [nothing](https://lit.dev/docs/api/templates/#nothing) sentinel value all render no nodes. See [Removing child content](https://lit.dev/docs/templates/expressions/#removing-child) for more information.

This example renders a value if it exists, and otherwise renders nothing:

`render() {return html`<user-name>${this.userName ?? nothing}</user-name>`;}`
For attribute expressions, Lit's [nothing](https://lit.dev/docs/api/templates/#nothing) sentinel value removes the attribute. See [Removing an attribute](https://lit.dev/docs/templates/expressions/#removing-attribute) for more information.

This example conditionally renders the `aria-label` attribute:

`html`<button aria-label="${this.ariaLabel || nothing}"></button>``
[Edit this page](https://github.com/lit/lit.dev/edit/main/packages/lit-dev-content/site/docs/v3/templates/conditionals.md)
