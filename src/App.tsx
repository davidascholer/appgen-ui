import { useState, useEffect } from "react";
import type { ComponentType, SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  DownloadSimple,
  List,
  House,
  Gear,
  User,
  Bell,
  Star,
  MagnifyingGlass,
  Trash,
  ToggleLeft,
} from "@phosphor-icons/react";
import * as LucideIcons from "lucide-react";
import * as HeroIcons from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface NavPage {
  id: string;
  title: string;
  link: string;
  pageId: string;
  icon: {
    name: string;
    library: IconLibrary;
  };
}

interface ToggleSettingItem {
  id: string;
  label: string;
  type: "toggle";
  value: boolean;
}

interface InputSettingItem {
  id: string;
  label: string;
  type: "input";
  value: string;
}

interface SelectSettingItem {
  id: string;
  label: string;
  type: "select";
  value: string[];
}

type SettingsItem = ToggleSettingItem | InputSettingItem | SelectSettingItem;

interface PresetSettingsPage {
  id: string;
  kind: "preset";
  pageType: "settings";
  title: string;
  shown: boolean;
  items: SettingsItem[];
}

interface CustomPage {
  id: string;
  kind: "custom";
  pageType: "custom";
  title: string;
  shown: boolean;
}

interface PagesConfig {
  preset: PresetSettingsPage;
  custom: Record<string, never>;
}

interface AppConfig {
  id: string;
  components: {
    navigation: {
      shown: boolean;
      navigationHeader: string;
      navigationStyle: NavigationStyle;
      pages: NavPage[];
    };
  };
  pages: PagesConfig;
}

type DrawerState = "closed" | "icons-only" | "open";
type ActiveTab = "navigation" | "pages";
type PagesTab = "preset" | "custom";
type IconEntryMode = "default" | "manual";
type IconLibrary = "phosphor" | "lucide" | "heroicons";
type DrawerVariant = "short" | "long" | "all";
type BottomVariant = "short" | "long";

type NavigationStyle =
  | {
      type: "drawer";
      variant: DrawerVariant;
    }
  | {
      type: "bottom";
      variant: BottomVariant;
    };

const DEFAULT_NAV_ICON = {
  name: "House",
  library: "phosphor",
} as const;

const DEFAULT_NAVIGATION_STYLE: NavigationStyle = {
  type: "drawer",
  variant: "all",
};

const createDefaultSettingsPage = (): PresetSettingsPage => ({
  id: "settings",
  kind: "preset",
  pageType: "settings",
  title: "Settings",
  shown: true,
  items: [],
});

const getPhosphorIconComponent = (iconName: string) => {
  const iconMap = {
    house: House,
    gear: Gear,
    user: User,
    bell: Bell,
    star: Star,
    magnifyingglass: MagnifyingGlass,
  } as const;

  const normalized = iconName.trim().toLowerCase();
  return iconMap[normalized as keyof typeof iconMap] || House;
};

const getNormalizedIconKey = (name: string) =>
  name
    .trim()
    .replace(/[-_\s]+/g, "")
    .toLowerCase();

const getLucideIconComponent = (name: string) => {
  const normalized = getNormalizedIconKey(name);
  const entries = Object.entries(LucideIcons) as Array<
    [string, ComponentType<any>]
  >;

  for (const [key, component] of entries) {
    const baseKey = key.endsWith("Icon") ? key.slice(0, -4) : key;
    if (getNormalizedIconKey(baseKey) === normalized) {
      return component;
    }
  }

  return undefined;
};

const getHeroIconComponent = (name: string) => {
  const normalized = getNormalizedIconKey(name);
  const entries = Object.entries(HeroIcons) as Array<
    [string, ComponentType<SVGProps<SVGSVGElement>>]
  >;

  for (const [key, component] of entries) {
    const baseKey = key.endsWith("Icon") ? key.slice(0, -4) : key;
    if (getNormalizedIconKey(baseKey) === normalized) {
      return component;
    }
  }

  return undefined;
};

const renderNavIcon = (
  icon: { name: string; library: IconLibrary },
  className: string,
  size = 20,
) => {
  if (icon.library === "phosphor") {
    const IconComponent = getPhosphorIconComponent(icon.name);
    return <IconComponent size={size} className={className} />;
  }

  if (icon.library === "lucide") {
    const IconComponent = getLucideIconComponent(icon.name);
    if (IconComponent) {
      return <IconComponent size={size} className={className} />;
    }
  }

  if (icon.library === "heroicons") {
    const IconComponent = getHeroIconComponent(icon.name);
    if (IconComponent) {
      return <IconComponent className={`${className} h-5 w-5`} />;
    }
  }

  return <House size={size} className={className} />;
};

const DEFAULT_CONFIG: AppConfig = {
  id: crypto.randomUUID(),
  components: {
    navigation: {
      shown: true,
      navigationHeader: "",
      navigationStyle: DEFAULT_NAVIGATION_STYLE,
      pages: [],
    },
  },
  pages: {
    preset: createDefaultSettingsPage(),
    custom: {},
  },
};

const normalizeConfig = (input: unknown): AppConfig => {
  if (!input || typeof input !== "object") return DEFAULT_CONFIG;

  const maybeConfig = input as {
    id?: string;
    pages?: unknown;
    components?: {
      navigation?: {
        navigationHeader?: unknown;
        navigationStyle?: unknown;
        pages?: unknown;
        items?: unknown;
      };
      navigationDrawer?: {
        navigationHeader?: unknown;
        navigationStyle?: unknown;
        pages?: unknown;
        items?: unknown;
      };
      settings?: {
        shown?: unknown;
        items?: unknown;
      };
    };
  };

  const navRoot =
    maybeConfig.components?.navigation ?? maybeConfig.components?.navigationDrawer;

  const navStyleRaw = navRoot?.navigationStyle;
  const normalizedNavStyle: NavigationStyle = (() => {
    if (!navStyleRaw || typeof navStyleRaw !== "object") {
      return DEFAULT_NAVIGATION_STYLE;
    }

    const typeValue =
      "type" in navStyleRaw ? (navStyleRaw as { type?: unknown }).type : null;
    const variantValue =
      "variant" in navStyleRaw
        ? (navStyleRaw as { variant?: unknown }).variant
        : null;

    if (typeValue === "bottom") {
      return {
        type: "bottom",
        variant: variantValue === "long" ? "long" : "short",
      };
    }

    return {
      type: "drawer",
      variant:
        variantValue === "short" ||
        variantValue === "long" ||
        variantValue === "all"
          ? variantValue
          : "all",
    };
  })();

  const navPagesRaw = navRoot?.pages ?? navRoot?.items;

  const navPages: NavPage[] = Array.isArray(navPagesRaw)
    ? navPagesRaw.map((entry) => {
        const page = entry as Partial<NavPage> & {
          icon?: unknown;
        };

        let normalizedIcon = DEFAULT_NAV_ICON;
        if (typeof page.icon === "string") {
          normalizedIcon = {
            name: page.icon,
            library: "phosphor",
          };
        } else if (
          page.icon &&
          typeof page.icon === "object" &&
          "name" in page.icon &&
          "library" in page.icon
        ) {
          const iconObj = page.icon as {
            name?: unknown;
            library?: unknown;
          };

          const library =
            iconObj.library === "phosphor" ||
            iconObj.library === "lucide" ||
            iconObj.library === "heroicons"
              ? iconObj.library
              : "phosphor";

          normalizedIcon = {
            name:
              typeof iconObj.name === "string" && iconObj.name.trim().length > 0
                ? iconObj.name
                : "House",
            library,
          };
        }

        return {
          id: page.id || crypto.randomUUID(),
          title: typeof page.title === "string" ? page.title : "Untitled",
          link: typeof page.link === "string" ? page.link : "#",
          pageId:
            typeof page.pageId === "string" && page.pageId.trim().length > 0
              ? page.pageId
              : "settings",
          icon: normalizedIcon,
        };
      })
    : [];

  const parseSettingsItems = (value: unknown): SettingsItem[] =>
    Array.isArray(value)
      ? value.map((entry) => {
        const item = entry as Partial<SettingsItem> & {
          value?: unknown;
        };

        if (item.type === "toggle") {
          return {
            id: item.id || crypto.randomUUID(),
            label: typeof item.label === "string" ? item.label : "Setting",
            type: "toggle",
            value: Boolean(item.value),
          };
        }

        if (item.type === "select") {
          const normalizedOptions = Array.isArray(item.value)
            ? item.value.filter((v): v is string => typeof v === "string")
            : typeof item.value === "string" && item.value.length > 0
              ? [item.value]
              : [];

          return {
            id: item.id || crypto.randomUUID(),
            label: typeof item.label === "string" ? item.label : "Setting",
            type: "select",
            value: normalizedOptions,
          };
        }

        return {
          id: item.id || crypto.randomUUID(),
          label: typeof item.label === "string" ? item.label : "Setting",
          type: "input",
          value: typeof item.value === "string" ? item.value : "",
        };
      })
      : [];

  const legacySettingsItems = parseSettingsItems(
    maybeConfig.components?.settings?.items,
  );

  const parseSettingsPresetPage = (
    value: unknown,
  ): PresetSettingsPage | undefined => {
    if (!value || typeof value !== "object") return undefined;

    const page = value as {
      id?: unknown;
      kind?: unknown;
      pageType?: unknown;
      title?: unknown;
      shown?: unknown;
      items?: unknown;
    };

    const isSettingsPage =
      page.pageType === "settings" ||
      page.id === "settings" ||
      page.kind === "preset";

    if (!isSettingsPage) return undefined;

    return {
      id:
        typeof page.id === "string" && page.id.trim().length > 0
          ? page.id
          : "settings",
      kind: "preset",
      pageType: "settings",
      title:
        typeof page.title === "string" && page.title.trim().length > 0
          ? page.title
          : "Settings",
      shown: typeof page.shown === "boolean" ? page.shown : true,
      items: parseSettingsItems(page.items),
    };
  };

  const rawPages = maybeConfig.pages;
  const objectPreset =
    rawPages && typeof rawPages === "object" && !Array.isArray(rawPages)
      ? parseSettingsPresetPage((rawPages as { preset?: unknown }).preset)
      : undefined;

  const arrayPreset = Array.isArray(rawPages)
    ? rawPages
        .map((entry) => parseSettingsPresetPage(entry))
        .find((page): page is PresetSettingsPage => Boolean(page))
    : undefined;

  const fallbackSettingsPage: PresetSettingsPage = {
    ...createDefaultSettingsPage(),
    shown:
      typeof maybeConfig.components?.settings?.shown === "boolean"
        ? maybeConfig.components.settings.shown
        : true,
    items: legacySettingsItems,
  };

  const normalizedPages: PagesConfig = {
    preset: objectPreset || arrayPreset || fallbackSettingsPage,
    custom: {},
  };

  return {
    id: maybeConfig.id || crypto.randomUUID(),
    components: {
      navigation: {
        shown: true,
        navigationHeader:
          typeof navRoot?.navigationHeader === "string"
            ? navRoot.navigationHeader
            : "",
        navigationStyle: normalizedNavStyle,
        pages: navPages,
      },
    },
    pages: normalizedPages,
  };
};

function App() {
  const [config, setConfig] = useState<AppConfig>(() => {
    const persisted = localStorage.getItem("app-config");
    if (!persisted) return DEFAULT_CONFIG;

    try {
      return normalizeConfig(JSON.parse(persisted));
    } catch {
      return DEFAULT_CONFIG;
    }
  });
  const [drawerState, setDrawerState] = useState<DrawerState>("closed");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkPageId, setNewLinkPageId] = useState("settings");
  const [newLinkIconMode, setNewLinkIconMode] =
    useState<IconEntryMode>("default");
  const [newLinkIconLibrary, setNewLinkIconLibrary] =
    useState<IconLibrary>("phosphor");
  const [newLinkIconManual, setNewLinkIconManual] = useState("");
  const [newSettingLabel, setNewSettingLabel] = useState("");
  const [newSettingType, setNewSettingType] = useState<
    "toggle" | "input" | "select"
  >("toggle");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [iconHelpDialogOpen, setIconHelpDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("navigation");
  const [pagesTab, setPagesTab] = useState<PagesTab>("preset");
  const [selectedPresetPageId, setSelectedPresetPageId] = useState("settings");
  const [previewToggleValues, setPreviewToggleValues] = useState<
    Record<string, boolean>
  >({});
  const [previewInputValues, setPreviewInputValues] = useState<
    Record<string, string>
  >({});
  const [navDraftPages, setNavDraftPages] = useState<NavPage[]>(
    () => config.components.navigation.pages,
  );
  const [navDraftHeader, setNavDraftHeader] = useState<string>(
    () => config.components.navigation.navigationHeader,
  );
  const [navDraftStyle, setNavDraftStyle] = useState<NavigationStyle>(
    () => config.components.navigation.navigationStyle,
  );

  useEffect(() => {
    localStorage.setItem("app-config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    setNavDraftPages(config.components.navigation.pages);
  }, [config.components.navigation.pages]);

  useEffect(() => {
    setNavDraftHeader(config.components.navigation.navigationHeader);
  }, [config.components.navigation.navigationHeader]);

  useEffect(() => {
    setNavDraftStyle(config.components.navigation.navigationStyle);
  }, [config.components.navigation.navigationStyle]);

  const safeConfig = config || DEFAULT_CONFIG;
  const normalizedPages =
    safeConfig.pages &&
    typeof safeConfig.pages === "object" &&
    !Array.isArray(safeConfig.pages) &&
    "preset" in safeConfig.pages
      ? (safeConfig.pages as PagesConfig)
      : {
          preset: createDefaultSettingsPage(),
          custom: {},
        };
  const settingsPage = normalizedPages.preset;
  const presetPages = [normalizedPages.preset];
  const customPages = normalizedPages.custom;
  const pageTitleOptions = [
    {
      id: settingsPage.id,
      title: settingsPage.title,
      kind: "preset",
    },
    ...Object.entries(customPages).map(([id, value]) => ({
      id,
      title:
        value && typeof value === "object" && "title" in value
          ? String((value as { title?: unknown }).title || id)
          : id,
      kind: "custom",
    })),
  ];

  useEffect(() => {
    if (pageTitleOptions.length === 0) {
      setNewLinkPageId("settings");
      return;
    }

    const hasSelected = pageTitleOptions.some(
      (option) => option.id === newLinkPageId,
    );

    if (!hasSelected) {
      setNewLinkPageId(pageTitleOptions[0].id);
    }
  }, [newLinkPageId, pageTitleOptions]);

  const updateSettingsItems = (
    transform: (items: SettingsItem[]) => SettingsItem[],
  ) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      const pages =
        base.pages &&
        typeof base.pages === "object" &&
        !Array.isArray(base.pages) &&
        "preset" in base.pages
          ? (base.pages as PagesConfig)
          : {
              preset: createDefaultSettingsPage(),
              custom: {},
            };

      const nextPreset = {
        ...pages.preset,
        items: transform(pages.preset.items),
      };

      return {
        ...base,
        pages: {
          preset: nextPreset,
          custom: {},
        },
      };
    });
  };

  const navigationIsDirty =
    JSON.stringify(navDraftPages) !==
    JSON.stringify(safeConfig.components.navigation.pages);
  const navigationFormDirty =
    newLinkTitle.trim().length > 0 ||
    newLinkUrl.trim().length > 0 ||
    newLinkIconMode !== "default" ||
    newLinkIconLibrary !== "phosphor" ||
    newLinkIconManual.trim().length > 0;
  const navigationHasUnsavedChanges = navigationIsDirty || navigationFormDirty;
  const iconFormDirty =
    newLinkIconMode !== "default" ||
    newLinkIconLibrary !== "phosphor" ||
    newLinkIconManual.trim().length > 0;

  const updateNavigationHeader = (value: string) => {
    setNavDraftHeader(value);
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        components: {
          ...base.components,
          navigation: {
            ...base.components.navigation,
            navigationHeader: value,
          },
        },
      };
    });
  };

  const updateNavigationStyle = (style: NavigationStyle) => {
    setNavDraftStyle(style);
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        components: {
          ...base.components,
          navigation: {
            ...base.components.navigation,
            navigationStyle: style,
          },
        },
      };
    });
  };

  useEffect(() => {
    if (navDraftStyle.type !== "drawer") return;

    if (navDraftStyle.variant === "short" && drawerState === "open") {
      setDrawerState("closed");
      return;
    }

    if (navDraftStyle.variant === "long" && drawerState === "icons-only") {
      setDrawerState("closed");
    }
  }, [navDraftStyle, drawerState]);

  const buildNavigationIconFromForm = (): NavPage["icon"] =>
    newLinkIconMode === "manual"
      ? {
          name: newLinkIconManual.trim() || "House",
          library: newLinkIconLibrary,
        }
      : DEFAULT_NAV_ICON;

  const buildNavigationPageFromForm = (): NavPage => ({
    id: crypto.randomUUID(),
    title: newLinkTitle.trim(),
    link: newLinkUrl.trim() || "#",
    pageId: newLinkPageId,
    icon: buildNavigationIconFromForm(),
  });

  const addNavigationPage = () => {
    if (!newLinkTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const newPage: NavPage = buildNavigationPageFromForm();

    setNavDraftPages((current) => [...current, newPage]);

    setNewLinkTitle("");
    setNewLinkUrl("");
    toast.success("Link added");
  };

  const removeNavigationPage = (id: string) => {
    setNavDraftPages((current) => current.filter((page) => page.id !== id));
    toast.success("Link removed");
  };

  const saveNavigationChanges = () => {
    if (!navigationHasUnsavedChanges) return;

    let nextPages = navDraftPages;
    if (navigationFormDirty) {
      if (newLinkTitle.trim()) {
        nextPages = [...nextPages, buildNavigationPageFromForm()];
      } else if (iconFormDirty && nextPages.length > 0) {
        const lastIndex = nextPages.length - 1;
        const updatedLastPage = {
          ...nextPages[lastIndex],
          icon: buildNavigationIconFromForm(),
        };

        nextPages = [...nextPages.slice(0, lastIndex), updatedLastPage];
      } else if (iconFormDirty && nextPages.length === 0) {
        toast.error("Add a page title first, then save your icon changes");
        return;
      }

      setNavDraftPages(nextPages);
      setNewLinkTitle("");
      setNewLinkUrl("");
    }

    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        components: {
          ...base.components,
          navigation: {
            ...base.components.navigation,
            pages: nextPages,
          },
        },
      };
    });

    toast.success("Navigation changes saved");
  };

  const addSettingItem = () => {
    if (!newSettingLabel.trim()) {
      toast.error("Please enter a label");
      return;
    }

    const newSetting: SettingsItem =
      newSettingType === "toggle"
        ? {
            id: crypto.randomUUID(),
            label: newSettingLabel.trim(),
            type: "toggle",
            value: false,
          }
        : newSettingType === "input"
          ? {
              id: crypto.randomUUID(),
              label: newSettingLabel.trim(),
              type: "input",
              value: "",
            }
          : {
              id: crypto.randomUUID(),
              label: newSettingLabel.trim(),
              type: "select",
              value: [""],
            };

    updateSettingsItems((items) => [...items, newSetting]);

    setNewSettingLabel("");
    setNewSettingType("toggle");
    toast.success("Setting added");
  };

  const addSelectSettingOption = (id: string) => {
    updateSettingsItems((items) =>
      items.map((item) => {
        if (item.id !== id || item.type !== "select") return item;
        return {
          ...item,
          value: [...item.value, ""],
        };
      }),
    );
  };

  const updateSelectSettingOption = (
    id: string,
    optionIndex: number,
    nextValue: string,
  ) => {
    updateSettingsItems((items) =>
      items.map((item) => {
        if (item.id !== id || item.type !== "select") return item;
        return {
          ...item,
          value: item.value.map((option, index) =>
            index === optionIndex ? nextValue : option,
          ),
        };
      }),
    );
  };

  const removeSelectSettingOption = (id: string, optionIndex: number) => {
    updateSettingsItems((items) =>
      items.map((item) => {
        if (item.id !== id || item.type !== "select") return item;

        if (item.value.length <= 1) {
          return {
            ...item,
            value: [""],
          };
        }

        return {
          ...item,
          value: item.value.filter((_, index) => index !== optionIndex),
        };
      }),
    );
  };

  const removeSettingItem = (id: string) => {
    updateSettingsItems((items) => items.filter((item) => item.id !== id));
    toast.success("Setting removed");
  };

  const cycleDrawerState = () => {
    if (navDraftStyle.type !== "drawer") {
      setDrawerState("closed");
      return;
    }

    if (navDraftStyle.variant === "short") {
      setDrawerState((current) =>
        current === "closed" ? "icons-only" : "closed",
      );
      return;
    }

    if (navDraftStyle.variant === "long") {
      setDrawerState((current) => (current === "closed" ? "open" : "closed"));
      return;
    }

    if (drawerState === "closed") {
      setDrawerState("icons-only");
    } else if (drawerState === "icons-only") {
      setDrawerState("open");
    } else {
      setDrawerState("closed");
    }
  };

  const copyJsonToClipboard = () => {
    const json = JSON.stringify(safeConfig, null, 2);
    navigator.clipboard.writeText(json);
    toast.success("JSON copied to clipboard");
  };

  const drawerWidth =
    navDraftStyle.type === "drawer"
      ? drawerState === "open"
        ? 240
        : drawerState === "icons-only"
          ? 60
          : 0
      : 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Component Builder
          </h1>

          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <DownloadSimple size={18} weight="bold" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="font-mono">
                  Export Configuration
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <pre className="bg-secondary p-4 rounded-lg overflow-auto text-sm font-mono max-h-[60vh]">
                  {JSON.stringify(safeConfig, null, 2)}
                </pre>
                <Button onClick={copyJsonToClipboard} className="w-full">
                  Copy to Clipboard
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <div className="grid w-full grid-cols-2 rounded-md bg-muted p-1">
            <Button
              type="button"
              variant={activeTab === "navigation" ? "default" : "ghost"}
              onClick={() => setActiveTab("navigation")}
              className="gap-2"
            >
              <House size={16} weight="bold" />
              Navigation
            </Button>
            <Button
              type="button"
              variant={activeTab === "pages" ? "default" : "ghost"}
              onClick={() => setActiveTab("pages")}
              className="gap-2"
            >
              <List size={16} weight="bold" />
              Pages
            </Button>
          </div>

          {activeTab === "pages" && (
            <div className="space-y-4">
              <div className="grid w-full grid-cols-2 rounded-md bg-muted p-1">
                <Button
                  type="button"
                  variant={pagesTab === "preset" ? "default" : "ghost"}
                  onClick={() => setPagesTab("preset")}
                >
                  Preset
                </Button>
                <Button
                  type="button"
                  variant={pagesTab === "custom" ? "default" : "ghost"}
                  onClick={() => setPagesTab("custom")}
                >
                  Custom
                </Button>
              </div>

              {pagesTab === "preset" && (
                <Card className="p-4">
                  <h2 className="text-lg font-semibold mb-4 font-mono">
                    Preset Pages
                  </h2>

                  {presetPages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No preset pages found.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {presetPages.map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          className={`w-full rounded-lg p-3 text-left transition-colors ${
                            selectedPresetPageId === page.id
                              ? "bg-muted"
                              : "bg-secondary hover:bg-secondary/70"
                          }`}
                          onClick={() => setSelectedPresetPageId(page.id)}
                        >
                          <p className="font-medium">{page.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {page.pageType}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {pagesTab === "custom" && (
                <Card className="p-4">
                  <h2 className="text-lg font-semibold mb-4 font-mono">
                    Custom Pages
                  </h2>

                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-sm text-muted-foreground">
                      Custom object is currently blank.
                    </p>
                    <pre className="mt-2 text-xs font-mono text-muted-foreground">
                      {JSON.stringify(customPages, null, 2)}
                    </pre>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === "navigation" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <div className="mb-4 space-y-2">
                  <Label htmlFor="navigation-header">Navigation Header</Label>
                  <Input
                    id="navigation-header"
                    placeholder="none"
                    value={navDraftHeader}
                    onChange={(e) => updateNavigationHeader(e.target.value)}
                  />
                </div>

                <div className="mb-4 space-y-2">
                  <Label htmlFor="navigation-style">Navigation Style</Label>
                  <Select
                    value={navDraftStyle.type}
                    onValueChange={(value: NavigationStyle["type"]) => {
                      if (value === "drawer") {
                        updateNavigationStyle({
                          type: "drawer",
                          variant:
                            navDraftStyle.type === "drawer"
                              ? navDraftStyle.variant
                              : "all",
                        });
                        return;
                      }

                      updateNavigationStyle({
                        type: "bottom",
                        variant:
                          navDraftStyle.type === "bottom"
                            ? navDraftStyle.variant
                            : "short",
                      });
                    }}
                  >
                    <SelectTrigger id="navigation-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drawer">drawer</SelectItem>
                      <SelectItem value="bottom">bottom</SelectItem>
                    </SelectContent>
                  </Select>

                  {navDraftStyle.type === "drawer" && (
                    <div className="space-y-2">
                      <Label htmlFor="navigation-style-variant">
                        Drawer Options
                      </Label>
                      <Select
                        value={navDraftStyle.variant}
                        onValueChange={(value: DrawerVariant) =>
                          updateNavigationStyle({
                            type: "drawer",
                            variant: value,
                          })
                        }
                      >
                        <SelectTrigger id="navigation-style-variant">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">short</SelectItem>
                          <SelectItem value="long">long</SelectItem>
                          <SelectItem value="all">all</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {navDraftStyle.type === "bottom" && (
                    <div className="space-y-2">
                      <Label htmlFor="navigation-style-variant">
                        Bottom Options
                      </Label>
                      <Select
                        value={navDraftStyle.variant}
                        onValueChange={(value: BottomVariant) =>
                          updateNavigationStyle({
                            type: "bottom",
                            variant: value,
                          })
                        }
                      >
                        <SelectTrigger id="navigation-style-variant">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">short</SelectItem>
                          <SelectItem value="long">long</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold font-mono">
                    Navigation Links
                  </h2>
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveNavigationChanges}
                    disabled={!navigationHasUnsavedChanges}
                  >
                    Save
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="link-title">Title</Label>
                      <Input
                        id="link-title"
                        placeholder="Home"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && addNavigationPage()
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link-url">Link</Label>
                      <Input
                        id="link-url"
                        placeholder="/home"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && addNavigationPage()
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link-page-id">Page</Label>
                      <Select
                        value={newLinkPageId}
                        onValueChange={setNewLinkPageId}
                      >
                        <SelectTrigger id="link-page-id">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pageTitleOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link-icon-mode">Icon</Label>

                      <Select
                        value={newLinkIconMode}
                        onValueChange={(value: IconEntryMode) =>
                          setNewLinkIconMode(value)
                        }
                      >
                        <SelectTrigger id="link-icon-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">
                            Use default icon
                          </SelectItem>
                          <SelectItem value="manual">
                            Enter icon manually
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newLinkIconMode === "default" ? (
                    <div className="space-y-2">
                      <Label>Default Icon</Label>
                      <div className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                        <House size={20} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {DEFAULT_NAV_ICON.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Library: {DEFAULT_NAV_ICON.library}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="link-icon-manual">Manual Icon Name</Label>
                      <Input
                        id="link-icon-manual"
                        placeholder="House"
                        value={newLinkIconManual}
                        onChange={(e) => setNewLinkIconManual(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && addNavigationPage()
                        }
                      />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor="link-icon-library">
                            Icon Library
                          </Label>
                          <Dialog
                            open={iconHelpDialogOpen}
                            onOpenChange={setIconHelpDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                type="button"
                                className="h-7 w-7 rounded-full font-semibold"
                                aria-label="Icon library help"
                              >
                                ?
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Find Icons</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 text-sm">
                                <p className="text-muted-foreground">
                                  Browse icon libraries and copy an icon name
                                  for manual entry.
                                </p>
                                <a
                                  href="https://lucide.dev/icons/"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-primary underline"
                                >
                                  Lucide Icons
                                </a>
                                <a
                                  href="https://phosphoricons.com/"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-primary underline"
                                >
                                  Phosphor Icons
                                </a>
                                <a
                                  href="https://heroicons.com/"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-primary underline"
                                >
                                  Heroicons
                                </a>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <Select
                          value={newLinkIconLibrary}
                          onValueChange={(value: IconLibrary) =>
                            setNewLinkIconLibrary(value)
                          }
                        >
                          <SelectTrigger id="link-icon-library">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="phosphor">phosphor</SelectItem>
                            <SelectItem value="lucide">lucide</SelectItem>
                            <SelectItem value="heroicons">heroicons</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <Button onClick={addNavigationPage} className="w-full gap-2">
                    <Plus size={18} weight="bold" />
                    Add Page
                  </Button>

                  {navDraftPages.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        {navDraftPages.map((page) =>
                          (() => {
                            return (
                              <div
                                key={page.id}
                                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {renderNavIcon(
                                    page.icon,
                                    "text-muted-foreground flex-shrink-0",
                                    20,
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">
                                      {page.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {page.link} • {page.icon.name} (
                                      {page.icon.library}) • pageId: {page.pageId}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeNavigationPage(page.id)}
                                  className="flex-shrink-0 text-destructive hover:text-destructive"
                                >
                                  <Trash size={18} />
                                </Button>
                              </div>
                            );
                          })(),
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold font-mono">
                    Navigation Preview
                  </h2>
                  {navDraftStyle.type === "drawer" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cycleDrawerState}
                      className="gap-2"
                    >
                      <List size={16} weight="bold" />
                      Cycle Drawer
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">
                      Always visible
                    </span>
                  )}
                </div>

                <div className="relative border-2 border-border rounded-lg overflow-hidden bg-card min-h-[400px]">
                  {navDraftStyle.type === "drawer" && (
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-secondary border-r border-border flex flex-col z-10"
                      initial={false}
                      animate={{ width: drawerWidth }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      {drawerState !== "closed" && (
                        <div className="flex flex-col h-full overflow-hidden">
                          <div className="p-4 flex-shrink-0">
                            {drawerState === "open" &&
                              navDraftHeader.trim().length > 0 && (
                                <h3 className="font-semibold text-sm truncate">
                                  {navDraftHeader}
                                </h3>
                              )}
                          </div>

                          <ScrollArea className="flex-1">
                            <div className="space-y-1 px-2 pb-4">
                              {navDraftPages.length === 0 ? (
                                <div className="text-center py-8 px-4"></div>
                              ) : (
                                navDraftPages.map((page) =>
                                  (() => {
                                    return (
                                      <div
                                        key={page.id}
                                        className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                                      >
                                        {renderNavIcon(
                                          page.icon,
                                          "flex-shrink-0",
                                          20,
                                        )}
                                        {drawerState === "open" && (
                                          <span className="text-sm truncate">
                                            {page.title}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })(),
                                )
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {navDraftStyle.type === "bottom" && (
                    <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-secondary z-10">
                      <div className="grid grid-flow-col auto-cols-fr gap-1 p-2">
                        {navDraftPages.map((page) => (
                          <button
                            key={page.id}
                            type="button"
                            className="flex items-center justify-center rounded px-2 py-1 text-muted-foreground hover:bg-muted/50 transition-colors"
                          >
                            {navDraftStyle.variant === "short" ? (
                              renderNavIcon(page.icon, "", 20)
                            ) : (
                              <span className="flex flex-col items-center gap-1">
                                {renderNavIcon(page.icon, "", 20)}
                                <span className="text-[10px] leading-none truncate max-w-[64px]">
                                  {page.title}
                                </span>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <motion.div
                    className="h-full p-6"
                    initial={false}
                    animate={
                      navDraftStyle.type === "drawer"
                        ? { paddingLeft: drawerWidth + 24, paddingBottom: 24 }
                        : { paddingLeft: 24, paddingBottom: 92 }
                    }
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <p className="text-sm text-muted-foreground">
                      This preview shows only the selected navigation component.
                    </p>
                  </motion.div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "pages" &&
            pagesTab === "preset" &&
            selectedPresetPageId === "settings" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4 font-mono">
                  Settings Items
                </h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setting-label">Label</Label>
                      <Input
                        id="setting-label"
                        placeholder="Enable notifications"
                        value={newSettingLabel}
                        onChange={(e) => setNewSettingLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSettingItem()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting-type">Type</Label>
                      <Select
                        value={newSettingType}
                        onValueChange={(value: "toggle" | "input" | "select") =>
                          setNewSettingType(value)
                        }
                      >
                        <SelectTrigger id="setting-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="toggle">Toggle</SelectItem>
                          <SelectItem value="input">Input</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={addSettingItem} className="w-full gap-2">
                    <Plus size={18} weight="bold" />
                    Add Setting
                  </Button>

                  {settingsPage.items.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        {settingsPage.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 bg-secondary rounded-lg space-y-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <ToggleLeft
                                  size={20}
                                  className="text-muted-foreground flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">
                                    {item.label}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate capitalize">
                                    {item.type}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSettingItem(item.id)}
                                className="flex-shrink-0 text-destructive hover:text-destructive"
                              >
                                <Trash size={18} />
                              </Button>
                            </div>

                            {item.type === "select" && (
                              <div className="space-y-2">
                                <Label>Dropdown Options</Label>
                                <div className="space-y-2">
                                  {item.value.map((option, optionIndex) => (
                                    <div
                                      key={`${item.id}-option-${optionIndex}`}
                                      className="flex items-center gap-2"
                                    >
                                      <Input
                                        placeholder={`Option ${optionIndex + 1}`}
                                        value={option}
                                        onChange={(e) =>
                                          updateSelectSettingOption(
                                            item.id,
                                            optionIndex,
                                            e.target.value,
                                          )
                                        }
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          removeSelectSettingOption(
                                            item.id,
                                            optionIndex,
                                          )
                                        }
                                        className="text-destructive hover:text-destructive"
                                        aria-label="Delete option"
                                      >
                                        <Trash size={18} />
                                      </Button>
                                    </div>
                                  ))}
                                </div>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() =>
                                    addSelectSettingOption(item.id)
                                  }
                                >
                                  <Plus size={16} weight="bold" />
                                  Add Option
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 font-mono">
                  Settings Preview
                </h2>
                <div className="border-2 border-border rounded-lg overflow-hidden bg-card min-h-[400px]">
                  <div className="bg-secondary border-b border-border p-4">
                    <h3 className="font-semibold text-lg">Settings</h3>
                  </div>

                  <ScrollArea className="h-[340px]">
                    <div className="p-6 space-y-4">
                      {settingsPage.items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>No settings added yet</p>
                        </div>
                      ) : (
                        settingsPage.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{item.label}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {item.type}
                              </p>
                            </div>
                            {item.type === "toggle" && (
                              <Switch
                                checked={
                                  previewToggleValues[item.id] ?? item.value
                                }
                                onCheckedChange={(checked) =>
                                  setPreviewToggleValues((current) => ({
                                    ...current,
                                    [item.id]: checked,
                                  }))
                                }
                              />
                            )}
                            {item.type === "input" && (
                              <Input
                                className="w-32"
                                placeholder="Value"
                                value={
                                  previewInputValues[item.id] ?? item.value
                                }
                                onChange={(e) =>
                                  setPreviewInputValues((current) => ({
                                    ...current,
                                    [item.id]: e.target.value,
                                  }))
                                }
                              />
                            )}
                            {item.type === "select" &&
                              (() => {
                                const previewOptions = item.value.filter(
                                  (option) => option.trim().length > 0,
                                );

                                return (
                                  <Select
                                    defaultValue={
                                      previewOptions.length > 0
                                        ? "0"
                                        : undefined
                                    }
                                    disabled={previewOptions.length === 0}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {previewOptions.length === 0 ? (
                                        <SelectItem value="no-options" disabled>
                                          No options available
                                        </SelectItem>
                                      ) : (
                                        previewOptions.map((option, index) => (
                                          <SelectItem
                                            key={`${item.id}-preview-option-${index}`}
                                            value={String(index)}
                                          >
                                            {option}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                );
                              })()}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
