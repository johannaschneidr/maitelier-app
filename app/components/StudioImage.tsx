"use client"

import { useState } from "react"

type Props = {
  slug: string
  name: string
  fallbackUrl?: string
  imgClassName?: string
  placeholderClassName?: string
}

export function StudioImage({ slug, name, fallbackUrl, imgClassName, placeholderClassName }: Props) {
  const [src, setSrc] = useState(`/studios/${slug}.jpg`)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={placeholderClassName}>
        <span className="text-2xl text-zinc-300 dark:text-zinc-600">&#10022;</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      className={imgClassName}
      onError={() => {
        if (fallbackUrl && src !== fallbackUrl) {
          setSrc(fallbackUrl)
        } else {
          setFailed(true)
        }
      }}
    />
  )
}
