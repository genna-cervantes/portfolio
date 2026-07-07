---
title: Offline Support Without Another Mental Model
date: July 7, 2026
description: The best way to add an API is to make it feel like it was already there.
---
## The problem isn't offline support

New features don’t usually make codebases harder to work with. New patterns do.

A 2k-line diff with reused patterns? Easy. A 600-line diff with a completely new paradigm? That deserves a much closer look.

One thing I’m currently working on is offline support for our application. There’s a lot that goes into it: serving pages offline, copying data to the device for later, mutation queues, sync engines, and conflict resolution. Intimidating? Sure. But building those features wasn’t actually the hard part. The hard part was making sure they looked like they belonged in the codebase.

Every new abstraction teaches developers something new. One hook here, another utility there, another small mental note of, *"Oh yeah, offline works a little differently because..."*

Individually these are tiny. But enough of these tiny inconsistencies across enough diffs, and suddenly there’s no "normal" way of doing something as simple as running a query anymore.

I wanted offline support to add a feature, not another mental model.


## The first implementation

Okay, but how exactly did I do that?  It sounds nice in theory, but what does "not another mental model" actually look like in code?

Well, like most things these days, my first pass was with Claude Code (using Fable 5 on High Effort). It gave me this:

```tsx
const products = useOfflineProducts()
```

That definitely works, I tested it even. If all I cared about was getting offline support working, I could’ve committed this right away.  But look at the online (current) equivalent:

```tsx
const { data: products } = api.v1.products.findMany.useQuery(...)
```

Both pieces of code do the exact same thing: give you the products. One happens to read from the server, and the other happens to read from a local copy on the user’s device.

So why do they look like two completely different APIs?

```tsx
useOfflineProducts()
```

doesn’t even immediately read as a data fetch. It looks like just another custom hook hiding who knows what inside. Sure, I could add a comment so the next developer understands it at first glance.

```tsx
// Offline query to get products from the user's local copy. Just trust.
useOfflineProducts()
```

But that shouldn’t be the solution to an inconsistent abstraction.

This is where I think AI-assisted coding becomes interesting. Getting to working code is easier than deciding where to eat. Deciding whether that code belongs in *your* codebase is still engineering.

Imagine repeating this pattern across fifty modules.

```tsx
useOfflineProducts()
useOfflineCustomers()
useOfflineOrders()
```

Now every offline entity introduces another hook to discover, another file to maintain, and another convention to remember.  And that’s not complexity caused by offline support. That’s complexity caused by bad API design.  So instead of inventing another abstraction, why not just steal the API pattern we already have?

If someone already knows how to write:

```tsx
const { data: products } = api.v1.products.findMany.useQuery(...)
```

for the online API, then wouldn’t it be easier if the offline API looked a little more like this?

```tsx
const { data: products } = offlineApi.v1.products.findMany.useQuery(...)
```

Now they look like they do the exact same thing, just reading from different sources. One is `api`; the other is `offlineApi`.


## Stealing the API

But at first glance, this looks like much more effort than just writing:

```tsx
useOfflineProducts()
```

Instead of writing a single hook, I now had to mirror the namespace structure of the original tRPC API. And yes, at first glance, that feels like more work. So why even bother?

Because once that structure exists, adding another offline query becomes almost mechanical.

```tsx
export const offlineApi = {
  v1: {
    products: {
      findMany,
      // add another query? just do
      findOne,
    },
  },
}
```

Instead of scattering `useOfflineProducts()`, `useOfflineCustomers()`, and `useOfflineOrders()` across different files, we now have a single registry for everything the offline layer exposes.

If someone asks, *"Does this query exist offline?"*  there's exactly one place to look.

The nice part is that these queries don't even have to be handwritten. Each entry in this registry is created through a small `createOfflineQuery` factory that wires it up to behave just like a normal tRPC query.

```tsx
export const findMany = createOfflineQuery({
  read: readProducts,
})
```

And just like that, with a little bit of pushback on the AI and a little bit of wiring, we now have a fully working query that feels almost indistinguishable from the online API.

```tsx
const { data: products } = api.v1.products.findMany.useQuery(...)
```

Compared to:

```tsx
const { data: products } = offlineApi.v1.products.findMany.useQuery(...)
```

The only thing that changed is where the data comes from. The API developers interact with barely changed at all.


## Convention over Configuration

At this point, we'd achieved something I cared about from the very beginning.

The offline layer isn't introducing a *new* way of fetching data. It follows the same pattern every developer already knows.

This is *Convention over Configuration* in practice. Rather than asking developers to learn a new API for one feature, we follow conventions they already know. The implementation is completely different, but the way you interact with it isn't.

That's the real value of designing the abstraction first.

By mirroring the existing tRPC API and building around a reusable factory, I wasn't optimizing for the first offline endpoint. I was optimizing for the tenth, the twentieth, and every one after that.

The API stays stable while the implementation is free to evolve.


## Outtakes: where I'd take this next

Of course, this probably isn't the last iteration of the API.  One thing I can already see improving is removing the decision from the caller entirely of which data source to use.

Right now, a component might still need to do something like this:

```tsx
const { data: offlineProducts } =
  offlineApi.v1.products.findMany.useQuery(...)

const { data: products } =
  api.v1.products.findMany.useQuery(...)

const productList = isOffline ? offlineProducts : products
```

It works, but the caller still has to know that there are two sources of data.  A future version could hide that behind the exact same query signature:

```tsx
const { data: productList } =
  combinedApi.v1.products.findMany.useQuery(...)
```

Internally, it decides where the data should come from:

```tsx
const findMany = () => {
  // ... online query
  // ... offline query

  return isOffline ? offlineProducts : products
}
```

That pushes the abstraction one level further.

Instead of every component deciding whether to read from the online or offline API, that decision could be configured globally.

For example, we could choose whether the application prefers the server first:

```tsx
export const combinedApi = createApi({
  strategy: "server-first",
})
```

Or whether it should behave more like a local-first application:

```tsx
export const combinedApi = createApi({
  strategy: "local-first",
})
```

The component no longer cares whether the data came from the server, IndexedDB, a cache, or some sync layer in between.  It simply asks for products.

