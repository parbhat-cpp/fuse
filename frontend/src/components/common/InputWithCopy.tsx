import React, { useState } from 'react'
import { FaCopy } from "react-icons/fa";
import { IoCheckmarkDone } from "react-icons/io5";

interface InputWithCopyProps {
    link: string;
}

const InputWithCopy = (props: InputWithCopyProps) => {
    const [copyDone, setCopyDone] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(props.link);

        setCopyDone(true);

        setTimeout(() => {
            setCopyDone(false);
        }, 2000);
    }

    return (
        <div className='flex justify-center'>
            <div className='flex-1 border py-1 my-auto px-2 cursor-not-allowed rounded-l-lg'>
                {props.link}
            </div>
            <div className='rounded-r-lg bg-primary-background p-2 text-white cursor-pointer' onClick={handleCopy}>
                {!copyDone ? <FaCopy /> : <IoCheckmarkDone />}
            </div>
        </div>
    )
}

export default InputWithCopy