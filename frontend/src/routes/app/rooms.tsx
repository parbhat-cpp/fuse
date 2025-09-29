import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/rooms')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='flex-1'>Hello "/app/rooms"!</div>
}
