import ModalVideo from "@/components/homepage/modal-video";
import { Button } from "@/components/ui/button";

export default function HeroHome() {
  return (
    <section className="relative">
      {/* <PageIllustration /> */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-16">
            <h1
              className="mb-6 border-y text-5xl font-bold text-foreground md:text-6xl"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              1:1 AI math tutor supported by a human coach.
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-lg text-muted-foreground"
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                Empowering students with personalized AI-driven math tutoring, enhanced by expert human guidance.
              </p>
              <div className="relative before:absolute">
                <div
                  className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
                  data-aos="zoom-y-out"
                  data-aos-delay={450}
                >
                  <Button
                    className="group mb-4 w-full bg-gradient-to-t from-primary to-primary bg-[length:100%_100%] bg-[bottom] text-primary-foreground shadow hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                  >
                    <span className="relative inline-flex items-center">
                      Start Free Trial{" "}
                      <span className="ml-1 tracking-normal text-accent-foreground transition-transform group-hover:translate-x-0.5">
                        -&gt;
                      </span>
                    </span>
                  </Button>
                  <Button
                    className="w-full bg-secondary text-secondary-foreground shadow hover:bg-muted sm:ml-4 sm:w-auto"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <ModalVideo />
        </div>
      </div>
    </section>
  );
}
