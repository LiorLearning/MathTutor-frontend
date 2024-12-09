'use client'

import Image from 'next/image'
import SahasraImg from '@/public/team/sahasra.png'
import TilakrajImg from '@/public/team/tilakraj.jpg'
import VirokImg from '@/public/team/virok.jpg'
import { FaLinkedin } from 'react-icons/fa'

const teamMembers = [
  {
    name: "Sahasra Ranjan",
    role: "Co-Founder & CTO",
    image: SahasraImg,
    linkedin: "https://www.linkedin.com/in/sahasra-ranjan-2478521a6/",
    desc: ""
  },
  {
    name: "Virok Sharma",
    role: "Co-Founder & CEO",
    image: VirokImg,
    linkedin: "https://www.linkedin.com/in/viroksharma",
    desc: ""
  },
  {
    name: "Tilakraj Singh",
    role: "Co-Founder & CBO",
    image: TilakrajImg,
    linkedin: "https://www.linkedin.com/in/tilakraj-singh-/",
    desc: ""
  }
];

export default function About() {
  return (
    <section className="relative before:absolute before:inset-0 before:-z-20 before:bg-gray-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-16 text-center md:pb-20">
            <h1 className="text-3xl font-bold text-gray-200 md:text-4xl">
              Meet the Team Behind Lior AI
            </h1>
            <p className="mt-4 text-2xl font-bold text-gray-400 p-4">
              We are all educators at heart
            </p>
            <p className="mt-4 text-xl text-gray-400">
              We’re education and technology experts, having scaled education startups like FrontRow & Scaler as well as being at the fore-front of tech with Rubrik, we understand how kids learn and how technology can unleash their potential
            </p>
          </div>

          {/* Team members grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member, index) => (
              <article key={index} className="flex flex-col items-center">
                <div className="mb-4 overflow-hidden rounded-full">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={200}
                    height={200}
                    className="h-48 w-48 object-cover"
                  />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-200">{member.name}</h2>
                <p className="mb-3 text-blue-500">{member.role}</p>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                  <FaLinkedin className="text-blue-500" />
                </a>
                <p className="mt-2 text-gray-400 text-center">{member.desc}</p>
              </article>
            ))}
          </div>

          {/* Mission statement */}
          <div className="mt-16 rounded-lg bg-gray-800 p-6 text-center md:p-10">
            <p className="mt-4 text-xl text-gray-400">
              Our mission is simple: to reimagine math—turning hate to love. This is more than just a better way of math learning; it’s changing the way we think about what’s possible
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
