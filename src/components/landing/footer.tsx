"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-background px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Giant Display Brand Name */}
        <div className="select-none py-4">
          <h1 className="text-center font-bold tracking-[-0.06em] text-[13vw] sm:text-[14vw] md:text-[15vw] leading-none text-brand-ink dark:text-white font-sans w-full block transition-all duration-300 hover:tracking-[-0.05em]">
            HyperHire
          </h1>
        </div>

        {/* Footer Meta Row */}
        <div className="flex flex-col gap-4 border-t border-brand-hairline dark:border-brand-hairline/10 pt-8 text-sm font-normal text-brand-muted dark:text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {currentYear} HyperHire. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="#" className="text-brand-muted dark:text-zinc-500 hover:text-brand-ink dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-brand-muted dark:text-zinc-500 hover:text-brand-ink dark:hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
