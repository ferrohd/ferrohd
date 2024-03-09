export default function Skills() {
    const skills = [
        {
            title: "Rust",
            description: "I have experience building and maintaining applications in Rust. I've worked on a variety of projects, including web services, command-line tools, and system utilities. I'm familiar with the language's features and ecosystem, and I've used it to build high-performance and reliable software.",
        },
        {
            title: "Database",
            description: "I have experience designing and optimizing databases, including relational and NoSQL databases. I've worked on creating efficient schemas, optimizing queries, and ensuring data integrity. I'm familiar with database management systems like PostgreSQL, MySQL, and MongoDB.",
        },
        {
            title: "Linux",
            description: "I have experience working with Linux systems, including setting up and maintaining servers, managing user accounts, and configuring networking. I'm familiar with the Linux command line and have worked with a variety of distributions, including Ubuntu, CentOS, and Arch Linux.",
        },
        {
            title: "CI/CD",
            description: "I have experience setting up and maintaining CI/CD pipelines using tools like Jenkins, GitHub Actions, and CircleCI. I've worked on automating the deployment process, setting up continuous integration, and ensuring that the code is tested and deployed reliably.",
        },
        {
            title: "Docker and Kubernetes",
            description: "My experience with Docker and Kubernetes has been focused on building and maintaining scalable and reliable infrastructure. I've worked on setting up and managing Kubernetes clusters, creating Docker images, and deploying applications to Kubernetes.",
        }
    ]
    return (
        <section id="skills" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container  mx-auto grid gap-6 px-4 md:gap-10 md:px-6">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl xl:text-5xl/none">My Skills</h2>
                    <p className="text-gray-500 dark:text-gray-400">Here are some of the projects I&apos;ve worked on.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                    {
                        skills.map((skill, index) => (
                            <div key={index} className="space-y-4">
                                <h3 className="text-2xl font-bold tracking-tight">{skill.title}</h3>
                                <p className="max-w-prose text-gray-500 md:text-base/relaxed dark:text-gray-400">{skill.description}</p>
                            </div>
                        ))
                    }
                </div>
            </div>
        </section>
    )
}
