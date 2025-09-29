import React from 'react';
import { SignupPayload, useSignup } from '@/queries/user.queries'
import { signupUserSchema } from '@/schema/user.schema';
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import PrimaryButton from '../common/PrimaryButton';

const SignupForm = (props: { setAuthDialogState: (state: "Sign up" | "Log in") => void; }) => {
  const signup = useSignup();

  const { register, handleSubmit, formState: { errors, isLoading } } = useForm<SignupPayload>({
    resolver: zodResolver(signupUserSchema),
  });

  return (
    <form onSubmit={handleSubmit((data) => signup.mutate(data))} className='space-y-3'>
      <div>
        <label htmlFor='fullname'>Fullname</label>
        <Input {...register("fullname")} placeholder='John Doe' id='fullname' disabled={isLoading} />
        {errors.fullname && <p>{errors.fullname.message}</p>}
      </div>
      <div>
        <label htmlFor='username'>Username</label>
        <Input {...register("username")} placeholder='john.doe123' id='username' disabled={isLoading} />
        {errors.username && <p>{errors.username.message}</p>}
      </div>
      <div>
        <label htmlFor='email'>Email</label>
        <Input {...register("email")} placeholder='john.doe@mail.com' id='email' disabled={isLoading} />
        {errors.email && <p>{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor='password'>Password</label>
        <Input {...register("password")} placeholder='StrongPassword#45' id='password' disabled={isLoading} type='password' />
        {errors.password && <p>{errors.password.message}</p>}
      </div>
      <PrimaryButton className='w-full' type='submit' disabled={isLoading}>
        Sign up
      </PrimaryButton>
      <p className='mx-auto'>
        Already have an account? <span className='text-blue-400 underline cursor-pointer' onClick={() => props.setAuthDialogState("Log in")}>Login</span>
      </p>
    </form>
  )
}

export default SignupForm
