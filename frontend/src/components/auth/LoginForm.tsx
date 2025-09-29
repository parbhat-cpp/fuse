import { LoginPayload, useLogin } from '@/queries/user.queries';
import { loginUserSchema } from '@/schema/user.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react'
import { useForm } from 'react-hook-form';
import { Input } from '../ui/input';
import PrimaryButton from '../common/PrimaryButton';

const LoginForm = (props: { setAuthDialogState: (state: "Sign up" | "Log in") => void; }) => {
    const login = useLogin();

    const { register, handleSubmit, formState: { errors, isLoading } } = useForm<LoginPayload>({
        resolver: zodResolver(loginUserSchema),
    });

    return (
        <form onSubmit={handleSubmit((data) => login.mutate(data))} className='space-y-3'>
            <div>
                <label htmlFor='email'>Email</label>
                <Input {...register('email')} id='email' placeholder='john.doe@mail.com' disabled={isLoading} />
                {errors.email && <p>{errors.email.message}</p>}
            </div>
            <div>
                <label htmlFor='password'>Password</label>
                <Input {...register('password')} id='password' placeholder='StrongPassword#45' type='password' disabled={isLoading} />
                {errors.password && <p>{errors.password.message}</p>}
            </div>
            <PrimaryButton className='w-full' disabled={isLoading}>
                Log in
            </PrimaryButton>
            <p>
                New here? <span className='text-blue-400 underline cursor-pointer' onClick={() => props.setAuthDialogState("Sign up")}>Register</span>
            </p>
        </form>
    )
}

export default LoginForm