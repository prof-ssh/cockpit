"use client";

import { Check, PlusCircle } from "lucide-react";
import { Badge } from "@/frontend/design-system/components/ui/badge";
import { Button } from "@/frontend/design-system/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/frontend/design-system/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/design-system/components/ui/popover";
import { Separator } from "@/frontend/design-system/components/ui/separator";
import { cn } from "@/frontend/design-system/lib/utils";

export type FacetedOption = { value: string; label: string; count: number };

type FacetedFilterProps = {
  title: string;
  options: FacetedOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

/** Filtro da barra de uma tabela: botão tracejado que abre as opções com contagem. */
export function FacetedFilter({ title, options, selected, onChange }: FacetedFilterProps) {
  const alternar = (valor: string) =>
    onChange(selected.includes(valor) ? selected.filter((v) => v !== valor) : [...selected, valor]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle aria-hidden />
          {title}
          {selected.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              {options
                .filter((o) => selected.includes(o.value))
                .map((o) => (
                  <Badge key={o.value} variant="secondary" className="rounded-sm px-1 font-normal">
                    {o.label}
                  </Badge>
                ))}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((o) => {
                const marcado = selected.includes(o.value);
                return (
                  <CommandItem key={o.value} onSelect={() => alternar(o.value)}>
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-[4px] border border-input",
                        marcado && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {marcado && <Check className="size-3 text-primary-foreground" aria-hidden />}
                    </span>
                    <span>{o.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{o.count}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => onChange([])} className="justify-center text-center">
                    Limpar filtro
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
