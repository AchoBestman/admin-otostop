"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  from?: string;
  to?: string;
  onRangeChange: (from?: Date, to?: Date) => void;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onRangeChange,
  className,
}: DateRangePickerProps) {
  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!from) return undefined;
    return {
      from: new Date(from),
      to: to ? new Date(to) : undefined,
    };
  }, [from, to]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y", { locale: fr })} -{" "}
                  {format(dateRange.to, "LLL dd, y", { locale: fr })}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y", { locale: fr })
              )
            ) : (
              <span>Filtrer par date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => onRangeChange(range?.from, range?.to)}
            numberOfMonths={2}
            locale={fr}
          />
          {(from || to) && (
            <div className="p-3 border-t border-border flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onRangeChange(undefined, undefined)}
                className="text-xs"
              >
                <X className="mr-2 h-3 w-3" />
                Effacer
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
