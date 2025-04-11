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
        title: 'Documentation',
        href: links.docs,
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
        <footer className="bg-background/50 py-12 dark:bg-transparent">
            <div className="mx-auto max-w-5xl px-6">
                <div className="flex flex-wrap justify-between gap-6">
                    <span className="text-muted-foreground order-last block text-center text-sm md:order-first">© {new Date().getFullYear()} MegaYours, All rights reserved</span>
                    <div className="order-first flex flex-wrap justify-center gap-6 text-sm md:order-last">
                        {footerLinks.map((link, index) => (
                            <Link key={index} href={link.href} className="text-muted-foreground hover:text-primary block duration-150">
                                <span>{link.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
