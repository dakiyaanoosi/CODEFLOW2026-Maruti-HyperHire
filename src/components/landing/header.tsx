"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "AI Intelligence", href: "#ai-intelligence" },
    { name: "Workflow", href: "#workflow" },
    { name: "Testimonials", href: "#testimonials" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-8",
        isScrolled
          ? "py-3 bg-white/90 backdrop-blur-md border-b border-brand-hairline shadow-sm"
          : "py-5 bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        {/* Brand logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl select-none">
          <Image
            src="/hyperhire-icon-gradient.png"
            alt="HyperHire Icon"
            width={32}
            height={32}
            className="w-8 h-8 rounded-md"
          />
          <span className="text-brand-ink font-extrabold tracking-tight">
            HyperHire
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-brand-muted hover:text-brand-ink transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Button variant="outline" className="h-9 rounded-[12px] border-brand-hairline bg-white text-brand-ink px-5 font-semibold text-sm hover:bg-brand-surface-soft hover:text-brand-ink" nativeButton={false} render={
            <Link href="/dashboard">Log In</Link>
          } />
          <Button className="h-9 rounded-[12px] bg-brand-primary text-white hover:bg-brand-primary/90 px-5 font-semibold text-sm shadow-sm" nativeButton={false} render={
            <Link href="/dashboard">Launch Workspace</Link>
          } />
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b bg-background/95 backdrop-blur-md absolute top-full left-0 right-0 py-4 px-6 overflow-hidden flex flex-col gap-4 shadow-lg"
          >
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 pt-2 border-t">
              <Button variant="outline" className="w-full h-10 rounded-[12px] border-brand-hairline bg-white text-brand-ink" onClick={() => setMobileMenuOpen(false)} nativeButton={false} render={
                <Link href="/dashboard">Log In</Link>
              } />
              <Button className="w-full h-10 rounded-[12px] bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm" onClick={() => setMobileMenuOpen(false)} nativeButton={false} render={
                <Link href="/dashboard">Launch Workspace</Link>
              } />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
