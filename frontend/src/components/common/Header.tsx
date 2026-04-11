import { Link, useNavigate } from '@tanstack/react-router'
import PrimaryButton from './PrimaryButton'
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '../ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import { HiOutlineMenuAlt4 } from "react-icons/hi";
import { AiOutlineClose } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import useAuth from '@/hooks/useAuth';
import { supabaseClient } from '@/supabase-client';
import { PORTFOLIO_URL, REPOSITORY_URL } from 'config';

export default function Header() {
  const user = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignin = async () => {
    try {
      await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  }

  return (
    <nav className="sticky top-0 left-0 z-50">
      <div className='md:px-12 px-8 py-4 bg-transparent grid md:grid-cols-3 grid-cols-2 shadow-xl items-center mt-5 mx-auto lg:w-[65vw] w-[90vw] rounded-full backdrop-blur-md'>
        <img src="/logo.png" alt="Fuse Logo" className='h-[40px] w-[40px]' />
        <div className='mx-auto md:flex hidden gap-3 text-lg whitespace-nowrap'>
          <Link to={PORTFOLIO_URL}>
            About us
          </Link>
          <Link to={REPOSITORY_URL}>
            GitHub
          </Link>
          <Link to='/pricing'>
            Pricing
          </Link>
        </div>
        <div className='ml-auto flex items-center gap-3'>
          <Dialog>
            <DialogTrigger>
              <div className='text-secondary-background border border-secondary-background px-3 py-1 rounded-lg hover:text-primary hover:bg-secondary-background cursor-pointer' onClick={() => user && navigate({ to: "/app" })}>
                {user ? "Open App" : "Login"}
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <h4 className='text-center'>
                  Login
                </h4>
              </DialogHeader>
              <div>
                <PrimaryButton className='w-full flex items-center justify-center gap-3' onClick={handleGoogleSignin}>
                  <FcGoogle size={25} /> Continue with Google
                </PrimaryButton>
              </div>
            </DialogContent>
          </Dialog>
          <Drawer direction='right'>
            <DrawerTrigger>
              <div className='md:hidden block text-primary-headline cursor-pointer'>
                <HiOutlineMenuAlt4 size={34} />
              </div>
            </DrawerTrigger>
            <DrawerContent className='bg-primary-background'>
              <DrawerHeader>
                <DrawerTitle>
                  <DrawerClose>
                    <button className='text-primary-headline cursor-pointer'>
                      <AiOutlineClose />
                    </button>
                  </DrawerClose>
                </DrawerTitle>
              </DrawerHeader>
              <div className='p-5 flex flex-col gap-4 text-xl'>
                <DrawerClose className='self-start'>
                  <Link to={PORTFOLIO_URL}>
                    About us
                  </Link>
                </DrawerClose>
                <DrawerClose className='self-start'>
                  <Link to={REPOSITORY_URL}>
                    GitHub
                  </Link>
                </DrawerClose>
                <DrawerClose className='self-start'>
                  <Link to='/pricing'>
                    Pricing
                  </Link>
                </DrawerClose>
                <DrawerClose className='self-start'>
                  <Link to='/terms-condition'>
                    Terms & Conditions
                  </Link>
                </DrawerClose>
                <DrawerClose className='self-start'>
                  <Link to='/privacy-policy'>
                    Privacy Policy
                  </Link>
                </DrawerClose>
                <DrawerClose className='self-start'>
                  <Link to='/refund-policy'>
                    Refund Policy
                  </Link>
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </nav>
  )
}
