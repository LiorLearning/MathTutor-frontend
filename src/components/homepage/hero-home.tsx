import { Button } from "@/components/ui/button"
import ModalCarousel from "./modal-carousel"

export default function HeroHome({ color }: { color: string }) {
  return (
    <section className="relative mt-12 py-12 md:mt-24 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Title Section */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16">
          <span style={{ color: color }}>AI-Powered</span>, Human Coach Led
          <br /> 1:1 Homeschooling Math Program
        </h1>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left Column - Text Content */}
          <div className="lg:col-span-2 space-y-6 mx-auto lg:ml-8">
            <h2 className="text-2xl font-bold">
              #1 Math Program Loved by Homeschoolers
            </h2>
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                What if kids could learn math by building their own math adventures, just like Minecraft? We make it happen!
              </p>
              <p className="text-lg text-muted-foreground">
                Our AI tutor engages, and a <strong>1:1 math coach</strong> guarantees progress. Together, we unlock your child&apos;s potential.
              </p>
            </div>
            {/* Button */}
            <div className="pt-8 text-center">
              <a
                href="https://calendly.com/d/cmqw-bn2-4nh/introductory-session-math-by-lior-learning"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  className="w-full sm:w-auto text-lg px-8 py-6"
                  style={{
                    backgroundColor: color,
                    border: `2px solid ${color}`,
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                  }}
                >
                  Book 1:1 Free Math Workshop
                </Button>
              </a>
            </div>
          </div>

          {/* Right Column - Carousel */}
          <div className="lg:col-span-3 relative mx-auto w-full">
            <ModalCarousel />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mt-16">
          Loved by Kids, Valued by Parents, Trusted by Micro-school Teachers
        </h2>

        {/* Stats Bar */}
        <div className="mt-16 rounded-xl bg-gray-800 p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">K-8</div>
              <div className="text-gray-400 text-sm">GRADES OFFERED</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">5K+</div>
              <div className="text-gray-400 text-sm">MATH CONCEPTS MASTERED</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">126</div>
              <div className="text-gray-400 text-sm">MATH ADVENTURES CREATED</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">3X</div>
              <div className="text-gray-400 text-sm">LEARNING OUTCOMES THAN SCHOOL</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
