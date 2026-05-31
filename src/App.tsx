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

interface AppConfig {
  id: string;
  components: {
    navigationDrawer: {
      shown: boolean;
      navigationHeader: string;
      navigationStyle: NavigationStyle;
      pages: NavPage[];
    };
    settings: {
      shown: boolean;
      items: SettingsItem[];
    };
  };
}

type DrawerState = "closed" | "icons-only" | "open";
type ActiveTab = "navigation" | "settings";
type IconEntryMode = "default" | "manual";
type IconLibrary = "phosphor" | "lucide" | "heroicons";
type DrawerVariant = "short" | "long" | "all";

interface NavigationStyle {
  type: "drawer";
  variant: DrawerVariant;
}

const DEFAULT_NAV_ICON = {
  name: "House",
  library: "phosphor",
} as const;

const DEFAULT_NAVIGATION_STYLE: NavigationStyle = {
  type: "drawer",
  variant: "all",
};

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
    navigationDrawer: {
      shown: true,
      navigationHeader: "",
      navigationStyle: DEFAULT_NAVIGATION_STYLE,
      pages: [],
    },
    settings: {
      shown: true,
      items: [],
    },
  },
};

const normalizeConfig = (input: unknown): AppConfig => {
  if (!input || typeof input !== "object") return DEFAULT_CONFIG;

  const maybeConfig = input as {
    id?: string;
    components?: {
      navigationDrawer?: {
        navigationHeader?: unknown;
        navigationStyle?: unknown;
        pages?: unknown;
        items?: unknown;
      };
      settings?: {
        items?: unknown;
      };
    };
  };

  const navStyleRaw = maybeConfig.components?.navigationDrawer?.navigationStyle;
  const normalizedNavStyle: NavigationStyle =
    navStyleRaw && typeof navStyleRaw === "object"
      ? {
          type:
            "type" in navStyleRaw &&
            (navStyleRaw as { type?: unknown }).type === "drawer"
              ? "drawer"
              : "drawer",
          variant:
            "variant" in navStyleRaw &&
            ((navStyleRaw as { variant?: unknown }).variant === "short" ||
              (navStyleRaw as { variant?: unknown }).variant === "long" ||
              (navStyleRaw as { variant?: unknown }).variant === "all")
              ? (navStyleRaw as { variant: DrawerVariant }).variant
              : "all",
        }
      : DEFAULT_NAVIGATION_STYLE;

  const navPagesRaw =
    maybeConfig.components?.navigationDrawer?.pages ??
    maybeConfig.components?.navigationDrawer?.items;

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
          icon: normalizedIcon,
        };
      })
    : [];

  const settingsItemsRaw = maybeConfig.components?.settings?.items;
  const settingsItems: SettingsItem[] = Array.isArray(settingsItemsRaw)
    ? settingsItemsRaw.map((entry) => {
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

  return {
    id: maybeConfig.id || crypto.randomUUID(),
    components: {
      navigationDrawer: {
        shown: true,
        navigationHeader:
          typeof maybeConfig.components?.navigationDrawer?.navigationHeader ===
          "string"
            ? maybeConfig.components.navigationDrawer.navigationHeader
            : "",
        navigationStyle: normalizedNavStyle,
        pages: navPages,
      },
      settings: {
        shown: true,
        items: settingsItems,
      },
    },
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
  const [previewToggleValues, setPreviewToggleValues] = useState<
    Record<string, boolean>
  >({});
  const [previewInputValues, setPreviewInputValues] = useState<
    Record<string, string>
  >({});
  const [navDraftPages, setNavDraftPages] = useState<NavPage[]>(
    () => config.components.navigationDrawer.pages,
  );
  const [navDraftHeader, setNavDraftHeader] = useState<string>(
    () => config.components.navigationDrawer.navigationHeader,
  );
  const [navDraftStyle, setNavDraftStyle] = useState<NavigationStyle>(
    () => config.components.navigationDrawer.navigationStyle,
  );

  useEffect(() => {
    localStorage.setItem("app-config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    setNavDraftPages(config.components.navigationDrawer.pages);
  }, [config.components.navigationDrawer.pages]);

  useEffect(() => {
    setNavDraftHeader(config.components.navigationDrawer.navigationHeader);
  }, [config.components.navigationDrawer.navigationHeader]);

  useEffect(() => {
    setNavDraftStyle(config.components.navigationDrawer.navigationStyle);
  }, [config.components.navigationDrawer.navigationStyle]);

  const safeConfig = config || DEFAULT_CONFIG;
  const navigationIsDirty =
    JSON.stringify(navDraftPages) !==
    JSON.stringify(safeConfig.components.navigationDrawer.pages);
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
          navigationDrawer: {
            ...base.components.navigationDrawer,
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
          navigationDrawer: {
            ...base.components.navigationDrawer,
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
          navigationDrawer: {
            ...base.components.navigationDrawer,
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

    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        components: {
          ...base.components,
          settings: {
            ...base.components.settings,
            items: [...base.components.settings.items, newSetting],
          },
        },
      };
    });

    setNewSettingLabel("");
    setNewSettingType("toggle");
    toast.success("Setting added");
  };

  const addSelectSettingOption = (id: string) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;

      return {
        ...base,
        components: {
          ...base.components,
          settings: {
            ...base.components.settings,
            items: base.components.settings.items.map((item) => {
              if (item.id !== id || item.type !== "select") return item;
              return {
                ...item,
                value: [...item.value, ""],
              };
            }),
          },
        },
      };
    });
  };

  const updateSelectSettingOption = (
    id: string,
    optionIndex: number,
    nextValue: string,
  ) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;

      return {
        ...base,
        components: {
          ...base.components,
          settings: {
            ...base.components.settings,
            items: base.components.settings.items.map((item) => {
              if (item.id !== id || item.type !== "select") return item;
              return {
                ...item,
                value: item.value.map((option, index) =>
                  index === optionIndex ? nextValue : option,
                ),
              };
            }),
          },
        },
      };
    });
  };

  const removeSelectSettingOption = (id: string, optionIndex: number) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;

      return {
        ...base,
        components: {
          ...base.components,
          settings: {
            ...base.components.settings,
            items: base.components.settings.items.map((item) => {
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
          },
        },
      };
    });
  };

  const removeSettingItem = (id: string) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        components: {
          ...base.components,
          settings: {
            ...base.components.settings,
            items: base.components.settings.items.filter(
              (item) => item.id !== id,
            ),
          },
        },
      };
    });
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
    drawerState === "open" ? 240 : drawerState === "icons-only" ? 60 : 0;

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
              variant={activeTab === "settings" ? "default" : "ghost"}
              onClick={() => setActiveTab("settings")}
              className="gap-2"
            >
              <ToggleLeft size={16} weight="bold" />
              Settings
            </Button>
          </div>

          {activeTab === "navigation" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <div className="mb-4 space-y-2">
                  <Label htmlFor="navigation-header">Navigation Header</Label>
                  <Input
                    id="navigation-header"
                    placeholder=""
                    value={navDraftHeader}
                    onChange={(e) => updateNavigationHeader(e.target.value)}
                  />
                </div>

                <div className="mb-4 space-y-2">
                  <Label htmlFor="navigation-style">Navigation Style</Label>
                  <Select
                    value={navDraftStyle.type}
                    onValueChange={() =>
                      updateNavigationStyle({
                        ...navDraftStyle,
                        type: "drawer",
                      })
                    }
                  >
                    <SelectTrigger id="navigation-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drawer">drawer</SelectItem>
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
                                      {page.icon.library})
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cycleDrawerState}
                    className="gap-2"
                  >
                    <List size={16} weight="bold" />
                    Cycle Drawer
                  </Button>
                </div>

                <div className="relative border-2 border-border rounded-lg overflow-hidden bg-card min-h-[400px]">
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

                  <motion.div
                    className="h-full p-6"
                    initial={false}
                    animate={{ paddingLeft: drawerWidth + 24 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <p className="text-sm text-muted-foreground">
                      This preview shows only the navigation drawer component.
                    </p>
                  </motion.div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
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

                  {safeConfig.components.settings.items.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        {safeConfig.components.settings.items.map((item) => (
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
                      {safeConfig.components.settings.items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>No settings added yet</p>
                        </div>
                      ) : (
                        safeConfig.components.settings.items.map((item) => (
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
