import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <span className="text-5xl mb-4">📭</span>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Page not found</h1>
      <p className="text-muted-foreground text-sm mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
