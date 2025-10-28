
"use client";

import { useEffect, useState, useMemo } from "react";
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
import { getSettings, getProducts, Product } from "@/lib/database";
import { updateTheme, updateCategoryOrder } from "@/actions/update-theme";
import { Loader2, Check, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
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

interface SettingsData {
    defaultTheme?: string;
    categoryOrder?: string[];
}

export default function AppearancePage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedTheme, setSelectedTheme] = useState("");
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { setTheme } = useTheme();

  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedSettings, fetchedProducts] = await Promise.all([
          getSettings(),
          getProducts(),
        ]);
        
        setSettings(fetchedSettings);
        setProducts(fetchedProducts);

        const defaultTheme = fetchedSettings?.defaultTheme || "theme-forged";
        setSelectedTheme(defaultTheme);
        
        const allCategories = [...new Set(fetchedProducts.map(p => p.category || 'Uncategorized'))];
        const savedOrder = fetchedSettings?.categoryOrder || [];
        const newCategories = allCategories.filter(c => !savedOrder.includes(c));
        setCategoryOrder([...savedOrder, ...newCategories]);

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
    fetchData();
  }, [toast]);

  const uniqueCategories = useMemo(() => {
      const allCategories = [...new Set(products.map(p => p.category || 'Uncategorized'))];
      const savedOrder = settings?.categoryOrder || [];
      const newCategories = allCategories.filter(c => !savedOrder.includes(c));
      return [...savedOrder, ...newCategories];
  }, [products, settings]);

  useEffect(() => {
      setCategoryOrder(uniqueCategories);
  }, [uniqueCategories]);

  const handleThemeChange = (newTheme: string) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
  }

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...categoryOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setCategoryOrder(newOrder);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        const themeResult = await updateTheme(selectedTheme);
        const categoryResult = await updateCategoryOrder(categoryOrder);

        if (themeResult.success && categoryResult.success) {
            setSettings(prev => ({...prev, defaultTheme: selectedTheme, categoryOrder}));
            toast({
                title: "Appearance Updated",
                description: "Your appearance settings have been saved.",
            });
        } else {
            throw new Error(themeResult.error || categoryResult.error || "An unknown error occurred.");
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Save Failed",
            description: error instanceof Error ? error.message : "Could not save settings.",
        });
    }
    setSaving(false);
  };
  
  const isSaveDisabled = saving || (selectedTheme === settings?.defaultTheme && JSON.stringify(categoryOrder) === JSON.stringify(settings?.categoryOrder || uniqueCategories));

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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader>
            <CardTitle>Default Theme</CardTitle>
            <CardDescription>
                Select the default theme for all visitors to your store.
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
        <Card>
            <CardHeader>
                <CardTitle>Category Order</CardTitle>
                <CardDescription>Set the display order of product categories on the homepage.</CardDescription>
            </CardHeader>
            <CardContent>
                {categoryOrder.length > 0 ? (
                    <ul className="space-y-2 rounded-md border p-2">
                        {categoryOrder.map((category, index) => (
                            <li key={category} className="flex items-center justify-between rounded-md bg-secondary p-3">
                                <div className="flex items-center gap-2">
                                     <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">{category}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleMoveCategory(index, 'up')}
                                        disabled={index === 0}
                                        aria-label={`Move ${category} up`}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleMoveCategory(index, 'down')}
                                        disabled={index === categoryOrder.length - 1}
                                        aria-label={`Move ${category} down`}
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                     <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">No categories found.</p>
                        <p className="text-xs text-muted-foreground mt-1">Add products with categories to order them here.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaveDisabled}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
        </Button>
      </div>
    </div>
  );
}
