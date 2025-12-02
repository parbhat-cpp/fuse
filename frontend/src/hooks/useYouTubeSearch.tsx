import { YOUTUBE_API_KEY } from 'config'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const youtubeSearchApi = 'https://www.googleapis.com/youtube/v3/search'
const maxResults = 15

const useYouTubeSearch = () => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loadNext, setLoadNext] = useState<string>('')
  const [triggerLoadNext, setTriggerLoadNext] = useState<boolean>(false)
  const [searchResults, setSearchResults] = useState<
    Array<Record<string, any>>
  >([])

  async function handleYoutubeSearch(query: string) {
    let searchUrl = `${youtubeSearchApi}?key=${YOUTUBE_API_KEY}&q=${query}&maxResults=${maxResults}&type=video&part=snippet`

    if (loadNext && triggerLoadNext) searchUrl += `&pageToken=${loadNext}`
    if (!loadNext) setSearchResults([])

    const searchResponse = await fetch(searchUrl)

    if (searchResponse.ok) {
      const searchJson = await searchResponse.json()
      setLoadNext(searchJson.nextPageToken)
      setSearchResults((prev) => [...prev, ...searchJson.items])
      setTriggerLoadNext(false)
    } else {
      toast.error('Cannot request for videos')
    }
  }

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (!searchQuery) {
        setSearchResults([])
        setLoadNext('')
        return
      }
      await handleYoutubeSearch(searchQuery)
    }, 300)

    return () => {
      clearTimeout(searchTimer)
    }
  }, [searchQuery, triggerLoadNext])

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    triggerLoadNext,
    setTriggerLoadNext,
  }
}

export default useYouTubeSearch
