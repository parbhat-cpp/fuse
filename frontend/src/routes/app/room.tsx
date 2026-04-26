import useAuth from '@/hooks/useAuth';
import { roomData } from '@/store/room';
import { createFileRoute, Outlet, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createFileRoute('/app/room')({
  ssr: false,
  component: RouteComponent,
})

function RouteComponent() {
  useAuth();
  const navigate = useNavigate();

  const { roomId } = useSearch({ from: '/app/room/' });

  useEffect(() => {
    if (!roomData.state && !roomId) {
      navigate({
        to: "/app",
      });
    }
  }, []);

  return <main>
    <Outlet />
  </main>
}
