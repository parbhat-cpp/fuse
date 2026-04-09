import Footer from '@/components/common/Footer'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/terms-condition')({
  component: RouteComponent,
})

function RouteComponent() {
  return <main className='bg-primary-light-bg'>
    <section className='px-10 py-7 text-secondary space-y-5'>
      <h1 className='text-center mx-auto'>Terms and Conditions</h1>
      <p>
        By accessing or using our service, you agree to be bound by these terms and conditions. If you do not agree to these terms, please do not use our service.
      </p>

      <h3>
        Intellectual Property
      </h3>

      <p>
        All content included on this site, such as text, graphics, logos, images, and software, is the property of our company or its content suppliers and protected by international copyright laws.
      </p>

      <h3>
        User Conduct
      </h3>

      <p>
        You agree to use our service only for lawful purposes and not to engage in any conduct that may harm our service or other users.
      </p>

      <h3>
        Limitation of Liability
      </h3>

      <p>
        We are not liable for any damages arising out of or in connection with your use of our service.
      </p>

      <h3>
        Changes to Terms
      </h3>

      <p>
        We reserve the right to modify these terms at any time. Your continued use of our service after any changes indicates your acceptance of the new terms.
      </p>

      <h3>
        Contact Us
      </h3>

      <p>
        If you have any questions about these terms, please contact us at parbhats660@gmail.com
      </p>
    </section>
    <Footer />
  </main>
}
