import React from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'

interface MembersDrawerProps {
    children: React.ReactNode;
    members: string[]; // storing member data as string of json
    admin: Record<string, any>;
}

const MembersDrawer = (props: MembersDrawerProps) => {
    return (
        <Drawer direction='right'>
            <DrawerTrigger asChild>
                {props.children}
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Members</DrawerTitle>
                    </DrawerHeader>
                    <div>
                        <div>
                            <img src={props.admin?.['avatar_url']} />
                            <p>{props.admin?.['username'] ?? props.admin?.['full_name']} (Admin)</p>
                        </div>
                        {
                            props.members?.map((member: string, index: number) => {
                                const memberData = JSON.parse(member);

                                return <div key={memberData['id']}>
                                    <img src={memberData['avatar_url']} />
                                    <p>{memberData['username'] ?? memberData['full_name']}</p>
                                </div>
                            })
                        }
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

export default MembersDrawer