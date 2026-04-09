import { PORTFOLIO_URL } from 'config'
import { Link } from '@tanstack/react-router'
import React from 'react'

const Footer = () => {
  return (
    <footer className='w-full bg-primary-background text-center py-4 text-sm text-gray-500'>
      <div>
        <Link to={PORTFOLIO_URL} className='mx-2 hover:underline'>About Us</Link>
        <Link to='/pricing' className='mx-2 hover:underline'>Pricing</Link>
        <Link to='/privacy-policy' className='mx-2 hover:underline'>Privacy Policy</Link>
        <Link to='/terms-condition' className='mx-2 hover:underline'>Terms and Conditions</Link>
        <Link to='/refund-policy' className='mx-2 hover:underline'>Refund Policy</Link>
      </div>
      <p>&copy; {new Date().getFullYear()} Fuse. All rights reserved.</p>
    </footer>
  )
}

export default Footer