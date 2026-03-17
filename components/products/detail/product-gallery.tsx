"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Reset index when images change (e.g. variant change). Parent should use key so we remount.
  useEffect(() => {
    setSelectedImageIndex(0);
  }, []);

  const currentImage = images[selectedImageIndex] || images[0] || "/placeholder.jpg";

  return (
    <div className="space-y-4">
      <div className="border-border/50 group relative aspect-square overflow-hidden rounded-3xl border bg-gray-50 text-center">
        <Image
          src={currentImage}
          alt={productName}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <button
          type="button"
          aria-label={`Yêu thích ${productName}`}
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-xl transition-all hover:scale-110 hover:text-red-500"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-4">
          {images.map((img: string, index: number) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                selectedImageIndex === index
                  ? "border-primary ring-primary/20 ring-2"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
