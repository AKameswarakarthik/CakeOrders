import type { Metadata } from "next";
export const metadata: Metadata = { title: "3D Cake Design Studio" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
