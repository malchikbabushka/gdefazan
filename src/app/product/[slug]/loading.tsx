export default function ProductLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 h-4 w-2/3 max-w-md animate-pulse rounded bg-white/10" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-white/5" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-9 w-4/5 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-40 animate-pulse rounded bg-yellow-400/20" />
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
        </div>
      </div>
    </main>
  );
}
