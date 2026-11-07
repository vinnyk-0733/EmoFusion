'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const NavLink = forwardRef(
  ({ className, activeClassName, to, href, ...props }, ref) => {
    const pathname = usePathname();
    const target = href || to || "/";
    const isActive = pathname === target;

    return (
      <Link
        ref={ref}
        href={target}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
