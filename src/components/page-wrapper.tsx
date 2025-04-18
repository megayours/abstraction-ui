export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-background to-blue-50/30 min-h-screen">
      <div className="container mx-auto max-w-screen-xl px-6 space-y-12">
        {children}
      </div>
    </section>
  )
}