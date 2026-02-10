Title: Getting Started – Lit

URL Source: https://lit.dev/docs/getting-started/

Markdown Content:
Contents
--------

1.   [Lit Playground](https://lit.dev/docs/getting-started/#lit-playground)
2.   [Interactive tutorial](https://lit.dev/docs/getting-started/#interactive-tutorial)
3.   [Lit starter kits](https://lit.dev/docs/getting-started/#lit-starter-kits)
4.   [Install locally from npm](https://lit.dev/docs/getting-started/#install-locally-from-npm)
5.   [Use bundles](https://lit.dev/docs/getting-started/#use-bundles)
6.   [Add Lit to an existing project](https://lit.dev/docs/getting-started/#add-lit-to-an-existing-project)
7.   [Open WC project generator](https://lit.dev/docs/getting-started/#open-wc-project-generator)

There are many ways to get started using Lit, from our Playground and interactive tutorial to installing into an existing project.

Get started right away with the interactive playground and examples. Start with "[Hello World](https://lit.dev/playground)", then customize it or move on to more examples.

Interactive tutorial
--------------------

[Permalink to “Interactive tutorial”](https://lit.dev/docs/getting-started/#interactive-tutorial)

Take our [step-by-step tutorial](https://lit.dev/tutorials/intro-to-lit) to learn how to build a Lit component in minutes.

Lit starter kits
----------------

[Permalink to “Lit starter kits”](https://lit.dev/docs/getting-started/#lit-starter-kits)

We provide TypeScript and JavaScript component starter kits for creating standalone reusable components. See [Starter Kits](https://lit.dev/docs/tools/starter-kits/).

Install locally from npm
------------------------

[Permalink to “Install locally from npm”](https://lit.dev/docs/getting-started/#install-locally-from-npm)

Lit is available as the `lit` package via npm.

`npm i lit`
Then import into JavaScript or TypeScript files:

`import {LitElement, html} from 'lit';import {customElement, property} from 'lit/decorators.js';``import {LitElement, html} from 'lit';`
Lit is also available as pre-built, single-file bundles. These are provided for more flexibility around development workflows: for example, if you would prefer to download a single file rather than use npm and build tools. The bundles are standard JavaScript modules with no dependencies - any modern browser should be able to import and run the bundles from within a `<script type="module">` like this:

`import {LitElement, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';`
**If you're using npm for client-side dependencies, you should use [the `lit` package](https://lit.dev/docs/getting-started/#install-locally-from-npm), not these bundles.** The bundles intentionally combine most or all of Lit into a single file, which can cause your page to download more code than it needs.

To browse the bundles, go to [https://cdn.jsdelivr.net/gh/lit/dist/](https://cdn.jsdelivr.net/gh/lit/dist/) and use the dropdown menu to go to the page for a particular version. On that page, there will be a directory for each type of bundle available for that version. There are two types of bundles:

core[https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js](https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js)

`core` exports the same items as [the main module of the `lit` package](https://github.com/lit/lit/blob/main/packages/lit/src/index.ts).all[https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js](https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js)

`all` exports everything in `core` plus [most other modules in `lit`](https://github.com/lit/lit/blob/main/packages/lit/src/index.all.ts).

Note that `html` and `svg` exports from `lit/static-html.js` are aliased to `staticHtml` and `staticSvg`, respectively, to avoid collision.

Add Lit to an existing project
------------------------------

[Permalink to “Add Lit to an existing project”](https://lit.dev/docs/getting-started/#add-lit-to-an-existing-project)

See [Adding Lit to an existing project](https://lit.dev/docs/tools/adding-lit) for instructions on adding Lit to an existing project or application.

Open WC project generator
-------------------------

[Permalink to “Open WC project generator”](https://lit.dev/docs/getting-started/#open-wc-project-generator)

The Open WC project has a [project generator](https://open-wc.org/docs/development/generator/) that can scaffold out an application project using Lit.

[Edit this page](https://github.com/lit/lit.dev/edit/main/packages/lit-dev-content/site/docs/v3/getting-started.md)
