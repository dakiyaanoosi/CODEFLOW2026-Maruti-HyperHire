"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-6 select-none">
          <Image
            src="/hyperhire-icon-gradient.png"
            alt="HyperHire Icon"
            width={40}
            height={40}
            className="w-10 h-10 rounded-md"
          />
          <span className="text-brand-ink font-extrabold text-2xl tracking-tight">
            HyperHire
          </span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-6 border border-brand-hairline rounded-[12px] sm:px-10">
          <div className="mb-6 text-left">
            <h2 className="text-2xl font-medium tracking-tight text-brand-ink leading-tight">
              {title}
            </h2>
            <p className="mt-2 text-sm text-brand-muted font-normal">
              {subtitle}
            </p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
export default AuthCard;
