import React from 'react'
import z from 'zod'
import Avatar from './Avatar'
import useAuth from '@/hooks/useAuth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import PrimaryButton from '@/components/common/PrimaryButton'
import { supabaseClient } from '@/supabase-client'
import toast from 'react-hot-toast'
import { API_URL } from 'config'
import { getToken } from '@/lib/utils'

const userUpdateSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters long').max(15, 'Username must be less than 16 characters long').regex(/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/igm, 'Username can only contain letters, numbers, and underscores'),
})

const User = () => {
  const currentUser = useAuth();

  const form = useForm<z.infer<typeof userUpdateSchema>>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      full_name: currentUser?.full_name || '',
      username: currentUser?.username || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof userUpdateSchema>) => {
    const full_name = values.full_name.trim();
    const username = values.username.trim();

    if (full_name === currentUser?.full_name && username === currentUser?.username) {
      return;
    }

    const { error } = await supabaseClient.from("profiles").update({ full_name, username }).eq('id', currentUser?.id);

    if (error) {
      toast.error('Error updating profile!');
    }

    const updatedUser = await supabaseClient.from('profiles').select(`id, username, full_name, email, avatar_url, created_at, updated_at`).eq('id', currentUser?.id).single();

    if (updatedUser.error) {
      toast.error('Error fetching updated profile!');
    } else {
      localStorage.setItem("currentUser", JSON.stringify(updatedUser.data));
      toast.success('Profile updated successfully!');
    }
  }

  const onAvatarUpload = async (url: string) => {
    const { error } = await supabaseClient.from("profiles").update({ avatar_url: url }).eq('id', currentUser?.id);

    if (error) {
      toast.error('Error updating avatar!');
    }
  }

  const deleteAccount = async () => {
    const deleteAccountUrl = `${API_URL}/user`;

    try {
      const response = await fetch(deleteAccountUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + getToken(),
        },
      });

      if (response.ok) {
        toast.success('Account deleted successfully!');
        localStorage.removeItem('currentUser');
        await supabaseClient.auth.signOut();
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        toast.error(`Error deleting account: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error(`Error deleting account: ${error.message || 'Unknown error'}`);
    } 
  }

  return (
    <div className='bg-white rounded-lg mx-auto p-5 sm:w-[60vw] w-[90vw] space-y-3'>
      <h1 className='text-2xl font-bold mb-4'>User Settings</h1>
      <Avatar
        uid={currentUser?.id}
        url={currentUser?.avatar_url}
        size={120}
        onUpload={onAvatarUpload}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3'>
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.full_name && <p>{form.formState.errors.full_name.message}</p>}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.username && <p>{form.formState.errors.username.message}</p>}
                </FormMessage>
              </FormItem>
            )}
          />
          <div className='flex items-center justify-between'>
            <PrimaryButton type='submit'>
              Update Profile
            </PrimaryButton>
            <PrimaryButton type='button' className='bg-red-500 hover:bg-red-600 text-white' onClick={deleteAccount}>
              Delete Account
            </PrimaryButton>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default User
