# oneRPC

[![GitHub Action](https://img.shields.io/github/actions/workflow/status/raviqqe/onerpc/test.yaml?branch=main&style=flat-square)](https://github.com/raviqqe/onerpc/actions)
[![Codecov](https://img.shields.io/codecov/c/github/raviqqe/onerpc.svg?style=flat-square)](https://codecov.io/gh/raviqqe/onerpc)
[![npm](https://img.shields.io/npm/v/onerpc?style=flat-square)](https://www.npmjs.com/package/onerpc)
[![License](https://img.shields.io/github/license/raviqqe/onerpc.svg?style=flat-square)](LICENSE)

The RPC library for the serverless and TypeScript era.

oneRPC is a minimal RPC library to convert a server-side function of a type, `(input: T) => Promise<S>` into `(request: Request) => Promise<Response>` and make it callable from the client side.

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

  It depends only on [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API). Thus, it works on many platforms including Node.js, Deno, and edges.

- 🌊 Streaming support

  Stream responses are transferred as [JSON Lines](https://jsonlines.org/) and clients can consume them chunk by chunk.

## API

### `onerpc`

- `query`

  Creates a `GET` endpoint function of a type `(input: T) => Promise<S>`.

- `queryStream`:

  Creates a `GET` endpoint function of a type `(input: T) => AsyncIterable<S>`.

- `mutate`:

  Creates a `POST` endpoint function of a type `(input: T) => Promise<S>`.

### `onerpc/client.js`

## Examples

### Next.js with [App Router](https://nextjs.org/docs/app)

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
