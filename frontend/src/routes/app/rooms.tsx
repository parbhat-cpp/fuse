import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PublicRooms from '@/components/rooms/PublicRooms'
import MyScheduledRooms from '@/components/rooms/MyScheduledRooms'

export const Route = createFileRoute('/app/rooms')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex-1 flex justify-center items-center">
      <div className="md:w-[60vw] sm:w-[70vw] w-[95vw] md:p-7 p-4 bg-white rounded-xl space-y-3">
        <Tabs defaultValue="public-rooms">
          <TabsList className="h-10">
            <TabsTrigger value="public-rooms" className="text-md px-4">
              Public Rooms
            </TabsTrigger>
            <TabsTrigger value="my-scheduled-rooms" className="text-md px-4">
              My Scheduled Rooms
            </TabsTrigger>
          </TabsList>
          <TabsContent value="public-rooms">
            <PublicRooms />
          </TabsContent>
          <TabsContent value="my-scheduled-rooms">
            <MyScheduledRooms />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
