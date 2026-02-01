"use client"

import React, { useEffect, useState } from 'react'
import { FaInfoCircle } from "react-icons/fa";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { getUserPlan } from '@/utils/subscription';
import { useQuery } from '@tanstack/react-query';
import { SUBSCRIPTION_URL } from 'config';
import { getToken, toLocalDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const PlanInfo = () => {
    const [currentPlan] = useState(JSON.parse(localStorage.getItem('currentPlan') || '{}'));
    const [currentUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{}'));

    const currentPlanUsage = useQuery({
        queryKey: ['current-plan-usage'],
        queryFn: fetchCurrentPlanUsage,
    });

    const previousPlanUsage = useQuery({
        queryKey: ['previous-plan-usage'],
        queryFn: fetchPreviousPlanUsage,
    });

    const previousSubscription = useQuery({
        queryKey: ['previous-subscription'],
        queryFn: fetchPreviousSubscription,
    });

    async function fetchCurrentPlanUsage() {
        try {
            const response = await fetch(`${SUBSCRIPTION_URL}/usage/current`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return response.json();
        } catch (error) {
            toast.error('Failed to fetch current plan usage');
            return {};
        }
    }

    async function fetchPreviousPlanUsage() {
        try {
            const response = await fetch(`${SUBSCRIPTION_URL}/usage/previous`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return response.json();
        } catch (error) {
            toast.error('Failed to fetch previous plan usage');
            return {};
        }
    }

    async function fetchPreviousSubscription() {
        try {
            const response = await fetch(`${SUBSCRIPTION_URL}/usage/previous-subscription`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return response.json();
        } catch (error) {
            toast.error('Failed to fetch previous subscription');
            return {};
        }
    }

    useEffect(() => {
        if (!currentPlan) {
            getUserPlan(currentUser.id);
            return;
        }
    }, []);

    return (
        <div className='absolute top-4 right-4'>
            <Drawer>
                <DrawerTrigger asChild>
                    <button>
                        <FaInfoCircle size={26} />
                    </button>
                </DrawerTrigger>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-sm overflow-y-auto">
                        <DrawerHeader>
                            <DrawerTitle>Subscription Info</DrawerTitle>
                            <DrawerDescription>See your current subscription details and options.</DrawerDescription>
                        </DrawerHeader>
                        <div className="space-y-4 mt-4">
                            {/* Current Plan Usage */}
                            <h3>Current Plan Usage ({currentPlanUsage.data?.PlanType})</h3>
                            {
                                currentPlanUsage.isLoading ? (
                                    <p>Loading...</p>
                                ) : currentPlanUsage.data ? (
                                    <>
                                        {
                                            <div className="border rounded-md p-3 bg-accent/10 space-y-2">
                                                <p>ID: {currentPlanUsage.data.ID}</p>
                                                <p>Valid from: {toLocalDate(currentPlanUsage.data.ValidFrom)}</p>
                                                <p>Valid to: {toLocalDate(currentPlanUsage.data.ValidUntil)}</p>
                                                <div>
                                                    {Object.entries(currentPlanUsage.data.Usage).map(([key, value]) => (
                                                        <p key={key}>{key.split("_").join(" ")}: {value}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        }
                                    </>
                                ) : (
                                    <p>No data available.</p>
                                )
                            }
                            {/* Previous Subscription Usage */}
                            <h3>Previous Subscription Usage</h3>
                            {
                                previousPlanUsage.isLoading ? (
                                    <p>Loading...</p>
                                ) : previousPlanUsage.data ? (
                                    <div className='space-y-3'>
                                        {
                                            previousPlanUsage.data
                                                .filter(prevPlanUsage => prevPlanUsage.ID !== currentPlanUsage.data?.ID)
                                                .map((prevPlanUsage, index) => (
                                                    <div key={prevPlanUsage.ID} className="border rounded-md p-3 bg-accent/10 space-y-2">
                                                        <h4>Subscription {index + 1} ({prevPlanUsage.PlanType ?? 'Free'})</h4>
                                                        <p>ID: {prevPlanUsage.ID}</p>
                                                        <p>Valid from: {toLocalDate(prevPlanUsage.ValidFrom)}</p>
                                                        <p>Valid to: {toLocalDate(prevPlanUsage.ValidUntil)}</p>
                                                        <p>Usage:</p>
                                                        <div>
                                                            {Object.entries(prevPlanUsage.Usage).map(([key, value]) => (
                                                                <p key={key}>{key.split("_").join(" ")}: {value}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                        }
                                    </div>
                                ) : (
                                    <p>No data available.</p>
                                )
                            }
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

        </div>
    )
}

export default PlanInfo
