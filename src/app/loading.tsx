export default function Loading() {
  // Rendered inside a <Suspense> boundary while a route segment (and its
  // children) load. Replace with real skeleton UI as routes are built out.
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <span
        className="text-foreground/40 h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
