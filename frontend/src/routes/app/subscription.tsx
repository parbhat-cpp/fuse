import { Outlet, createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const PlanInfo = lazy(() => import('@/components/subscriptions/PlanInfo'))

export const Route = createFileRoute('/app/subscription')({
  component: RouteComponent,
})

function RouteComponent() {
  return <main className='relative overflow-auto'>
    <PlanInfo />
    <Outlet />
  </main>
}
