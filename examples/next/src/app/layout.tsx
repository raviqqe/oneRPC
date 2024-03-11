import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default ({ children }: Props): JSX.Element => (
  <html lang="en">
    <head>
      <meta content="en" httpEquiv="content-language" />
    </head>
    <body>{children}</body>
  </html>
);
