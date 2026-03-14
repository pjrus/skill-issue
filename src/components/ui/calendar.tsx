"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-card/80 backdrop-blur-md rounded-2xl shadow-md border border-border/50", className)}
      classNames={{
        months: "relative",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-bold tracking-tight text-foreground",
        nav: "flex items-center justify-between absolute w-full z-10 px-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent/50 transition-all duration-200 rounded-full"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent/50 transition-all duration-200 rounded-full"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "grid grid-cols-7 mb-2",
        weekday: "text-muted-foreground font-semibold text-[0.7rem] uppercase tracking-widest text-center",
        week: "grid grid-cols-7 w-full mt-1",
        day: "flex items-center justify-center p-0 relative overflow-visible",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:scale-110 hover:bg-primary/10 transition-all duration-300 rounded-xl relative overflow-hidden group"
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] font-black scale-105 z-10",
        today: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full font-bold text-primary",
        outside:
          "text-foreground/60 aria-selected:bg-accent/30 aria-selected:text-foreground/70",
        disabled: "text-foreground/60 cursor-not-allowed",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-5 w-5" {...props} />
          }
          return <ChevronRight className="h-5 w-5" {...props} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
