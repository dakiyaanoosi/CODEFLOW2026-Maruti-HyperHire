"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    {
      title: "Product",
      items: [
        { name: "Features", href: "#features" },
        { name: "AI Matching", href: "#ai-intelligence" },
        { name: "Workflow", href: "#workflow" },
        { name: "Workspace", href: "/dashboard" },
      ],
    },
    {
      title: "Resources",
      items: [
        { name: "Documentation", href: "#" },
        { name: "Student Guide", href: "#" },
        { name: "Business Hub", href: "#" },
        { name: "Trust & Safety", href: "#" },
      ],
    },
    {
      title: "Company",
      items: [
        { name: "About", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Contact", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-card/30 py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl select-none">
              <Image
                src="/hyperhire-icon-gradient.png"
                alt="HyperHire Icon"
                width={32}
                height={32}
                className="w-8 h-8 rounded-md"
              />
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent font-extrabold tracking-tight">
                HyperHire
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-sm leading-relaxed">
              An AI-native hyperlocal workforce operating system connecting businesses with skilled student talent instantly and securely.
            </p>
          </div>

          {/* Links Cols */}
          {links.map((col) => (
            <div key={col.title} className="text-left space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {col.title}
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm font-medium">
                {col.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Col */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-accent/60 text-[11px] sm:text-xs text-muted-foreground font-medium">
          <span>&copy; {currentYear} HyperHire. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
