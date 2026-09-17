import React from "react"
import { cn } from "@/lib/utils"

export interface KpiCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  value: React.ReactNode
  subValue?: React.ReactNode
  icon: React.ElementType
  badgeLabel?: React.ReactNode
  badgeIcon?: React.ElementType
  badgeVariant?: "up" | "down" | "neutral" | "info"
  delayClass?: string
  accentColor?: string
  shadowHover?: string
  dotColor?: string
}

export function KpiCard({
  title,
  value,
  subValue,
  icon: Icon,
  badgeLabel,
  badgeIcon: BadgeIcon,
  badgeVariant = "neutral",
  delayClass,
  accentColor = "#6366f1",
  shadowHover = "rgba(99, 102, 241, 0.1)",
  dotColor = "#6366f1",
  className,
  ...props
}: KpiCardProps) {
  return (
    <div
      className={cn("wm-card animate-fade-up", delayClass, className)}
      style={
        {
          "--card-accent": accentColor,
          "--wm-color": accentColor,
          "--shadow-hover": shadowHover,
          "--dot-color": dotColor,
        } as React.CSSProperties
      }
      {...props}
    >
      <Icon className="watermark" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="wm-dot"></div>
          <p className="wm-label">{title}</p>
        </div>
        {badgeLabel != null && badgeLabel !== "" && (
          <div className={cn("wm-badge", badgeVariant)}>
            {badgeVariant === "info" ? (
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            ) : BadgeIcon ? (
              <BadgeIcon className="w-3.5 h-3.5" />
            ) : null}
            {badgeLabel}
          </div>
        )}
      </div>
      <div>
        <p className="wm-value">{value}</p>
        {subValue && <p className="wm-sublabel mt-2">{subValue}</p>}
      </div>
    </div>
  )
}
