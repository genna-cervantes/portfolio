---
title: Concurrency Has a Cost
date: September 7, 2026
description: Understanding Postgres Connections in Serverless Architecture
readTime: 7 min read
---
## Parallelism feels free

We expect software to be fast which is why I reach for `Promise.all()` a lot.  Whenever I see a chain of awaits that don't depend on each other, my first instinct is to run them together.  Its free speed in my head.

Take three independent queries:

```ts
await db.query(users)
await db.query(products)
await db.query(locations)
```

Written this way, `products` doesn't start until `users` finishes, and `locations` waits for `products`. None of them need each other, so why wait?

```ts
await Promise.all([
  db.query(users),
  db.query(products),
  db.query(locations)
])
```

Now all three are in flight at once. From where I'm sitting in the application code, this is an obvious win. Three queries happen together instead of one after another.

![Sequential vs concurrent timelines](/diagrams/concurrency/01-sequential-vs-concurrent.gif)

But the application isn't the only thing doing work here. Those queries run somewhere else, and that somewhere has its own limits.


## The database has a budget

Our application talks to PostgreSQL through connections.  A connection is just a channel between the app and the Postgres server, and most apps use a **connection pool** to cap how many are open at the same time.  Say the pool limit is 10, the application can have at most 10 connections in use at once.  Simply said, queries are the *work* being done, and connections are the *resource that performs the work*.

Sequential queries don't each need their own connection. One finishes, the connection frees up, the next one reuses it. Concurrent queries run at the same time, so they each hold a connection at the same time.

![Connection pool: sequential uses one connection, concurrent uses three](/diagrams/concurrency/02-connection-pool.gif)

So, concurrency isn't free speed after all..  More work happening at once means more resources holding it up. With three queries, who cares? But what about hundreds of queries?


## What happens with 500 queries?

Say I need to find 500 products. The straightforward version would look like this:

```ts
for (const id of productIds) {
  await findProduct(id)
}
```

This is slow because every query waits for the one before it. So I do what I always do:

```ts
await Promise.all(
  productIds.map((id) => findProduct(id))
)
```

Now 500 queries are in flight, and from the application's side this looks great. But the pool still has 10 connections, and the first 10 queries grab one each. The other 490 sit there waiting for a connection to free up.

![500 queries against a pool of 10 connections](/diagrams/concurrency/03-500-queries.gif)

This is where concurrency turns into contention.  `Promise.all()` didn't make Postgres able to run 500 queries at once. It asked my application to *hold* 500 queries in flight at once, without asking the system underneath whether it could handle that.


## Serverless makes it worse

Everything so far assumed one application instance. A traditional server has one long-running process with one connection pool:

```text
Application Server
└── Connection Pool
    ├── Connection
    ├── Connection
    ├── ...
    └── Connection
```

With a pool limit of 10, that instance uses up to 10 connections. Simple math.  However, serverless scales horizontally. Instead of one instance, several spin up to handle requests as load increases:

```text
Instance 1 → 10 connections
Instance 2 → 10 connections
Instance 3 → 10 connections
Instance 4 → 10 connections
...
```

Ten connections per instance does not mean ten connections total. With ten instances running, up to 100 connections are competing for the same Postgres database.

![Serverless instances each bring their own connection pool](/diagrams/concurrency/04-serverless-pools.gif)

One instance has one pool, but scaling the application creates many pools.  So scaling the app also scales the pressure on the database, and the database doesn't scale with it.  How many connections it can support depends on its size, config, workload, and provider.  Whatever that number is, it's **finite**, and the application can grow past it without noticing. 


## Transactions change the rules

So far the queries have been independent but sometimes they aren't, and several operations need to succeed or fail as one unit. That's what transactions are for.

Imagine creating an order:

```text
Create order
     ↓
Create order items
     ↓
Decrease inventory
     ↓
Commit
```

If something fails halfway, I don't want an order that exists while its inventory was never deducted.  A transaction makes these atomic: either the whole thing commits, or the database rolls everything back.

![Transaction commit and rollback paths](/diagrams/concurrency/05-transaction.gif)

This changes how concurrency works.  Queries in the same transaction share the same transactional context, which in practice means they're tied to the transaction's single connection, so wrapping them in `Promise.all()` doesn't buy any database-level parallelism:

```ts
await db.transaction(async (tx) => {
  await Promise.all([
    tx.order.create(...),
    tx.orderItem.create(...),
    tx.inventory.update(...)
  ])
})
```

The JavaScript promises are concurrent, but Postgres isn't running those operations concurrently in any useful way.  Usually the better move is a database-level operation like `findMany`, `updateMany`, or a bulk insert that handles many records in one go if applicable.

## Finding the right amount of concurrency

Back to the 500 products. Let's say each instance has a pool of 10, and each query takes about half a second.

The first ten look fine. Each one takes a connection:

```text
query 1   → takes a connection → 9/10 free
query 2   → takes a connection → 8/10 free
query 3   → takes a connection → 7/10 free
...
query 10  → takes a connection → 0/10 free
query 11  → no connection left
```

Query 11 is where it starts. A query that can't get a connection goes into a queue and waits. But it doesn't wait forever. The pool also has a connection wait limit, say it's 20 seconds. A query that waits 20 seconds without getting a connection throws instead of running.

Now let's walk through the batches. Queries 1 to 10 hold all ten connections for half a second, then release them. Queries 11 to 20 waited half a second for that. Queries 21 to 30 waited a full second, for both batches ahead. Every batch waits half a second longer than the one before:

```text
batch 1    queries 1–10      waits 0s
batch 2    queries 11–20     waits 0.5s
batch 3    queries 21–30     waits 1.0s
...
batch 40   queries 391–400   waits 19.5s
batch 41   queries 401–410   waits 20.0s   → timeout
...
batch 50   queries 491–500   waits 24.5s   → timeout
```

Batch 41 hits the 20 second limit before a connection frees up, and so does every batch behind it. Queries 401 through 500 fail, `Promise.all()` rejects, and the user gets an error for a request that was 80% done. And so they retry. 


The same 500 queries line up the same way, and the same 100 fail again, it never works, because we assumed the resources under concurrency were unlimited, and they weren't.

![Batches wait longer and longer until queries 401 to 500 hit the 20s limit](/diagrams/concurrency/06-connection-timeout.gif)

But what now? do we go back to sequential? Not necessarily.  Sequential wastes capacity that's sitting right there, and unlimited concurrency overwhelms it.  What we actually want is **bounded concurrency**: a ceiling on how many queries run at the same time.

The simplest way to get that is batching.  Instead of handing all 500 ids to one `Promise.all()`, split them up and run one batch at a time:

```ts
const BATCH_LIMIT = 200

const batches: string[][] = []
for (let i = 0; i < productIds.length; i += BATCH_LIMIT) {
  batches.push(productIds.slice(i, i + BATCH_LIMIT))
}

for (const batch of batches) {
  await Promise.all(batch.map((id) => findProduct(id)))
}
```

Now at most 200 queries are in flight. Within a batch the pool still hands out connections ten at a time, so the last ten queries wait for the nineteen groups ahead of them: 19 × 0.5s = 9.5s. That's under the 20-second limit, so every query gets a connection before it times out. Each batch takes about 10 seconds, and the three batches (200, 200, 100) finish in roughly 25 seconds with nothing failing.

![Batches of 200: longest wait 9.5s, nothing fails](/diagrams/concurrency/07-bounded-concurrency.gif)

The batch size is the knob here.  200 works because we know each query takes about half a second and the wait limit is 20 seconds.  Push it to 400 and the last queries wait 19.5 seconds, one slow query away from timing out.  Drop it to 10 and nothing ever queues at the pool.  Total time is about 25 seconds either way, because ten connections is the real ceiling.  What the batch size controls is whether the overflow waits safely or times out.

Picking a good number means having a feel for how long each call takes and what load the instance is usually under, then tuning for as much concurrency as fits inside those limits. It depends on:

- connection pool size
- connection wait limit
- query execution time
- database capacity
- application traffic
- other queries competing for the same connections

But then again there's often a better answer than any batch size.

## Application concurrency vs. database concurrency

We've been using application level concurrency to solve a database problem.  For the 500 products:

```ts
await Promise.all(
  productIds.map((id) => findProduct(id))
)
```

That asks the application to make hundreds of individual round trips. What if the database can answer the whole question in just one query? Instead of:

```ts
for (const id of productIds) {
  await findProduct(id)
}
```

We could write it as:

```ts
await db.product.findMany({
  where: {
    id: {
      in: productIds
    }
  }
})
```

Now the application isn't creating 500 database operations. It asks the database to return the whole set as one operation.  This is the difference between **application concurrency** and **database-level operations**. `Promise.all()` controls how much work the application has in flight. `findMany`, `updateMany`, bulk inserts, and other set-based queries let the database handle many records in far fewer operations.

![Application concurrency vs one database-level operation](/diagrams/concurrency/08-app-vs-db.gif)


## The takeaway

Takeaway here is concurrency should be an intentional optimization, blindly using it without considering constraints may leave you debugging confusing connection errors.  Remember that every layer has finite resources, reaching for Promise.all() is good instinct but remember that that controls only application concurrency not database capacity.  

Better to reach for database concurrency when possible.  We all want good performing software but it is good to make sure the performance your looking for is something your system and your limits can handle.