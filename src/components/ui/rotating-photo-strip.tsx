'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

type Photo = {
  src: string
  alt: string
  position?: string
}

const photoSets: Photo[][] = [
  [
    { src: '/images/hunting/chad_and_scott_cuchara.JPG', alt: 'Hunters in the field', position: 'object-center' },
    { src: '/images/fishing/gabe_halibut.JPG', alt: 'Halibut fishing crew', position: 'object-[center_30%]' },
    { src: '/images/exploring/gabe_pilot.JPG', alt: 'Flying over mountains', position: 'object-[center_30%]' },
  ],
  [
    { src: '/images/hunting/on_the_hunt.JPG', alt: 'On the hunt', position: 'object-center' },
    { src: '/images/fishing/homer_raft_fishing.JPG', alt: 'Raft fishing in Homer', position: 'object-center' },
    { src: '/images/exploring/bear_lake.JPG', alt: 'Bear Lake', position: 'object-center' },
  ],
  [
    { src: '/images/hunting/cuchara_main_view.JPG', alt: 'Cuchara mountain view', position: 'object-center' },
    { src: '/images/fishing/chris_silver_salmon.JPG', alt: 'Silver salmon catch', position: 'object-center' },
    { src: '/images/fishing/scott_river_alaska.JPG', alt: 'River fishing in Alaska', position: 'object-center' },
  ],
]

const INTERVAL_MS = 5000

export function RotatingPhotoStrip() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % photoSets.length)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl overflow-hidden">
      {[0, 1, 2].map(slot => (
        <div key={slot} className="relative aspect-[4/3]">
          {photoSets.map((set, setIdx) => (
            <Image
              key={set[slot].src}
              src={set[slot].src}
              alt={set[slot].alt}
              fill
              className={`object-cover ${set[slot].position ?? 'object-center'} transition-opacity duration-1000 ${
                setIdx === activeIndex ? 'opacity-100' : 'opacity-0'
              }`}
              priority={setIdx === 0}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
