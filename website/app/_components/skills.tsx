export default function Skills() {
    const skills = [
        {
            title: "Rust",
            description: "Expertise in Rust involved in developing a variety of projects, including but not limited to web services, command-line interfaces, and system utilities. Familiarity with the language's features and its ecosystem has enabled me to leverage Rust for building high-performance, reliable software.",
        },
        {
            title: "Database",
            description: "Proven experience in designing and optimizing both relational and NoSQL databases.This includes crafting efficient schemas, optimizing queries for performance, and ensuring data integrity.Proficient with PostgreSQL, MySQL, and MongoDB, my work has significantly improved database management and access.",
        },
        {
            title: "Linux",
            description: "I have experience working with Linux systems, including setting up and maintaining servers, managing user accounts, and configuring networking. I'm familiar with the Linux command line and have worked with a variety of distributions, including Ubuntu and Arch Linux.",
        },
        {
            title: "CI/CD",
            description: "In-depth experience in setting up and maintaining CI/CD pipelines, particularly utilizing GitHub Actions. My focus has been on automating the deployment process, encompassing continuous integration and delivery, to ensure that code is tested, deployed, and released efficiently and reliably.",
        },
        {
            title: "Docker and Kubernetes",
            description: "My experience with Docker and Kubernetes has been focused on building and maintaining scalable and reliable infrastructure. I've worked on setting up and managing Kubernetes clusters, creating Docker images, and deploying applications to Kubernetes.",
        },
        {
            title: "Cloud Platforms",
            description: "Hands-on experience with cloud platforms such as AWS, GCP, and DigitalOcean, specializing in setting up and managing robust infrastructure. My role has encompassed managing services including EC2, S3, and RDS, focusing on scalability, reliability, and optimizing performance for diverse applications."
        },
    ]
    return (
        <div className="container  mx-auto grid gap-6 px-4 md:gap-10 md:px-6">
            <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl xl:text-5xl/none">My Skills</h2>
                <p className="text-gray-500 dark:text-gray-400">A precise toolbox for crafting efficient solutions.</p>
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
    )
}
