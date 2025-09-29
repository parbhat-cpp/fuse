import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { BASE_URL } from 'config';
import toast from 'react-hot-toast';

export type SignupPayload = {
    username: string;
    email: string;
    fullname: string;
    password: string;
}

export type LoginPayload = {
    email: string;
    password: string;
}

export const signupUser = async (payload: SignupPayload) => {
    const res = await fetch(`${BASE_URL}/user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: "include",
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error);
    }

    const userData = responseData.data;

    return userData;
}

export const loginUser = async (payload: LoginPayload) => {
    const res = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: "include",
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.error);
    }

    const userData = responseData.data;

    return userData;
}

export const useSignup = () => {
    const navigate = useNavigate();
    
    return useMutation({
        mutationFn: signupUser,
        onSuccess: (data) => {
            localStorage.setItem("currentUser", JSON.stringify(data));
            navigate({
                to: "/app",
            });
        },
        onError(error, _, __) {
            toast.error(error.message);
        },
    });
}

export const useLogin = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            localStorage.setItem("currentUser", JSON.stringify(data));
            navigate({
                to: "/app",
            });
        },
        onError(error, _, __) {
            toast.error(error.message);
        },
    });
}
