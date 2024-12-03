'use client'

import Image from "next/image";
import Image1 from "@/public/images/image1.png"
import Image2 from "@/public/images/image2.png"
import Image3 from "@/public/images/image3.png"
import Image4 from "@/public/images/image4.jpg"
import Image5 from "@/public/images/image5.jpg"
import { useState, useEffect } from "react";

export default function LargeTestimonial() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      image: Image1,
      text: "“People don't understand that for this and next generation making learning interest-based isn't just a 'nice to have', it's actually the critical piece for their learning efficacy. Learning apps are enticing but they're not good enough to replace human teachers, at least not yet.”",
      name: "Julieta Rakover",
      title: "Microschool founder",
    },
    {
      image: Image2,
      text: "“That works great. And thanks! | asked him the other day what he liked about his week and you were right after his most favorite thing ever so, whatever you are doing it's working.”",
      name: "Jessica Washer",
    },
    {
      image: Image3,
      text: "“Haha good I am glad to hear of his progress. I am often doing housework nearby when he is working with you and it's very nice for me to hear him using his imagination in a way that others appreciate and benefit from.”",
      name: "Sarahe Lliman",
    },
    {
      image: Image4,
      text: "“I still can't quite grasp how fascinating it is that the boys actually want to schedule more classes.”",
      name: "Ally",
    },
    {
      image: Image5,
      text: "“Good morning! Lucia and her family were so excited to share with me how happy they were with the first session. Her mom told me she was practicing math after your call because she felt like it was a game.”",
      name: "Lucia's Mom",
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
            <p className="text-2xl font-bold text-foreground">
              {testimonials[currentIndex].text}
            </p>
            <div className="text-sm font-medium text-muted-foreground transition-opacity duration-500 ease-in-out opacity-0">
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
      </div>
    </section>
  );
}
