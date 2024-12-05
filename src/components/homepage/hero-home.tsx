import { Button } from "@/components/ui/button";
import ModalCarousel from "./modal-carousel";

export default function HeroHome({ color }: { color: string }) {
  return (
    <section className="relative">
      <div className="mx-auto max-w-8xl px-4 sm:px-6">
        <div className="pt-32 md:pt-40">
          <div className="pb-12 text-center md:pb-16">
            <h1
              className="mb-6 text-5xl font-bold md:text-6xl"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              <span style={{ color: color }}>AI Led.</span> Coach Supported.
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-lg text-muted-foreground"
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                The AI tutor adapts to your child’s interests and ability, while the coach ensures your child gets the right emotional support to unleash their math potential.
              </p>
              <div className="relative before:absolute">
                <div
                  className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
                  data-aos="zoom-y-out"
                  data-aos-delay={450}
                >
                  <a
                    href="https://calendly.com/d/cmqw-bn2-4nh/introductory-session-math-by-lior-learning"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      className="group w-full bg-[length:100%_100%] bg-[bottom] text-primary-foreground shadow hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                      style={{ color: 'white', backgroundColor: color, border: `2px solid ${color}`, padding: '20px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem' }}
                    >
                      Start Free Trial
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mb-8">
            <ModalCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}