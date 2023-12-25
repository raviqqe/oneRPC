import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default ({ children }: Props): JSX.Element => <>Output: {children}</>;