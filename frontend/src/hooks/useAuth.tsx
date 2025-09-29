import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

const useAuth = () => {
    const [user] = useState(localStorage.getItem("currentUser"));
    const navigate = useNavigate();

    if (!user) {
        if (window.location.pathname === "/") return;

        navigate({
            to: "/",
        });
        return;
    }

    try {
        return JSON.parse(user);
    } catch (e) {
        return null;
    }
}

export default useAuth