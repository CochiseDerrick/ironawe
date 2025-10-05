
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { getSettings } from "@/lib/database";
import { updateTheme } from "@/actions/update-theme";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
    { name: 'Forged', value: 'theme-forged' },
    { name: 'Blueprint', value: 'theme-blueprint' },
    { name: 'Welder\'s Arc', value: 'theme-welders-arc' },
    { name: 'Molten Core', value: 'theme-molten-core' },
    { name: 'Graphite', value: 'theme-graphite' },
    { name: 'Oxidized', value: 'theme-oxidized' },
];

const ThemePreview = ({ theme }: { theme: string }) => (
    <div className={cn("space-y-1.5 rounded-md border-2 p-2", theme)}>
        <div className="space-y-2 rounded-sm bg-slate-950 p-2">
            <div className="space-y-2 rounded-md bg-background p-2 shadow-sm">
                <div className="h-2 w-20 rounded-lg bg-primary" />
                <div className="h-2 w-10 rounded-lg bg-accent" />
            </div>
            <div className="flex items-center space-x-2 rounded-md bg-secondary p-2">
                <div className="h-4 w-4 rounded-full bg-primary" />
                <div className="h-2 w-full rounded-lg bg-muted-foreground" />
            </div>
             <div className="flex items-center space-x-2 rounded-md bg-secondary p-2">
                <div className="h-4 w-4 rounded-full bg-accent" />
                <div className="h-2 w-full rounded-lg bg-muted-foreground" />
            </div>
        </div>
        <span className="block w-full text-center text-xs font-normal text-muted-foreground">
           {THEMES.find(t => t.value === theme)?.name}
        </span>
    </div>
)


export default function AppearancePage() {
  const [currentTheme, setCurrentTheme] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { setTheme } = useTheme();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getSettings();
        const defaultTheme = settings?.defaultTheme || "theme-forged";
        setCurrentTheme(defaultTheme);
        setSelectedTheme(defaultTheme);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load settings",
          description: "Could not fetch appearance settings from the database.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [toast]);

  const handleThemeChange = (newTheme: string) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
  }

  const handleSave = async () => {
    setSaving(true);
    const result = await updateTheme(selectedTheme);
    if (result.success) {
      setCurrentTheme(selectedTheme);
      toast({
        title: "Theme Updated",
        description: "The default theme has been saved successfully.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: result.error || "Could not save the new theme.",
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Appearance</h1>
        <p className="text-muted-foreground">
          Customize the look and feel of your storefront.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Default Theme</CardTitle>
          <CardDescription>
            Select the default theme for all visitors to your store. They can still override this in the settings menu.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <RadioGroup
                value={selectedTheme}
                onValueChange={handleThemeChange}
                className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4"
            >
                {THEMES.map(theme => (
                    <Label key={theme.value} htmlFor={theme.value} className="cursor-pointer relative">
                         <RadioGroupItem value={theme.value} id={theme.value} className="sr-only" />
                         <ThemePreview theme={theme.value} />
                         {selectedTheme === theme.value && (
                            <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-4 w-4" />
                            </div>
                         )}
                    </Label>
                ))}
            </RadioGroup>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || selectedTheme === currentTheme}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
        </Button>
      </div>
    </div>
  );
}
