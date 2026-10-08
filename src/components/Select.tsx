import { CaretDown } from "@phosphor-icons/react";
import type { SelectHTMLAttributes } from "react";

/** Keeps native keyboard and screen-reader behavior with consistent arrow spacing. */
export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="select-control">
      <select {...props}>{children}</select>
      <CaretDown size={18} aria-hidden="true" />
    </span>
  );
}
