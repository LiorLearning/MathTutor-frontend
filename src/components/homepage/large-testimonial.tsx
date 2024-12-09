'use client'

import Image from "next/image";
import Image1 from "@/public/images/image1.png"
import Image2 from "@/public/images/image2.png"
import Image3 from "@/public/images/image3.png"
import EFLogo from "@/public/images/ef_logo.svg"
import { useState, useEffect } from "react";

export default function LargeTestimonial() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      image: Image1,
      text: "These are the coolest progress reports ever. People don't understand that for this and next generation making learning interest-based isn't just a 'nice to have', it's actually the critical piece for their learning efficacy.",
      name: "Julietta",
      title: "Microschool founder",
    },
    {
      text: "I still can't quite grasp how fascinating it is that the boys actually want to schedule more classes.",
      name: "Samuel, Asher and Anica’s mom",
    },
    {
      image: Image2,
      text: "I asked him the other day what his favourite thing in the week was, and you were right after his favourite video game. Whatever you’re doing is working really well!",
      name: "Loren’s mom",
    },
    {
      text: "Earlier learning math was always a battle. But now Connor is so excited for the next session. What you guys are doing is really amazing.",
      name: "Connor’s mom",
      title: "(All 5 kids learn with Lior)",
    },
    {
      image: Image3,
      text: "It’s a gift to have Asher work with you. I am often doing housework nearby when he is working with you and it's very nice for me to hear him learn math while using his imagination.",
      name: "Asher’s mom",
    },
    {
      text: "Lucia was so excited to share with me how happy she was after the first session. She was practicing math after your call because she felt like it was a game.",
      name: "Lucia’s mom",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="space-y-3 text-center">
            {testimonials[currentIndex].image && (
              <div className="relative inline-flex">
                <svg
                  className="absolute -left-6 -top-2 -z-10"
                  width={40}
                  height={49}
                  viewBox="0 0 40 49"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.7976 -0.000136375L39.9352 23.4746L33.4178 31.7234L13.7686 11.4275L22.7976 -0.000136375ZM9.34947 17.0206L26.4871 40.4953L19.9697 48.7441L0.320491 28.4482L9.34947 17.0206Z"
                    fill="var(--muted-foreground)"
                  />
                </svg>
                <Image
                  className="rounded-full"
                  src={testimonials[currentIndex].image}
                  width={48}
                  height={48}
                  alt="Large testimonial"
                />
              </div>
            )}
            <p className="text-2xl font-bold text-foreground">
              {testimonials[currentIndex].text}
            </p>
            <div className="text-sm font-medium text-muted-foreground transition-opacity duration-500 ease-in-out">
              <span className="text-foreground">{testimonials[currentIndex].name}</span>{" "}
              <span className="text-muted-foreground">/</span>{" "}
              <a className="text-accent-foreground" href="#0">
                {testimonials[currentIndex].title}
              </a>
            </div>
            <div className="flex justify-center mt-4">
              {testimonials.map((_, index) => (
                <div
                  key={index}
                  className={`w-2.5 h-2.5 mx-1 rounded-full cursor-pointer ${
                    index === currentIndex ? "bg-accent-foreground" : "bg-muted"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                ></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <p className="text-md font-medium text-muted-foreground">Backed by</p>
        </div>
        <div className="mt-4 mb-16">
          <div className="flex justify-center items-center" style={{ backgroundColor: 'rgb(90, 30, 213)', padding: '1rem', width: '70%', margin: '0 auto' }}>
            <div className="flex justify-center">
              <Image
                src={EFLogo}
                width={1200}
                height={1200}
                alt="EF Logo"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
