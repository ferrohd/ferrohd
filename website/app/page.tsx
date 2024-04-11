import Link from "next/link"
import Image from "next/image"
import Contact from "./_components/contact"
import Projects from "./_components/projects"
import Skills from "./_components/skills"
import Bio from "./_components/bio"

export default function Home() {
  const navLinks = [
    {
      title: "Bio",
      url: "#bio",
    },
    {
      title: "Skills",
      url: "#skills",
    },
    {
      title: "Projects",
      url: "#projects",
    },
    {
      title: "Contact",
      url: "#contact",
    },
    {
      title: "CV",
      url: "#",
    }
  ];
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
          {
            navLinks.map((link, index) => (
              <Link key={index} className="text-lg font-medium hover:underline underline-offset-4" href={link.url}>
                {link.title}
              </Link>
            ))
          }
        </nav>
      </header>
      <main className="flex-1">

        <section className="w-full py-12 md:py-24 lg:py-32 flex">
          <div className="m-auto text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-6xl md:text-6xl/none">Ciao, I&apos;m Ferro 👋</h1>
            <p className="text-gray-500 dark:text-gray-400">Nice to meet you.</p>
          </div>
        </section>

        {/** Bio */}
        <section id="bio" className="w-full py-12 md:py-18 lg:py-24">
          <Bio />
        </section>

        {/** Skills */}
        <section id="skills" className="w-full py-12 md:py-18 lg:py-24">
          <Skills />
        </section>

        {/** Projects */}
        <section id="projects" className="w-full py-12 md:py-18 lg:py-24">
          <Projects />
        </section>

        {/** Contact */}
        <section id="contact" className="w-full py-12 md:py-18 lg:py-24">
          <Contact />
        </section>
      </main>

      {/** Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6">
        <p className="text-xs text-gray-500 dark:text-gray-400">This website is spaghetti with <Link className="underline" href="https://github.com/ferrohd/ferrohd/" target="_blank">the sauce</Link>.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          {/*
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
          */}
        </nav>
      </footer>
    </div>
  )
}
