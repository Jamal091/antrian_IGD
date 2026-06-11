'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const images = [
    '/kamar3.jpg',
    '/kamar2.jpg',
    '/kamar1.jpg',
    '/kamar4.jpg'
];

export default function Carousel() {
    const [current, setCurrent] = useState(0);
    const total = images.length;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % total);
        }, 5000);

        return () => clearInterval(interval);
    }, [total]);

    return (
        <div className="relative mx-0 md:mx-auto overflow-hidden rounded-lg flex flex-col">
            <div
                className="flex transition-transform duration-500 ease-in-out aspect-[4/3] sm:aspect-video"
                style={{ transform: `translateX(-${current * 100}%)` }}
            >
                {images.map((src, idx) => (
                    <div key={idx} className="w-full flex-shrink-0">
                        <Image
                            src={src}
                            alt={`Slide ${idx}`}
                            width={800}
                            height={400}
                            className="w-full h-full object-cover rounded-lg"
                            priority={idx === 0}
                        />
                    </div>
                ))}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-3">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`h-2 w-2 rounded-full ${current === idx ? 'bg-white' : 'bg-gray-400'} transition`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}