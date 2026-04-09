import Footer from '@/components/common/Footer'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/refund-policy')({
  component: RouteComponent,
})

function RouteComponent() {
  return <main className='bg-primary-light-bg'>
    <section className='px-10 py-7 h-screen text-secondary space-y-5'>
      <h1 className='text-center mx-auto'>Refund Policy</h1>
      <p>
        Our policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately we can’t offer you a refund or exchange.
      </p>
      <p>
        Refunds (if applicable)
      </p>

      <p>
        The refund amount will be credited back to the original method of payment within a certain amount of days, depending on your card issuer's policies.
      </p>
    </section>
    <Footer />
  </main>
}
