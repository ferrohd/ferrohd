export default function Bio() {
    return (
        <div className="container mx-auto grid items-start gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl xl:text-5xl/none">About Me</h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    I&apos;m an Italian engineer with an MSc in Computer Science and Engineering specialized in building scalable and efficient systems.
                </p>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    My expertise lies in designing and optimizing databases, crafting robust APIs, and ensuring seamless integration between services.
                </p>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    I love diving into complex problems and finding elegant solutions.
                </p>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    When I&apos;m not coding, I&apos;m riding my bike as fast as my code.
                </p>
            </div>
            <div className="mx-auto flex items-center justify-center rounded-lg overflow-hidden w-full max-w-md">
                {/*<Image
                src="todo.jpg"
                alt="Alessandro Ferrara"
                fill={true}
              />
              */}
            </div>
        </div>
    )
}
