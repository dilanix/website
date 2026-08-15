import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-foreground/60">
        Could not find the requested resource.
      </p>
      <Link href="/" className="underline underline-offset-4">
        Return home
      </Link>
    </div>
  );
}
