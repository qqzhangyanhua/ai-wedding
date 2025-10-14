"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileImage, ArrowLeft } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  {
    href: '/admin/templates',
    label: '模板管理',
    icon: FileImage,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            返回控制台
          </Link>
        </div>

        <nav className="space-y-1 p-4">
          <div className="mb-4">
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              管理后台
            </h2>
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1">
        <div className="container py-8">{children}</div>
      </main>
    </div>
  );
}
