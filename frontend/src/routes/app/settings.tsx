import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='flex-1'>Hello "/app/settings"!</div>
}
