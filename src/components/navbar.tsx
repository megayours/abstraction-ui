'use client'
import Link from 'next/link'
import { Menu, X, User, LogOut, Search, Database, Receipt, Boxes, Gift } from 'lucide-react'
import React from 'react'
import Logo from './logo'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './ui/navigation-menu'
import { cn } from '@/lib/utils'
import { useWeb3Auth } from '@/providers/web3auth-provider'
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
        name: 'Mint',
        href: '#',
        icon: Boxes,
        description: 'Create and manage your token collections',
        submenu: [
            {
                name: 'Airdrop',
                href: '/mint/airdrop',
                icon: Gift,
                description: 'Create an airdrop based on your saved queries',
            },
            {
                name: 'Custom Collection',
                href: '/mint/custom',
                icon: Boxes,
                description: 'Create your own NFT collection',
            }
        ],
        requiresAuth: true,
    },
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

// User settings menu item - separate from main menu
const userSettingsItem: MenuItem = {
    name: 'Settings',
    href: '/settings',
    icon: User,
    requiresAuth: true,
}

const NavigationItem = ({ item }: { item: typeof menuItems[number] }) => {
    const { isConnected } = useWeb3Auth();

    if (item.requiresAuth && !isConnected) {
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
    const { isConnected, isLoading, login, logout, walletAddress } = useWeb3Auth();

    const closeMenu = React.useCallback(() => {
        setMenuState(false);
    }, []);

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

                    <div className="flex items-center gap-4">
                        <NavigationMenu className="hidden lg:block">
                            <NavigationMenuList className="flex gap-8">
                                {menuItems.map((item, index) => (<NavigationItem key={index} item={item} />))}
                            </NavigationMenuList>
                        </NavigationMenu>

                        <div className="hidden lg:block ml-4">
                            {isConnected ? (
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
                                        <DropdownMenuLabel className="font-normal">
                                            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/settings" className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>Settings</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={logout} className="text-destructive">
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : null}
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
                <div className="mb-6">
                    {isConnected ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                <User className="h-5 w-5" />
                                <span className="text-sm font-mono">
                                    {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
                                </span>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={logout}
                                size="sm"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10 w-full justify-start"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={login}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    )}
                </div>
                <ul className="space-y-2">
                    {menuItems.map((item, index) => (
                        (item.requiresAuth && !isConnected) ? null : (
                            <li key={index}>
                                <Link
                                    href={item.href}
                                    target={item.blankTarget ? '_blank' : '_self'}
                                    onClick={closeMenu}
                                    className="text-muted-foreground hover:text-accent-foreground flex items-center gap-2 p-3 duration-150 rounded-md hover:bg-accent">
                                    <item.icon className="size-5" />
                                    <span className="text-base">{item.name}</span>
                                </Link>
                            </li>
                        )
                    ))}
                    {isConnected && (
                        <li>
                            <Link
                                href={userSettingsItem.href}
                                onClick={closeMenu}
                                className="text-muted-foreground hover:text-accent-foreground flex items-center gap-2 p-3 duration-150 rounded-md hover:bg-accent">
                                <userSettingsItem.icon className="size-5" />
                                <span className="text-base">{userSettingsItem.name}</span>
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
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