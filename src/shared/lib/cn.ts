import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Raios e sombras dos tokens TapMesa (globals.css) para que um className
// passado pela tela substitua o valor do componente em vez de somar a ele.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["chip", "control", "card", "sheet"],
      shadow: ["elevation-1", "elevation-2", "elevation-3"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
