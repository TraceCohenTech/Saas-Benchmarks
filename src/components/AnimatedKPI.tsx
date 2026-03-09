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
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm"
    >
      <p className="text-sm text-zinc-400 font-medium mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white tracking-tight">
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
        {delta !== null && delta !== undefined && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: delay + 1.5 }}
            className={`text-sm font-semibold ${
              isPositive
                ? "text-emerald-400"
                : isNegative
                ? "text-red-400"
                : "text-zinc-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {delta.toFixed(1)}%{deltaLabel ? ` ${deltaLabel}` : ""}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
