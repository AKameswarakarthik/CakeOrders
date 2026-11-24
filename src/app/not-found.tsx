import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-28 text-center">
      <div className="text-7xl">🍰</div>
      <h1 className="mt-6 font-display text-4xl">This slice is missing</h1>
      <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="btn btn-primary mt-6 px-6 py-3">Back home</Link>
    </div>
  );
}
