---
title: Premature Abstraction Is The Root of All Headaches
date: July 16, 2026
description: A short reflection on when duplicated code is better left alone
readTime: 5.5 min read
---
## The duplication question

I overthink duplication a lot.  Whenever I see repeated code, I pause and think to myself: should I leave this alone or should I abstract it?  Which sounds simple enough until I’m staring at real actual code in a production codebase.


## When DRY is obviously right

Sometimes the duplication is obviously waste. Two code blocks do the same thing, represent the same concept, and will probably change for the same reasons.  For example:

```tsx
const today = new Date()

const promoProducts = products
  .filter(
    (product) =>
      product.promoStartDate <= today && product.promoEndDate >= today
  )
  .map((product) => ({
    name: product.name,
    price: product.price,
  }))

const promoServices = services
  .filter(
    (service) =>
      service.promoStartDate <= today && service.promoEndDate >= today
  )
  .map((service) => ({
    name: service.name,
    price: service.price,
  }))
```

In this case, extracting the logic feels correct.

```tsx
const getActivePromoItems = (items) => {
  const today = new Date()

  return items
    .filter((item) => item.promoStartDate <= today && item.promoEndDate >= today)
    .map((item) => ({
      name: item.name,
      price: item.price,
    }))
}

const promoProducts = getActivePromoItems(products)
const promoServices = getActivePromoItems(services)
```

This is the easy kind of duplication.  Both blocks are doing the absolute same thing. If the promo logic changes, both should probably change together. DRY makes sense *here*.

**DRY**, or **Don’t Repeat Yourself**, is one of those concepts drilled into you early when learning software engineering.  It makes sense because repeated code means more code to maintain. If there’s a bug, you might have to fix it in multiple places. If logic changes, you have to remember every place that copied it. If two blocks are supposed to stay the same but slowly drift apart, that drift becomes a new bug.


## The hidden cost of abstraction

So the instinct to remove duplication is not wrong.  But removing duplication is not free.  Most of the time, to remove duplication, we create an abstraction. A helper, a hook, a shared component, or a factory.  And once multiple parts of the code use that same abstraction, they are now connected.

That connection is called *coupling*.  **Coupling** is basically how much one part of the code depends on another. Some coupling is normal and a codebase with zero coupling is just unrelated files.  But the more tightly coupled things are, the more likely it is that a change in one place affects another place.

That's the exact reason why I overthink removing duplication.  Duplication is easier to see, you open the file, see the repeated code, and think “this looks messy.”  Coupling, on the other hand, is harder to see, it's sneaky, it hides behind clean looking abstractions.  The code can look cleaner because there are fewer repeated lines. But now one function or component might be responsible for multiple flows that only look similar on the surface.

As much as possible, we want changes to move through code in a narrow path.

```txt
A → B → C
```

What I don’t want is one small change exploding outward into a bunch of unrelated places.

```txt
        A
     /  |  \
    B   C   D
   / \     / \
  E   F   G   H
```

The second one might have less duplication, but the blast radius is wider.  Now when something breaks, there's another question other than “what changed?” we now ask “what else depends on the thing that changed?”


## Real life example: One component, two APIs

A real example I ran into was a component that already existed in our codebase.  It was fairly large and already shaped around one API. Not completely impossible to reuse, but coupled enough that the component structure followed the data it received.  Then I had to support another API source for a similar feature.

So the question was:

> ***1. Do I thread the new API into the existing component?***
> ***2. Or do I create a separate component for the new flow?***

The first option is more DRY since it's just still one component, shared rendering, less duplicated code.  Something like this:

```tsx
function OrderSummary({ source }) {
  const legacyOrder = useLegacyOrder()
  const newOrder = useNewOrder()

  const order = source === "legacy" ? legacyOrder.data : newOrder.data

  const customerName =
    source === "legacy" ? order.customer.name : order.customerName

  const total =
    source === "legacy"
      ? calculateLegacyTotal(order)
      : calculateNewTotal(order)

  return (
    <section>
      <h2>{customerName}</h2>
      <p>{total}</p>
    </section>
  )
}
```

> *Note that the component was much larger than this*

This removes duplication because both flows use the same component but the catch is that now the component has to understand both APIs.  It needs to know the legacy shape and it needs to know the new shape. It needs to know which helper to call and which fields exist depending on the source.  Which seems fine at first until, one more difference appears.  Then another. Then another....

And now the component starts looking like this:

```tsx
const title =
  source === "legacy" ? order.customer.name : order.customerName

const status =
  source === "legacy" ? mapLegacyStatus(order.status) : order.status

const items =
  source === "legacy" ? order.lineItems : order.items

const total =
  source === "legacy"
    ? calculateLegacyTotal(order)
    : calculateNewTotal(order)
```

It is still technically DRY.  There is still one component.  But now both API flows are coupled through the same implementation.  A change for the new API can affect the legacy flow. A change for the legacy flow can make the new flow harder to reason about. Testing one means thinking about the other.

The second option is to just create another component.

```tsx
function LegacyOrderSummary() {
  const { data: order } = useLegacyOrder()

  return (
    <section>
      <h2>{order.customer.name}</h2>
      <p>{calculateLegacyTotal(order)}</p>
    </section>
  )
}

function NewOrderSummary() {
  const { data: order } = useNewOrder()

  return (
    <section>
      <h2>{order.customerName}</h2>
      <p>{calculateNewTotal(order)}</p>
    </section>
  )
}
```

This definitely duplicates a fair amount of code.  The layout and markup is very similar and rendering logic repeat.  But now each component follows the shape of its own API.  If the new API changes, its easy to know where to look.

That’s the tradeoff I keep overthinking.  Option 1 gives less code, but more coupling.  Option 2 gives more code, but more isolation.  In this case, I chose the second option.

The main reason was that the two flows only looked similar today but based on the business context, I expected them to diverge later.  If I put both API sources into one component, I probably wasn’t avoiding complexity but was just delaying it until the component had more conditionals, more branching, and more reasons to change.

Plus, the existing component was also already large.  I would rather read two separate fairly large components than one massive component threaded with conditionals for multiple data sources.

But that doesn’t mean duplicating the component is always right.  If both APIs represented the same concept, changed for the same reasons, and were likely to stay aligned, then sharing the component might be better.


## Same today, different tomorrow

Similar code does not always mean shared knowledge, sometimes two things just happen to look the same right now.  That is why I think DRY is often taught too simply. The problem is not always duplicated syntax. If two parts of the code represent the same business rule, duplicating that rule is dangerous.  When the rule changes, every copy has to change with it. That is the kind of duplication DRY is good at catching.  But if two parts of the code only look alike on the surface, abstracting them too early can be worse.

So now before I abstract duplicated code, I ask:

- Are these two things the same concept?
- Will they change for the same reasons?
- Will future me understand why this abstraction exists?

If the answer is unclear, I usually leave the duplication alone a little longer because duplication is not always the enemy.  Sometimes duplication is the price you pay to keep two things independent.  And sometimes the cleaner looking abstraction is only cleaner because the coupling is hidden.  And once that hidden coupling starts shaping future changes, premature abstraction becomes the root of all your future headaches.