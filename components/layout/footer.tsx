export default function Footer() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="max-w-3xl mx-auto p-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Coherenceism
      </div>
    </footer>
  )
}
