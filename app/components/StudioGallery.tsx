"use client"

type Props = {
  photoUrls: string[]
  name: string
}

export function StudioGallery({ photoUrls, name }: Props) {
  if (!photoUrls.length) return null

  return (
    <div className="grid grid-cols-2 gap-2">
      {photoUrls.map((url, i) => (
        <div key={i} className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img
            src={url}
            alt={`${name}, photo ${i + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}
