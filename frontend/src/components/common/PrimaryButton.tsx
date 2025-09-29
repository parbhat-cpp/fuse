import clsx from 'clsx';
import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    // add fields
}

const PrimaryButton = (props: PrimaryButtonProps) => {
  const defaultStyle = "cursor-pointer bg-primary-button text-primary-button-text px-4 py-2 rounded-full font-bold";
  const { className, ...filteredProps } = props;

  return (
    <button className={clsx(defaultStyle, className)} {...filteredProps}>
        {props.children}
    </button>
  )
}

export default PrimaryButton