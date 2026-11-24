import type { Metadata } from "next";
export const metadata: Metadata = { title: "Review My Cake" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
