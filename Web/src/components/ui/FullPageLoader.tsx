export function FullPageLoader() {
  return (
    <main className="page-loader" aria-live="polite" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      <span>Preparing your ride…</span>
    </main>
  )
}
