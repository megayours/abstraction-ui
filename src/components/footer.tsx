import { links } from '@/lib/links'
import Link from 'next/link'

const footerLinks = [
    {
        title: 'Whitepaper',
        href: links.whitepaper,
    },
    {
        title: 'Github',
        href: links.github,
    },
    {
        title: 'Contact',
        href: 'mailto:antonio.palma@megayours.com',
    },
    {
        title: 'X',
        href: links.x,
    },
]

export default function FooterSection() {
    return (
        <footer className="bg-background/50 py-8 md:py-12 dark:bg-transparent">
            <div className="mx-auto max-w-5xl px-6">
                <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm">
                        {footerLinks.map((link, index) => (
                            <Link key={index} href={link.href} className="text-muted-foreground hover:text-primary duration-150">
                                <span>{link.title}</span>
                            </Link>
                        ))}
                    </div>
                    <span className="text-muted-foreground text-sm">© {new Date().getFullYear()} MegaYours, All rights reserved</span>
                </div>
            </div>
        </footer>
    )
}
