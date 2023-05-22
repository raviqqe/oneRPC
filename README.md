# oneRPC

[![GitHub Action](https://img.shields.io/github/actions/workflow/status/raviqqe/onerpc/test.yaml?branch=main&style=flat-square)](https://github.com/raviqqe/onerpc/actions)
[![Codecov](https://img.shields.io/codecov/c/github/raviqqe/onerpc.svg?style=flat-square)](https://codecov.io/gh/raviqqe/onerpc)
[![npm](https://img.shields.io/npm/v/@raviqqe/onerpc?style=flat-square)](https://www.npmjs.com/package/@raviqqe/onerpc)
[![License](https://img.shields.io/github/license/raviqqe/onerpc.svg?style=flat-square)](LICENSE)

The RPC library for the serverless and TypeScript era.

## Features

- 🛡️ Type safe
  - Server-client communication is made safe with request and response types in TypeScript that are used by both client and server.
- 🔥 Zero routing
  - Routing is delegated to other frameworks or infrastructures.
- 🌊 Streaming
  - Stream responses are transferred as [JSON Lines](https://jsonlines.org/) and clients can consume them chunk by chunk.

## References

- [tRPC](https://trpc.io/)
- [Route Handlers | Next.js](https://nextjs.org/docs/app/building-your-application/routing/router-handlers)

## License

[MIT](LICENSE)
