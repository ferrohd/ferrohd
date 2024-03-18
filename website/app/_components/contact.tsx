import Email from "./email"

export default function Contact() {
    const contacts = [
        {
            title: "LinkedIn",
            url: "https://linkedin.com/in/aleferrara",
        },
        {
            title: "GitHub",
            url: "https://github.com/ferrohd",
        }
    ]

    return (
        <div className="container  mx-auto grid gap-6 px-4 md:gap-10 md:px-6">
            <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl xl:text-5xl/none">Get in touch</h2>
                <p className="text-gray-500 dark:text-gray-400">Reach me through the following channels.</p>
            </div>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 text-ellipsis">
                <Email />
                {
                    contacts.map((contact, index) => (
                        <div key={index}>
                            <h3 className="text-lg font-semibold">{contact.title}</h3>
                            <a href={contact.url} className="hover:underline">{contact.url.replace("https://", "")}</a>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}
