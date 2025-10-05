
"use client"

import * as React from "react"
import { Check, Contrast, Palette, Settings as SettingsIcon, Type } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const FONT_SIZES = [
  { name: 'Small', value: '14px' },
  { name: 'Default', value: '16px' },
  { name: 'Large', value: '18px' },
];

const THEMES = [
    { name: 'Forged', value: 'theme-forged', icon: Palette },
    { name: 'Blueprint', value: 'theme-blueprint', icon: Palette },
    { name: 'Welder\'s Arc', value: 'theme-welders-arc', icon: Contrast },
    { name: 'Molten Core', value: 'theme-molten-core', icon: Palette },
    { name: 'Graphite', value: 'theme-graphite', icon: Contrast },
    { name: 'Oxidized', value: 'theme-oxidized', icon: Palette },
];

export function Settings() {
  const { setTheme, theme } = useTheme()
  const [fontSize, setFontSize] = React.useState('16px');

  React.useEffect(() => {
    const storedFontSize = localStorage.getItem('ironawe-font-size') || '16px';
    setFontSize(storedFontSize);
    document.documentElement.style.setProperty('--font-size', storedFontSize);
  }, []);

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    document.documentElement.style.setProperty('--font-size', size);
    localStorage.setItem('ironawe-font-size', size);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Appearance settings">
          <SettingsIcon className="h-[1.2rem] w-[1.2rem] transition-all" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Theme Selector */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    {THEMES.map((themeOption) => (
                        <DropdownMenuRadioItem key={themeOption.value} value={themeOption.value} className="capitalize">
                           <themeOption.icon className="mr-2 h-4 w-4" />
                           {themeOption.name}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        
        {/* Font Size Selector */}
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Type className="mr-2 h-4 w-4" />
                <span>Font Size</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={fontSize} onValueChange={handleFontSizeChange}>
                        {FONT_SIZES.map((size) => (
                        <DropdownMenuRadioItem key={size.value} value={size.value}>
                            {size.name}
                        </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
