import type { MouseEventHandler, ReactNode } from "react";
import { Link as RouterLink, type To } from "react-router-dom";

type LinkProps = {
  href: To;
  className?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export default function Link({ href, children, ...props }: LinkProps) {
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  );
}
