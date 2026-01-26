"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "./ui/button";

export function Navbar() {
  return (
    <motion.header
      className="glass-nav sticky top-0 z-50 w-full"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center"
          aria-label="Neon Cabinet home"
        >
          <motion.div
            className="relative h-10 w-32 sm:h-12 sm:w-40"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Image
              src="/assets/neon-cabinet-logo-small.png"
              alt="Neon Cabinet"
              fill
              unoptimized
              className="object-contain"
            />
          </motion.div>
        </Link>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="font-sans text-xs uppercase tracking-wider"
            aria-label="Login (coming soon)"
          >
            <Link href="#">Login</Link>
          </Button>
        </div>
      </nav>
    </motion.header>
  );
}
