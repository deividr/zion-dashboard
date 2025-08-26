"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";
import { type DateRange } from "react-day-picker";

export default function Calendar23({
    range,
    onSelect,
}: {
    range?: DateRange;
    onSelect?: (range: DateRange | undefined) => void;
}) {
    const handleSelect = (range: DateRange | undefined) => {
        if (onSelect) {
            onSelect(range);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="dates"
                        className="w-full justify-between font-normal"
                    >
                        {range?.from && range?.to
                            ? `${range.from.toLocaleDateString(new Intl.Locale("pt-BR"))} - ${range.to.toLocaleDateString(new Intl.Locale("pt-BR"))}`
                            : "Selecionar período"}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                >
                    <Calendar
                        mode="range"
                        selected={range}
                        captionLayout="dropdown"
                        onSelect={handleSelect}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
