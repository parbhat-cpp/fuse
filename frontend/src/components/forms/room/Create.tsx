import React, { useEffect, useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { ChevronDownIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import PrimaryButton from '@/components/common/PrimaryButton';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

const createRoomSchema = z.object({
  isPublic: z.boolean().default(true),
  roomId: z.string().min(5).optional(),
  roomName: z.string().min(5),
});

interface CreateRoomFormProps {
  onSubmit: (roomName: string, roomId: string | undefined, isPublic: boolean, startAt: Date | undefined) => void;
};

const Create = (props: CreateRoomFormProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");

  useEffect(() => {
    const date = new Date();
    setTime(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`);
  }, []);

  const form = useForm<z.infer<typeof createRoomSchema>>({
    resolver: zodResolver(createRoomSchema),
  });

  function onSubmit(values: z.infer<typeof createRoomSchema>) {
    const [hrs, mins, secs] = time.split(":").map(Number);

    date?.setHours(hrs);
    date?.setMinutes(mins);
    date?.setSeconds(secs);

    props.onSubmit(values.roomName, values.roomId, values.isPublic, date);

    form.reset({
      isPublic: true,
      roomId: "",
      roomName: "",
    });
    setDate(undefined);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3'>
        <FormField
          control={form.control}
          name="roomName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Name</FormLabel>
              <FormControl>
                <Input placeholder="My Den" {...field} />
              </FormControl>
              <FormMessage>
                {form.formState.errors.roomName && <p>{form.formState.errors.roomName.message}</p>}
              </FormMessage>
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Public</FormLabel>
                <FormDescription>
                  Makes room publically accessible
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  defaultChecked
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <h6>Schedule Date & Time (Optional)</h6>
        <div className="flex gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="date-picker" className="px-1">
              Date
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date-picker"
                  className="w-32 justify-between font-normal"
                >
                  {date ? date.toLocaleDateString() : "Select date"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  captionLayout="dropdown"
                  disabled={(date) => {
                    const today = new Date();
                    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
                    const after15Days = new Date(startOfToday);
                    after15Days.setDate(after15Days.getDate() + 15);

                    return date < startOfToday || date > after15Days;
                  }}
                  onSelect={(date) => {
                    setDate(date)
                    setOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="time-picker" className="px-1">
              Time
            </Label>
            <Input
              type="time"
              id="time-picker"
              step="1"
              defaultValue={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
          </div>
        </div>

        <PrimaryButton type='submit'>
          Create Room
        </PrimaryButton>
      </form>
    </Form>
  )
}

export default Create