'use client'

import Image from 'next/image'
import SahasraImg from '@/public/team/sahasra.png'
import TilakrajImg from '@/public/team/tilakraj.jpg'
import VirokImg from '@/public/team/virok.jpg'
import { FaLinkedin } from 'react-icons/fa'

export default function About() {
  return (
    <section className="relative before:absolute before:inset-0 before:-z-20 before:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-16 text-center md:pb-20">
            <h1 className="text-3xl font-bold text-gray-200 md:text-4xl">
              Meet the Team Behind Lior AI
            </h1>
            <p className="mt-4 text-xl text-gray-400">
              We&apos;re passionate about making math learning engaging and accessible for everyone.
            </p>
          </div>

          {/* Team members grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Team member 1 */}
            <article className="flex flex-col items-center">
              <div className="mb-4 overflow-hidden rounded-full">
                <Image
                  src={SahasraImg}
                  alt="Sahasra Ranjan"
                  width={200}
                  height={200}
                  className="h-48 w-48 object-cover"
                />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-200">Sahasra Ranjan</h2>
              <p className="mb-3 text-blue-500">Co-Founder & CTO</p>
              <a href="https://www.linkedin.com/in/sahasra-ranjan-2478521a6/" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="text-blue-500" />
              </a>
            </article>

            {/* Team member 2 */}
            <article className="flex flex-col items-center">
              <div className="mb-4 overflow-hidden rounded-full">
                <Image
                  src={VirokImg}
                  alt="Virok Sharma"
                  width={200}
                  height={200}
                  className="h-48 w-48 object-cover"
                />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-200">Virok Sharma</h2>
              <p className="mb-3 text-blue-500">Co-Founder & CEO</p>
              <a href="https://www.linkedin.com/in/viroksharma" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="text-blue-500" />
              </a>
            </article>

            {/* Team member 3 */}
            <article className="flex flex-col items-center">
              <div className="mb-4 overflow-hidden rounded-full">
                <Image
                  src={TilakrajImg}
                  alt="Tilakraj Singh"
                  width={200}
                  height={200}
                  className="h-48 w-48 object-cover"
                />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-200">Tilakraj Singh</h2>
              <p className="mb-3 text-blue-500">Co-Founder & CBO</p>
              <a href="https://www.linkedin.com/in/tilakraj-singh-/" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="text-blue-500" />
              </a>
            </article>
          </div>

          {/* Mission statement */}
          <div className="mt-16 rounded-lg bg-gray-800 p-6 text-center md:p-10">
            <h2 className="mb-4 text-2xl font-bold text-gray-200">Our Mission</h2>
            <p className="text-gray-400">
              At Lior AI, we&apos;re committed to making math learning an exciting adventure for every child. By combining 
              cutting-edge AI technology with proven educational methods, we&apos;re transforming the way students engage 
              with mathematics, fostering a love for learning that lasts a lifetime.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
