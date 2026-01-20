import BlurText from '@/components/animated/BlurText';
import ShinyText from '@/components/animated/ShinyText';
import Header from '@/components/common/Header';
import { supabaseClient } from '@/supabase-client';
import { getUserPlan } from '@/utils/subscription';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import React, { useEffect } from 'react';
import toast from 'react-hot-toast';

const Particles = React.lazy(() => import('@/components/animated/Particles'));

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleAuthState = params.get("googleauth");

    if (googleAuthState === "success") {
      handleGoogleAuth();
    } else if (googleAuthState === "failed") {
      const failedMessage = params.get("message");
      toast.error(failedMessage);
    }
  }, []);

  async function handleGoogleAuth() {
    try {
      const session = await supabaseClient.auth.getSession();
      const { data, error } = session;

      if (error) return;

      const user = data.session?.user;

      // get user profile
      const userResponse = await supabaseClient
        .from('profiles')
        .select(`id, username, full_name, email, avatar_url, created_at, updated_at`)
        .eq('id', user?.id)
        .single();
      
      await getUserPlan(user!.id);

      if (userResponse.error) {
        toast.error("Failed to get user data. Login again");
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(userResponse.data));

      navigate({
        to: "/app",
      });
    } catch (error) {
      toast.error("Failed to complete auth process");
    }
  }

  return (
    <main>
      <Header />
      <section className='relative h-screen bg-primary-background -mt-[92px] hero-gradient'>
        <div className='absolute top-0 left-0 h-full w-full flex flex-col justify-center items-center gap-8 text-center'>
          <BlurText
            text="One stop destination to k!ll your boredom"
            delay={150}
            animateBy="words"
            direction="top"
            as='h1'
            className="lg:text-6xl text-5xl text-primary-headline font-bold lg:w-[50vw] w-[70vw] flex justify-center"
          />
          <ShinyText
            text="It's more than just a video call platform. It's a place for everyone to connect and chill together"
            disabled={false}
            speed={3}
            className='md:text-3xl text-xl lg:w-[50vw] w-[75vw]'
          />
        </div>
        <Particles
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </section>
    </main>
  )
}
