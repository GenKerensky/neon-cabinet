"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Game } from "@/lib/games";

interface GameCardProps {
  game: Game;
  index?: number;
}

export function GameCard({ game, index = 0 }: GameCardProps) {
  const CardWrapper = game.comingSoon ? "div" : Link;
  const wrapperProps = game.comingSoon
    ? { className: "group block cursor-default" }
    : { href: game.href, className: "group block" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: index * 0.1,
      }}
    >
      <CardWrapper {...(wrapperProps as React.ComponentProps<typeof Link>)}>
        <motion.div
          className="cabinet-card relative flex h-[300px] min-w-[400px]"
          whileHover={game.comingSoon ? {} : { scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Cabinet image - left side, full height */}
          <div className="relative w-44 flex-shrink-0 overflow-hidden sm:w-52">
            {/* Subtle inner shadow for depth */}
            <div className="absolute inset-0 z-10 shadow-[inset_-8px_0_16px_rgba(0,0,0,0.3)]" />

            <motion.div
              className={`relative h-full w-full ${game.comingSoon ? "grayscale-[30%]" : ""}`}
              whileHover={game.comingSoon ? {} : { scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <Image
                src={game.thumbnail}
                alt={`${game.name} arcade cabinet`}
                fill
                unoptimized
                className="object-contain object-center p-2"
                sizes="128px"
              />
            </motion.div>
          </div>

          {/* Content - right side */}
          <div className="relative flex flex-1 flex-col justify-start overflow-hidden border-l border-nc-border-soft p-4">
            {/* Neon accent line on left edge */}
            <motion.div
              className={`absolute bottom-4 left-0 top-4 w-[2px] ${game.comingSoon ? "bg-nc-neon-purple/30" : "bg-nc-neon-purple/50"}`}
              whileHover={
                game.comingSoon
                  ? {}
                  : {
                      backgroundColor: "rgba(176, 38, 255, 1)",
                      boxShadow: "0 0 10px rgba(176, 38, 255, 0.6)",
                    }
              }
            />

            {/* Title */}
            <h3
              className={`text-center font-display text-base font-semibold uppercase tracking-wide transition-colors duration-200 sm:text-lg ${
                game.comingSoon
                  ? "text-nc-text-secondary"
                  : "text-nc-text-primary group-hover:text-nc-neon-green"
              }`}
            >
              {game.name}
            </h3>

            {/* Description */}
            <p className="mt-2 line-clamp-3 text-xs text-nc-text-secondary sm:text-sm">
              {game.description}
            </p>

            {/* Play indicator for available games */}
            {!game.comingSoon && (
              <motion.div
                className="mt-3 flex items-center gap-1.5 text-nc-neon-green opacity-0 transition-opacity group-hover:opacity-100"
                initial={false}
              >
                <span className="font-pixel text-[10px] uppercase tracking-wider">
                  Play Now
                </span>
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.div>
            )}
          </div>

          {/* Hover glow overlay */}
          {!game.comingSoon && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] opacity-0"
              style={{
                boxShadow: "inset 0 0 30px rgba(57, 255, 20, 0.1)",
              }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Coming Soon token - gold arcade token */}
          {game.comingSoon && (
            <motion.div
              className="absolute -bottom-10 -right-10 z-40 h-24 w-24 rotate-[15deg] sm:h-28 sm:w-28"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 15 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: index * 0.1 + 0.3,
              }}
            >
              <Image
                src="/assets/coming-soon-token.png"
                alt="Coming Soon"
                fill
                unoptimized
                className="object-contain drop-shadow-lg"
              />
            </motion.div>
          )}
        </motion.div>
      </CardWrapper>
    </motion.div>
  );
}
