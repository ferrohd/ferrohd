import Link from "next/link"
import { SVGProps } from "react"

export default function Projects() {
    const projects = [
        {
            title: "LottoPrint",
            description: "LottoPrint is a comprehensive Web Application for italian lottery enthusiasts, visualizing results, tracking unextracted numbers over time, and providing number-picking suggestions to enhance the user's strategy.",
            link: "https://lottoprint.it",
        },
        {
            title: "Marecchia",
            description: "Marecchia enables efficient P2P streaming in browsers via a WebAssembly library, connecting viewers directly to share video content, complemented by a backend tracker for peer discovery, drastically cutting down on server bandwidth use.",
            link: "https://github.com/ferrohd/marecchia",
        },
        {
            title: "CLup",
            description: "A web application developed during COVID-19 pandemic that allows users to book time slots for shopping in order to avoid queues and crowds, fostering a safe shopping experience by providing a flow control system.",
            link: "https://github.com/ferrohd/CLup",
        },
        {
            title: "Benziina",
            description: "Native app for iOS and Android, providing realtime gas prices, maps-like navigation with geolocation, plus details on gas stations' features and timetables, optimizing your refueling experience.",
            link: "https://benziina.app",
        },
        {
            title: "Identeapots",
            description: "TypeScript library for Node.js and the web, generating sleek, unique identicon images from any given string, offering a distinctive visual representation for user identities or data points.",
            link: "https://github.com/teapot-labs/identeapots",
        },
    ];

    return (
        <div className="container  mx-auto grid gap-6 px-4 md:gap-10 md:px-6">
            <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl xl:text-5xl/none">Stuff I&apos;ve Built</h2>
                <p className="text-gray-500 dark:text-gray-400">Talk is cheap. Show me the code. <i>-Linus Torvalds</i></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                {
                    projects.map((project, index) => (
                        <div key={index} className="space-y-4">
                            <h3 className="text-2xl font-bold tracking-tight">{project.title}</h3>
                            <p className="max-w-prose text-gray-500 md:text-base/relaxed dark:text-gray-400">{project.description}</p>
                            <Link
                                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm gap-1 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                                href={project.link}
                                target="_blank"
                            >
                                View Project
                                <ArrowRightIcon className="h-4 w-4 peer-ml" />
                            </Link>
                        </div>
                    ))
                }

            </div>
        </div>
    )
}

function ArrowRightIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
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
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
