'use client';

import { FocusEventHandler } from "react";

export default function Email() {
    let emailb64 = "Y2FsbGJhY2tAZ21haWwuY29t";

    const onFocus: FocusEventHandler<HTMLAnchorElement> = (e) => {
        const email = atob(emailb64);
        e.target.innerHTML = email;
        e.target.href = `mailto:${email}`;
    };

    return (
        <div>
            <h3 className="text-lg font-semibold">Email</h3>
            <a href="#" className="hover:underline" onFocus={onFocus}>Click me</a>
        </div>
    )
}
