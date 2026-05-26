"use client";

import {
  EMAIL_FILTER_TABS,
  countEmailsForFilter,
  emailFilterBadgeClass,
  type EmailFilterTab,
} from "@/lib/emails-ui";
import type { PriorityEmail } from "@/types/domain";

interface EmailCategoryBannerProps {
  allEmails: PriorityEmail[];
  activeTab: EmailFilterTab;
  onTabChange: (tab: EmailFilterTab) => void;
}

export function EmailCategoryBanner({ allEmails, activeTab, onTabChange }: EmailCategoryBannerProps) {
  return (
    <div className="shrink-0 overflow-x-auto px-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center gap-1.5">
        {EMAIL_FILTER_TABS.map((tab) => {
          const count = countEmailsForFilter(allEmails, tab.id);
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition-all duration-200 ${
                active
                  ? "border-violet-200 bg-violet-50/90 text-violet-800 shadow-sm shadow-violet-500/5"
                  : "border-slate-200/90 bg-white text-[#475569] hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`min-w-[1.25rem] rounded-md px-1 py-0.5 text-center text-[10px] font-semibold leading-none ${emailFilterBadgeClass[tab.id]}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
