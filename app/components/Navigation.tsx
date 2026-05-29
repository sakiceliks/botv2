"use client";

import { motion } from "framer-motion";
import { Layers, Plus, MessageSquare, Zap, Sparkles } from "lucide-react";

export type NavTab = "queue" | "whatsapp" | "settings";

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onManualClick: () => void;
  onBulkClick: () => void;
}

const TABS = [
  { key: "queue" as NavTab, label: "Kuyruk", icon: Layers },
  { key: "whatsapp" as NavTab, label: "WhatsApp", icon: MessageSquare },
  { key: "settings" as NavTab, label: "Ayarlar", icon: Zap },
] as const;

export default function Navigation({
  activeTab,
  onTabChange,
  onManualClick,
  onBulkClick,
}: NavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-2 sm:px-4 sm:pb-3 lg:hidden">
      <nav className="relative mx-auto w-full max-w-lg rounded-[22px] border border-white/10 bg-[#111827]/95 px-3 py-3 shadow-[0_-8px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                aria-label={tab.label}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-all duration-200 min-w-0 ${
                  isActive ? "text-[#11F08E]" : "text-zinc-500"
                }`}
              >
                <motion.div
                  animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
                </motion.div>
                <span className={`text-[9px] font-bold leading-none tracking-wider ${
                  isActive ? "text-[#11F08E]" : "text-zinc-500"
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onManualClick}
              aria-label="Manuel Ekle"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#11F08E]/10 border border-[#11F08E]/20 text-[#11F08E] active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Manuel</span>
            </button>
            <button
              type="button"
              onClick={onBulkClick}
              aria-label="Toplu Ekle"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white active:scale-95 transition-all shadow-lg shadow-violet-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Hızlı</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
