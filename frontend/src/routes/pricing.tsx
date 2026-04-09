import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { BASE_URL } from 'config';
import { TiTick } from 'react-icons/ti';
import Footer from '@/components/common/Footer';

export const Route = createFileRoute('/pricing')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    data,
  } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: fetchPricingPlans,
  });

  async function fetchPricingPlans() {
    try {
      const plansUrl = `${BASE_URL}/pricing`;

      const response = await fetch(plansUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch pricing plans');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      toast.error('Unable to load pricing plans. Please try again later.');
      return null;
    }
  }

  return <main className='bg-primary-light-bg'>
    <section className='px-10 py-7'>
      <h2 className='font-bold text-center mb-10 text-secondary'>Pricing Plans</h2>
      <div className='grid lg:grid-cols-3 sm:grid-cols-2 justify-center gap-5 h-screen text-white'>
        {Object.keys(data?.plans || {}).map((planKey) => {
          const plan = data.plans[planKey];
          return <div key={planKey} className='p-3 rounded-lg flex flex-col justify-between space-y-5 bg-black/20'>
            <div className='space-y-5'>
              <div className='space-x-1'>
                <span className='text-4xl font-semibold'>
                  &#8377; {plan.Price}
                </span>
                <span className='text-secondary'> /month</span>
              </div>
              <div className='space-y-2'>
                <p className='flex text-3xl font-bold justify-between'>{plan.Name}</p>
                <p className='text-secondary'>{plan.Description}</p>
              </div>
              <ul className=''>
                {plan.Features.map((feature: string, index: number) => (
                  <li key={index} className='text-secondary grid grid-cols-[20px_1fr] space-x-2'>
                    <TiTick className='text-green-500 mt-1' />
                    <p>{feature}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        })}
      </div>
    </section>
    <Footer />
  </main>
}
