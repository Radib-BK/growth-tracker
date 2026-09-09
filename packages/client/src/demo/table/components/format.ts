import { currency } from "@/demo/table/data/users";

export const money = (n: number) => currency.format(n);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
