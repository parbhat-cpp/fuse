import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div className='flex-1'>Hello "/app/"!</div>
}
