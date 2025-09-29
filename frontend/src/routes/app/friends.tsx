import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/friends')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='flex-1'>Hello "/app/friends"!</div>
}
