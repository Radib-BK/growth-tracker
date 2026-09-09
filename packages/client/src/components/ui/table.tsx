import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Thin wrappers over the native table elements. TanStack Table is headless:
 * it never renders markup, so these are the markup. Nothing here knows about
 * sorting, filtering or paging - that all lives in the table instance.
 */

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="tbl-scroll relative w-full overflow-auto rounded-xl border bg-white shadow-[0_1px_2px_oklch(0_0_0/0.04)]">
      <table className={cn("w-full caption-bottom border-separate border-spacing-0", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={className} {...props} />;
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={className} {...props} />;
}

export function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return <tfoot className={cn("[&_td]:border-t [&_td]:bg-neutral-50 [&_td]:font-medium", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={className} {...props} />;
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "relative h-10 border-b px-3 text-left align-middle text-[12px] text-neutral-600 whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("border-b bg-white px-3 py-2.5 align-middle", className)} {...props} />;
}

export function TableEmpty({ colSpan, children }: { colSpan: number; children?: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-neutral-500">
        {children ?? "No rows match the current filters."}
      </TableCell>
    </TableRow>
  );
}
