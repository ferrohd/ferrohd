import Link from "next/link"
import { JSX, SVGProps } from "react"
import Contact from "./_components/contact"
import Projects from "./_components/projects"
import Skills from "./_components/skills"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 py-6 flex flex-col gap-1">
        <div className="container mx-auto flex items-center justify-center">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tighter sm:text-3xl">Alessandro Ferrara</h1>
            <p className="text-sm font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">Backend/Infra Engineer</p>
          </div>
        </div>
        <nav className="flex mx-auto gap-4 sm:gap-6 pt-6">
          <Link className="text-lg font-medium hover:underline underline-offset-4" href="#">
            Bio
          </Link>
          <Link className="text-lg font-medium hover:underline underline-offset-4" href="#skills">
            Skills
          </Link>
          <Link className="text-lg font-medium hover:underline underline-offset-4" href="#projects">
            Projects
          </Link>
          <Link className="text-lg font-medium hover:underline underline-offset-4" href="#contact">
            Contact
          </Link>
          <Link className="text-lg font-medium hover:underline underline-offset-4" href="#">
            CV
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 h-screen">
          <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 md:px-6 lg:gap-10">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-6xl md:text-6xl/none">Hi, I&apos;m Ferro👋</h1>
              <p className="text-gray-500 dark:text-gray-400">Nice to meet you.</p>
            </div>
            <div className="mx-auto w-full max-w-prose space-y-2">
              <p className="text-base text-gray-500 md:text-xl/relaxed dark:text-gray-400">
                I&apos;m a backend engineer with a passion for building scalable and efficient systems. My expertise lies in
                designing and optimizing databases, crafting robust APIs, and ensuring seamless integration between
                services. I love diving into complex problems and finding elegant solutions.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto grid items-start gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl xl:text-5xl/none">About Me</h2>
              <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                I&apos;m a backend engineer with a passion for building scalable and efficient systems. My expertise lies in
                designing and optimizing databases, crafting robust APIs, and ensuring seamless integration between
                services. I love diving into complex problems and finding elegant solutions. When I&apos;m not coding, I&apos;m riding my bike as fast as my code.
              </p>
            </div>
            <div className="mx-auto flex items-center justify-center rounded-lg overflow-hidden w-full max-w-md">
              <img
                alt="Image"
                className="aspect-[4/3] object-cover object-center"
                height="300"
                src="/next.svg"
                width="400"
              />
            </div>
          </div>
        </section>
        {/** Skills */}
        <Skills />

        {/** Projects */}
        <Projects />

        {/** Contact */}
        <Contact />
      </main>

      {/** Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 Acme Inc. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}

function CheckCircleIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
