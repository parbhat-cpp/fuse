import { Button } from '@/components/ui/button';
import { getToken } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { RAZORPAY_KEY_ID, SUBSCRIPTION_URL } from 'config';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { TiTick } from "react-icons/ti";

export const Route = createFileRoute('/app/subscription')({
  component: RouteComponent,
})

function RouteComponent() {
  const [currentPlan] = useState(JSON.parse(localStorage.getItem("currentPlan")!));
  const [currentUser] = useState(JSON.parse(localStorage.getItem("currentUser")!));

  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: handleGetPlans,
  });

  async function handleGetPlans() {
    try {
      const plansResponse = await fetch(`${SUBSCRIPTION_URL}/payment/plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!plansResponse.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data = await plansResponse.json();
      return data.plans;
    } catch (error) {
      toast.error('Failed to fetch subscription plans');
      return {};
    }
  }

  async function handlePlanUpgrade(plan_type: string) {
    try {
      const orderResponse = await fetch(`${SUBSCRIPTION_URL}/payment/initialize?plan_type=${plan_type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to initialize payment');
      }

      const orderData = await orderResponse.json();

      console.log(orderData.order);
      console.log(orderData.plan);

      const options = {
        "key": RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
        "amount": orderData.plan.Price, // Amount is in currency subunits.
        "currency": "INR",
        "name": "Fuse", //your business name
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": orderData.order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": async function (response) {
          const verifyResponse = await fetch(`${SUBSCRIPTION_URL}/payment/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
              user_id: currentUser.id,
              order_id: orderData.order.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_type,
            }),
          });

          console.log(verifyResponse);

          if (!verifyResponse.ok) {
            throw new Error('Payment verification failed');
          }

          const verifyData = await verifyResponse.json();
          console.log(verifyData);
          // localStorage.setItem("currentPlan", JSON.stringify(verifyData.currentPlan));
          toast.success('Plan upgraded successfully');
        },
        "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information, especially their phone number
          "name": "Gaurav Kumar", //your customer's name
          "email": "gaurav.kumar@example.com",
          "contact": "+919876543210"  //Provide the customer's phone number for better conversion rates 
        },
        "notes": {
          "address": "Razorpay Corporate Office"
        },
        "theme": {
          "color": "#3399cc"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.log(error);

      toast.error('Failed to upgrade plan');
    }
  }

  return <div className='flex-1 p-10 flex justify-center items-center'>
    <div className='relative bg-white p-5 rounded-xl grid grid-cols-3 gap-12'>
      {Object.keys(plans.data || {}).map((planKey) => {
        const plan = plans.data[planKey];
        const isCurrentPlan = currentPlan.plan_type === planKey;

        return <div key={planKey} className='p-3 rounded-lg flex flex-col justify-between space-y-5 w-64'>
          <div className='space-y-5'>
            <div className='space-x-1'>
              <span className='text-4xl font-semibold'>
                &#8377; {plan.Price}
              </span>
              <span className='text-gray-600'> /month</span>
            </div>
            <div className='space-y-2'>
              <p className='flex text-3xl font-bold justify-between'>{plan.Name}</p>
              <p className='text-gray-600'>{plan.Description}</p>
            </div>
            <ul className=''>
              {plan.Features.map((feature: string, index: number) => (
                <li key={index} className='text-gray-700 grid grid-cols-[20px_1fr] space-x-2'>
                  <TiTick className='text-green-500 mt-1' />
                  <p>{feature}</p>
                </li>
              ))}
            </ul>
          </div>
          <Button disabled={isCurrentPlan} className='mt-auto' onClick={() => handlePlanUpgrade(planKey)}>
            {isCurrentPlan ? 'Current Plan' : `Upgrade to ${plan.Name}`}
          </Button>
        </div>
      })}
    </div>
  </div>
}
