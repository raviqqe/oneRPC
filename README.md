# oneRPC

[![GitHub Action](https://img.shields.io/github/actions/workflow/status/raviqqe/onerpc/test.yaml?branch=main&style=flat-square)](https://github.com/raviqqe/onerpc/actions)
[![Codecov](https://img.shields.io/codecov/c/github/raviqqe/onerpc.svg?style=flat-square)](https://codecov.io/gh/raviqqe/onerpc)
[![npm](https://img.shields.io/npm/v/onerpc?style=flat-square)](https://www.npmjs.com/package/onerpc)
[![License](https://img.shields.io/github/license/raviqqe/onerpc.svg?style=flat-square)](LICENSE)

The router-less serverless RPC framework.

oneRPC is a minimal RPC library to convert a server-side function of a type, `(input: T) => Promise<S>` into `(request: Request) => Promise<Response>` and make it callable from the client side in a type-safe way.

Currently, we support [Next.js Route Handlers][route-handlers] and [AWS Lambda](https://aws.amazon.com/lambda/).

## Features

- 🔮 Seamless client-server communication

  You can call remote procedures just as seamless as calling local functions.

- 🛡️ Type safe

  Server-client communication is made safe with request and response types in TypeScript which are used by both client and server.

- 🔥 Serverless first

  Routing is delegated to other frameworks or infrastructures.

- 🤝 HTTP friendly

  You can leverage full potential of HTTP functionalities, such as cache control headers.

- 🐁 Minimal dependencies

  It depends only on [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API). Thus, it works on many platforms including Node.js, Deno, and edge runtimes.

- 🌊 Streaming support

  Stream responses are transferred as [JSON Lines](https://jsonlines.org/) and clients can consume them chunk by chunk.

## API

### `onerpc` module

#### `query` function

Creates a `GET` endpoint function of a type `(input: T) => Promise<S>`.

#### `queryStream` function

Creates a `GET` endpoint function of a type `(input: T) => AsyncIterable<S>`.

#### `mutate` function

Creates a `POST` endpoint function of a type `(input: T) => Promise<S>`.

#### `Server` class

A utility class to pass the same procedure options to multiple procedures.

#### `RpcError` class

A custom error class to return a custom status code (default: 500) from an endpoint.

### `onerpc/client` module

#### `query` function

Calls a `GET` endpoint function of a type `(input: T) => Promise<S>`.

#### `queryStream` function

Calls a `GET` endpoint function of a type `(input: T) => AsyncIterable<S>`.

#### `mutate` function

Calls a `POST` endpoint function of a type `(input: T) => Promise<S>`.

#### `Client` class

A utility class to pass the same request options to multiple procedure calls.

## Examples

For all examples, see a [`examples`](examples) directory.

### Next.js with [Route Handlers][route-handlers]

`app/api/foo/route.ts`:

```typescript
import { query } from "onerpc";
import { z } from "zod";

export const GET = query(z.number(), z.string(), (x) => `Hello, ${x}!`, {
  path: "/api/foo",
});
```

`app/page.tsx`:

```typescript
import { type GET } from "@/app/api/foo/route";
import { query } from "onerpc/client";

export default async (): Promise<JSX.Element> => (
  <div>{await query<typeof GET>("/api/foo", 42))}</div>
);
```

## References

- [tRPC](https://trpc.io/)
- [Hono.js](https://hono.dev/)
- [Route Handlers | Next.js](https://nextjs.org/docs/app/building-your-application/routing/router-handlers)

## License

[MIT](LICENSE)

[route-handlers]: https://nextjs.org/docs/app/building-your-application/routing/router-handlers
