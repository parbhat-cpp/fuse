import { supabaseClient } from '@/supabase-client';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/auth/callback/')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const { data: { session }, error } = await supabaseClient.auth.getSession();

            if (error || !session) {
                window.location.href = window.location.origin + "?googleauth=failed";
            } else {
                window.location.href = window.location.origin + "?googleauth=success";
            }
        })();
    }, []);

    return <div>Hello "/auth/callback/"!</div>
}
