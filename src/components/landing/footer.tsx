"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    {
      title: "Platform",
      items: ["Features", "AI Matching", "Workflow", "Workspace"],
    },
    {
      title: "Solutions",
      items: ["For Businesses", "For Students", "Trust & Safety", "Payments"],
    },
    {
      title: "Resources",
      items: ["Documentation", "Student Guide", "Business Hub", "Support"],
    },
    {
      title: "Company",
      items: ["About", "Careers", "Contact", "Legal"],
    },
  ];

  return (
    <footer className="bg-white px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-4 lg:col-span-2">
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
            <p className="max-w-sm text-sm font-normal leading-[1.25] text-brand-body">
              An AI-native hyperlocal workforce operating system connecting businesses with skilled student talent.
            </p>
          </div>

          {links.map((col) => (
            <div key={col.title} className="space-y-3">
              <h3 className="text-sm font-medium leading-[1.35] tracking-[0.16px] text-brand-ink">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm font-normal leading-[1.25] text-brand-muted">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-brand-hairline pt-8 text-sm font-normal text-brand-muted sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {currentYear} HyperHire. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="#" className="text-brand-muted">Privacy Policy</Link>
            <Link href="#" className="text-brand-muted">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
