"use client";

import { games } from "../lib/games";
import { GameCard } from "../components/game-card";
import { MotionButton } from "../components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative">
      {/* Scene lighting overlay */}
      <div className="scene-light pointer-events-none fixed inset-0" />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        {/* Ambient glow behind hero */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-nc-neon-purple/10 blur-[120px]" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Hero Text */}
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            >
              {/* Pixel subtitle */}
              <motion.p
                className="mb-4 font-pixel text-xs uppercase tracking-widest text-nc-neon-purple"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome to the
              </motion.p>

              {/* Main headline */}
              <motion.h1
                className="font-display text-4xl font-black uppercase tracking-arcade text-nc-text-primary sm:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="neon-text-green">Neon</span>{" "}
                <span className="neon-text-purple">Cabinet</span>
              </motion.h1>

              {/* Tagline */}
              <motion.p
                className="mt-6 max-w-lg font-sans text-lg text-nc-text-secondary lg:text-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Step into the glow. Classic arcade action, reimagined for the
                modern web. No quarters required.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link href="/games/space-defender">
                  <MotionButton size="lg" className="font-display">
                    Start Playing
                  </MotionButton>
                </Link>
                <MotionButton
                  variant="secondary"
                  size="lg"
                  className="font-display"
                >
                  Browse Games
                </MotionButton>
              </motion.div>

              {/* Stats/info line */}
              <motion.div
                className="mt-12 flex items-center justify-center gap-8 lg:justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="text-center">
                  <p className="font-pixel text-lg text-nc-neon-green">
                    {games.length}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-nc-text-muted">
                    Games
                  </p>
                </div>
                <div className="h-8 w-px bg-nc-border-soft" />
                <div className="text-center">
                  <p className="font-pixel text-lg text-nc-neon-cyan">Free</p>
                  <p className="text-xs uppercase tracking-wider text-nc-text-muted">
                    To Play
                  </p>
                </div>
                <div className="h-8 w-px bg-nc-border-soft" />
                <div className="text-center">
                  <p className="font-pixel text-lg text-nc-neon-pink">∞</p>
                  <p className="text-xs uppercase tracking-wider text-nc-text-muted">
                    Lives
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Image - Arcade Cabinet */}
            <motion.div
              className="relative flex justify-center lg:justify-end"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            >
              {/* Glow effect behind cabinet */}
              <div className="absolute inset-0 -z-10 translate-y-4">
                <div className="h-full w-full rounded-3xl bg-nc-neon-purple/30 blur-[60px]" />
              </div>

              <div className="relative">
                <div className="hero-glow relative aspect-[3/4] w-64 sm:w-80 lg:w-96">
                  <Image
                    src="/assets/neon-cabinet-logo-big.png"
                    alt="Neon Cabinet Arcade Machine"
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
                  />
                </div>

                {/* Reflection effect */}
                <div className="absolute -bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 bg-gradient-to-b from-nc-neon-purple/20 to-transparent blur-xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <h2 className="font-display text-2xl font-bold uppercase tracking-arcade text-nc-text-primary sm:text-3xl">
              Choose Your <span className="neon-text-green">Game</span>
            </h2>
            <p className="mt-3 font-sans text-nc-text-secondary">
              Step up to a cabinet and test your skills.
            </p>

            {/* Decorative line */}
            <motion.div
              className="mx-auto mt-6 h-[2px] w-24 bg-gradient-to-r from-transparent via-nc-neon-purple to-transparent"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />
          </motion.div>

          {/* Games grid */}
          <div className="grid gap-5 md:grid-cols-2">
            {games.map((game, index) => (
              <GameCard key={game.id} game={game} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-nc-neon-purple/30 to-transparent" />

      {/* Simple footer */}
      <footer className="py-8">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <p className="font-pixel text-xs text-nc-text-muted">
            © 2026 Neon Cabinet
          </p>
        </div>
      </footer>
    </div>
  );
}
