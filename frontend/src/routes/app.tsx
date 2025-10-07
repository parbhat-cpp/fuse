import { Outlet, createFileRoute } from '@tanstack/react-router'
import useAuth from '@/hooks/useAuth';
import Sidebar from '@/components/app/Sidebar';
import Notification from '@/components/app/Notification';
import { IoIosLogOut } from "react-icons/io";
import PrimaryButton from '@/components/common/PrimaryButton';
import BottomNavigation from '@/components/app/BottomNavigation';
import SocketProvider from '@/socket';
import { BASE_URL } from 'config';

export const Route = createFileRoute('/app')({
    component: RouteComponent,
})

function RouteComponent() {
    const user = useAuth();

    return <SocketProvider config={{
        room: {
            url: `${BASE_URL}/room`,
        },
    }}>
        <div className="flex h-[100dvh]">
            <Sidebar />
            {/* Main content */}
            <main className="flex flex-col flex-1 bg-secondary-background">
                <header className='w-full bg-primary-background text-primary-paragraph px-5 py-3 flex justify-between'>
                    <h5>
                        Welcome, {user.full_name ?? ''}
                    </h5>
                    <div className='flex justify-center items-center gap-3'>
                        <Notification />
                        <PrimaryButton className='bg-red-400 sm:hidden block p-0'>
                            <IoIosLogOut size={28} />
                        </PrimaryButton>
                    </div>
                </header>
                <Outlet />
                <BottomNavigation />
            </main>
        </div>
    </SocketProvider>
}
