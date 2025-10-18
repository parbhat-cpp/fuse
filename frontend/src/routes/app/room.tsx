import useAuth from '@/hooks/useAuth';
import { roomData } from '@/store/room';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createFileRoute('/app/room')({
  component: RouteComponent,
})

function RouteComponent() {
  useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomData.state) {
      navigate({
        to: "/app",
      });
    }
  }, []);

  return <main>
    <Outlet />
  </main>
}
