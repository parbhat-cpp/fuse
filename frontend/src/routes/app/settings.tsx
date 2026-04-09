import User from '@/components/forms/settings/user/User'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/settings')({
  ssr: false,
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='flex-1 flex justify-center items-center'>
    <User />
  </div>
}
