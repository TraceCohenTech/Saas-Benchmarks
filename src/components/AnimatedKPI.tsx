"use client";

import CountUp from "react-countup";
import { motion } from "framer-motion";

interface AnimatedKPIProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  delta?: number | null;
  deltaLabel?: string;
  delay?: number;
}

export default function AnimatedKPI({
  label,
  value,
  suffix = "",
  prefix = "",
  decimals = 1,
  delta,
  deltaLabel,
  delay = 0,
}: AnimatedKPIProps) {
  const isPositive = delta !== null && delta !== undefined && delta > 0;
  const isNegative = delta !== null && delta !== undefined && delta < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-gradient-to-b from-zinc-800/80 to-zinc-900/80 border border-zinc-700/50 rounded-2xl p-3 sm:p-5 backdrop-blur-sm text-center"
    >
      <p className="text-[10px] sm:text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1 sm:mb-2">{label}</p>
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {prefix}
          <CountUp
            end={value}
            decimals={decimals}
            duration={1.8}
            delay={delay}
            separator=","
          />
          {suffix}
        </span>
      </div>
      {delta !== null && delta !== undefined && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: delay + 1.5 }}
          className={`text-sm font-semibold mt-1.5 ${
            isPositive
              ? "text-emerald-400"
              : isNegative
              ? "text-red-400"
              : "text-zinc-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {delta.toFixed(1)}%{deltaLabel ? ` ${deltaLabel}` : ""}
        </motion.p>
      )}
    </motion.div>
  );
}
