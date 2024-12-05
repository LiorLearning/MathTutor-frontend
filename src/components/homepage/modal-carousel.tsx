"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import productImage1 from '@/public/product/chat1.png';
import productImage2 from '@/public/product/img1.png';
import productImage3 from '@/public/product/img2.png';
import productImage4 from '@/public/product/game1.png';
import productImage5 from '@/public/product/game2.png';

export default function ModalCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    productImage1,
    productImage4,
    productImage2,
    productImage5,
    productImage3,
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeout(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      }, 500); // Duration of the slide animation
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative">
      {/* Carousel */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="space-y-3 text-center">
          <div className="relative inline-flex overflow-hidden rounded-2xl">
            <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
              {images.map((image, index) => (
                <figure key={index} className="min-w-full">
                  <Image
                    className="opacity-80"
                    src={image}
                    width={1920}
                    height={1080}
                    alt={`Product image ${index + 1}`}
                    style={{ height: 'auto' }}
                  />
                </figure>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-4">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2.5 h-2.5 mx-1 rounded-full cursor-pointer ${
                  index === currentIndex ? "bg-accent-foreground" : "bg-muted"
                }`}
                onClick={() => {
                  setTimeout(() => {
                    setCurrentIndex(index);
                  }, 500); // Duration of the slide animation
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}