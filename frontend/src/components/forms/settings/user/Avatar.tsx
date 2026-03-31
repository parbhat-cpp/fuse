'use client'
import { supabaseClient } from '@/supabase-client'
import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { IoIosPerson } from "react-icons/io"

export default function Avatar({
  uid,
  url,
  size,
  onUpload,
}: {
  uid: string | null
  url: string | null
  size: number
  onUpload: (url: string) => void
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        const { data, error } = await supabaseClient.storage.from('avatars').download(path)
        if (error) {
          throw error
        }

        const url = URL.createObjectURL(data)
        setAvatarUrl(url)
      } catch (error) {
        console.log('Error downloading image: ', error)
      }
    }

    if (url) downloadImage(url)
  }, [url, supabaseClient])

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      onUpload(filePath)
    } catch (error) {
      toast.error('Error uploading avatar!')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {!avatarUrl ? (
        <div>
          <IoIosPerson size={30} className="text-gray-300" />
        </div>
      ) : (
        <img
          width={size}
          height={size}
          src={avatarUrl}
          alt="Avatar"
          className="rounded-t-md"
          style={{ height: size, width: size }}
        />
      )}
      <div style={{ width: size }}>
        <label className={clsx("text-white bg-black rounded-b-md w-full p-1 flex items-center", `min-w-[${size}px]`)} htmlFor="single">
          <p className='m-auto'>{uploading ? 'Uploading ...' : 'Upload'}</p>
        </label>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  )
}