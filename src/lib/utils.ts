import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Responsive container class for full width sections
export const fullWidthContainer = "w-full max-w-full"

export const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      console.log(`Script already loaded: ${src}`);
      resolve(true);
      return;
    }

    console.log(`Loading script: ${src}`);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      console.log(`Script loaded successfully: ${src}`);
      resolve(true);
    };
    script.onerror = () => {
      console.error(`Error loading script: ${src}`);
      resolve(false);
    };
    document.body.appendChild(script);
  });
};
