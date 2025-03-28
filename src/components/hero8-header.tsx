'use client'
import Link from 'next/link'
import { Menu, X, User, LogOut, Search, Database, Receipt } from 'lucide-react'
import React from 'react'
import Logo from './logo'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './ui/navigation-menu'
import { cn } from '@/lib/utils'
import { useWallet } from '@/contexts/WalletContext'
import { WalletDialog } from './sign-in/WalletDialog'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'

type MenuItem = {
    name: string;
    href: string;
    icon: React.ElementType;
    description?: string;
    submenu?: MenuItem[];
    requiresAuth?: boolean;
    blankTarget?: boolean;
}

const menuItems: MenuItem[] = [
    {
        name: 'MegaData',
        href: '/megadata',
        icon: Database,
        description: 'On-chain metadata storage for your tokens.',
        requiresAuth: true,
    },
    {
        name: 'Assets',
        href: '/assets',
        icon: Receipt,
        description: 'View tracked assets',
        requiresAuth: true,
    },
    {
        name: 'Query',
        href: '/query',
        icon: Search,
        description: 'Query assets based on your criteria.',
        requiresAuth: true,
    }
]

const NavigationItem = ({ item }: { item: typeof menuItems[number] }) => {
    const { account } = useWallet();

    if (item.requiresAuth && !account) {
        return null;
    }

    if (item.submenu) {
        return (
            <NavigationMenuItem>
                <NavigationMenuTrigger className={cn(
                    "text-muted-foreground hover:text-accent-foreground block duration-150",
                    "flex items-center gap-2"
                )}>
                    <item.icon className="size-4" />
                    {item.name}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                        {item.submenu.map((subItem, subIndex) => (
                            <ListItem key={subIndex} href={subItem.href} title={subItem.name}>
                                {subItem.description}
                            </ListItem>
                        ))}
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>
        )
    }

    return (
        <NavigationMenuItem>
            <Link
                href={item.href}
                target={item.blankTarget ? '_blank' : '_self'}
                className={cn(
                    "text-muted-foreground hover:text-accent-foreground block duration-150",
                    "flex items-center gap-2"
                )}>
                <item.icon className="size-4" />
                <span>{item.name}</span>
            </Link>
        </NavigationMenuItem>
    )
}

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [walletDialogOpen, setWalletDialogOpen] = React.useState(false);
    const { account, disconnect } = useWallet();

    return (
        <header className="bg-background/50 fixed z-20 w-full border-b backdrop-blur-3xl">
            <div className="mx-auto max-w-6xl px-6 transition-all duration-300">
                <div className="relative flex items-center justify-between py-3 lg:py-4">
                    <Link
                        href="/"
                        aria-label="home"
                        className="flex items-center space-x-2">
                        <Logo />
                    </Link>

                    <div className="flex items-center">
                        <NavigationMenu className="hidden lg:block">
                            <NavigationMenuList className="flex gap-8">
                                {menuItems.map((item, index) => (<NavigationItem key={index} item={item} />))}
                            </NavigationMenuList>
                        </NavigationMenu>

                        <div className="hidden lg:block ml-4">
                            {account ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-10 w-10 rounded-full hover:bg-accent"
                                        >
                                            <User className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="font-mono text-sm">
                                            {account.slice(0, 6)}...{account.slice(-4)}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/settings" className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>Settings</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={disconnect} className="text-destructive">
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Disconnect
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => setWalletDialogOpen(true)}
                                    className="h-10"
                                >
                                    Connect Wallet
                                </Button>
                            )}
                        </div>

                        <button
                            onClick={() => setMenuState(!menuState)}
                            aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                            className="relative z-20 ml-4 block cursor-pointer lg:hidden">
                            <Menu className={cn(
                                "m-auto size-6 duration-200",
                                menuState && "rotate-180 scale-0 opacity-0"
                            )} />
                            <X className={cn(
                                "absolute inset-0 m-auto size-6 duration-200",
                                menuState ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-0 opacity-0"
                            )} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu dropdown */}
            <div className={cn(
                "bg-background absolute right-0 left-0 z-10 border-b p-6 shadow-lg",
                "transition-all duration-200 ease-in-out",
                menuState ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none",
                "lg:hidden"
            )}>
                <div className="mb-4">
                    {account ? (
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <span className="font-mono text-sm">
                                {account.slice(0, 6)}...{account.slice(-4)}
                            </span>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setWalletDialogOpen(true)}
                            className="w-full"
                        >
                            Connect Wallet
                        </Button>
                    )}
                </div>
                <ul className="space-y-4">
                    {menuItems.map((item, index) => (
                        <li key={index}>
                            <Link
                                href={item.href}
                                target={item.blankTarget ? '_blank' : '_self'}
                                className="text-muted-foreground hover:text-accent-foreground flex items-center gap-2 py-2 duration-150">
                                <item.icon className="size-4" />
                                <span>{item.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
        </header>
    )
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"