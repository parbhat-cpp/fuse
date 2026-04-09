import React from 'react'

const Footer = () => {
  return (
    <footer className='w-full bg-primary-background text-center py-4 text-sm text-gray-500'>
      <div>
        <a href='/about' className='mx-2 hover:underline'>About Us</a>
        <a href='/contact' className='mx-2 hover:underline'>Contact</a>
        <a href='/privacy' className='mx-2 hover:underline'>Privacy Policy</a>
      </div>
      <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
    </footer>
  )
}

export default Footer