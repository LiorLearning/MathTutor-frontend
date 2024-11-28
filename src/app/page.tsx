import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Brain, Target, Clock } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <main className="flex-1 w-full flex flex-col items-center justify-center">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex flex-col items-center justify-center">
          <div className="container px-4 md:px-6 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Master Math with Your Personal AI Tutor
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Empower your child's learning journey with our adaptive AI math tutor. Perfect for homeschooling families in the US.
                </p>
              </div>
              <div className="space-x-4">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started for Free</Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 flex flex-col items-center justify-center">
          <div className="container px-4 md:px-6 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
              Why Choose Lior Learning Inc?
            </h2>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <Brain className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Adaptive Learning</h3>
                <p className="text-gray-500">Our AI adapts to your child's learning pace and style for personalized education.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Target className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">US Curriculum Aligned</h3>
                <p className="text-gray-500">Tailored to meet US educational standards, perfect for homeschooling families.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Clock className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">24/7 Availability</h3>
                <p className="text-gray-500">Learn anytime, anywhere. Our AI tutor is always ready to help.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 flex flex-col items-center justify-center">
          <div className="container px-4 md:px-6 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
              What Parents Say
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <img src="/placeholder.svg?height=100&width=100" alt="Parent" className="rounded-full mb-4" />
                <p className="text-gray-500 mb-2">"Lior Learning Inc has transformed our homeschooling experience. My daughter's confidence in math has soared!"</p>
                <p className="font-bold">- Sarah K., Homeschooling Mom</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <img src="/placeholder.svg?height=100&width=100" alt="Parent" className="rounded-full mb-4" />
                <p className="text-gray-500 mb-2">"The personalized approach of this AI tutor has made a huge difference in my son's math skills."</p>
                <p className="font-bold">- Mike R., Homeschooling Dad</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <img src="/placeholder.svg?height=100&width=100" alt="Parent" className="rounded-full mb-4" />
                <p className="text-gray-500 mb-2">"As a busy homeschooling parent, having a reliable AI math tutor has been a game-changer for our family."</p>
                <p className="font-bold">- Emily T., Homeschooling Mom</p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground flex flex-col items-center justify-center">
          <div className="container px-4 md:px-6 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Revolutionize Your Child's Math Learning?
                </h2>
                <p className="mx-auto max-w-[700px] text-primary-foreground/90 md:text-xl">
                  Join thousands of satisfied homeschooling families and watch your child's math skills flourish.
                </p>
              </div>
              <div className="space-x-4">
                <Button className="bg-background text-primary hover:bg-background/90">Start Free Trial</Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col sm:flex-row py-8 w-full shrink-0 items-center px-6 md:px-8 border-t border-gray-300 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">© 2024 Lior Learning Inc. All rights reserved.</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Phone: +1 510 205 7906</p>
        </div>
        <nav className="mt-4 sm:mt-0 sm:ml-auto flex gap-6">
          <Link className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors" href="#">
            Terms of Service
          </Link>
          <Link className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
