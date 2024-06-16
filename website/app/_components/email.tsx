'use client';

/**
 * Crawlers don't execute JavaScript. The email is sent as a base64 encoded string and then decoded on the client side.
 * @returns JSX.Element
 */
export default function Email() {
    const emailb64 = "YWxlc3NhbmRybzIuZmVycmFyYUBtYWlsLnBvbGltaS5pdA==";
    const email = Buffer.from(emailb64, 'base64').toString('utf-8');

    return (
        <div>
            <h3 className="text-lg font-semibold">Email</h3>
            <a href={`mailto:${email}`} className="hover:underline">{email}</a>
        </div>
    )
}
