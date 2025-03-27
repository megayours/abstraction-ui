"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { WalletButton } from '@/components/WalletButton';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Contracts', href: '/contracts' },
  { name: 'Account Links', href: '/account-links' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-black dark:text-white'
              : 'text-muted-foreground'
          )}
        >
          {item.name}
        </Link>
      ))}
      <WalletButton />
    </nav>
  );
} 