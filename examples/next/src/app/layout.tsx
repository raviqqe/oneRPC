import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default ({ children }: Props): JSX.Element => <>{children}</>;
