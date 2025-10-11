import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import PrimaryButton from '@/components/common/PrimaryButton';

const joinRoomSchema = z.object({
    roomId: z.string().min(5),
});

interface JoinRoomFormProps {
    onSubmit: (roomId: string) => void;
}

const Join = (props: JoinRoomFormProps) => {
    const form = useForm<z.infer<typeof joinRoomSchema>>({
        resolver: zodResolver(joinRoomSchema),
    });

    function onSubmit(values: z.infer<typeof joinRoomSchema>) {
        props.onSubmit(values.roomId);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3'>
                <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Room ID</FormLabel>
                            <FormControl>
                                <Input placeholder="XYZ123" {...field} />
                            </FormControl>
                            <FormMessage>
                                {form.formState.errors.roomId && <p>{form.formState.errors.roomId.message}</p>}
                            </FormMessage>
                        </FormItem>
                    )}
                />

                <PrimaryButton type='submit'>
                    Join Room
                </PrimaryButton>
            </form>
        </Form>
    )
}

export default Join