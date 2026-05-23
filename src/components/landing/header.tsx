"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: "Platform", href: "#features" },
    { name: "Solutions", href: "#ai-intelligence" },
    { name: "Resources", href: "#workflow" },
    { name: "Enterprise", href: "#testimonials" },
  ];

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-brand-hairline bg-white px-4 md:px-8">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-medium text-brand-ink select-none">
          <Image
            src="/hyperhire-icon-gradient.png"
            alt="HyperHire Icon"
            width={32}
            height={32}
            className="h-8 w-8 rounded-[10px]"
          />
          <span>HyperHire</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-normal text-brand-body">
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" size="sm" className="h-10 px-4 text-sm" nativeButton={false} render={
            <Link href="/login">Log In</Link>
          } />
          <Button size="sm" className="h-10 px-4 text-sm" nativeButton={false} render={
            <Link href="/signup">Sign up for free</Link>
          } />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full flex flex-col gap-4 overflow-hidden border-b border-brand-hairline bg-white px-6 py-6 md:hidden"
          >
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-sm font-normal text-brand-body"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 border-t border-brand-hairline pt-4">
              <Button variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)} nativeButton={false} render={
                <Link href="/login">Log In</Link>
              } />
              <Button className="w-full" onClick={() => setMobileMenuOpen(false)} nativeButton={false} render={
                <Link href="/signup">Sign up for free</Link>
              } />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
