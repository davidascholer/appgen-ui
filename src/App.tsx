import { useState, useEffect } from "react";
import type { ComponentType } from "react";
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
  Download,
  List,
  Home,
  Trash2,
  ToggleLeft,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface NavPage {
  id: string;
  title: string;
  link: string;
  pageId: string;
  icon: {
    name: string;
  };
}

interface ToggleSettingItem {
  id: string;
  label: string;
  type: "toggle";
  componentTypeId: string;
  value: boolean;
}

interface InputSettingItem {
  id: string;
  label: string;
  type: "input";
  componentTypeId: string;
  value: string;
}

interface SelectSettingItem {
  id: string;
  label: string;
  type: "select";
  componentTypeId: string;
  value: string[];
}

interface HeaderPrebuiltItem {
  id: string;
  label: string;
  type: "header";
  componentTypeId: string;
  value: string;
}

type SettingsItem = ToggleSettingItem | InputSettingItem | SelectSettingItem;
type HomeItem = HeaderPrebuiltItem;
type SettingComponentType = "toggle" | "input" | "select" | "header";

interface SettingComponentDefinition {
  id: string;
  type: SettingComponentType;
  label: string;
  kind: "prebuilt";
}

interface PrebuiltSettingsPage {
  id: string;
  kind: "prebuilt";
  title: string;
  items: SettingsItem[];
}

interface PrebuiltHomePage {
  id: "home";
  kind: "prebuilt";
  title: string;
  items: HomeItem[];
}

interface CustomPage {
  id: string;
  kind: "custom";
  title: string;
}

type AppPage = PrebuiltSettingsPage | PrebuiltHomePage | CustomPage;

interface AppConfig {
  id: string;
  appName: string;
  components: SettingComponentDefinition[];
  navigation: {
    shown: boolean;
    navigationHeader: string;
    navigationStyle: NavigationStyle;
    navigationPages: NavPage[];
  };
  pages: AppPage[];
}

interface ExportedComponentDefinition {
  id: string;
  type: SettingComponentType;
  label: string;
}

interface ExportedPrebuiltPage {
  id: string;
  title: string;
  items: Array<SettingsItem | HomeItem>;
}

interface ExportedCustomPage {
  id: string;
  title: string;
}

interface ExportConfig {
  id: string;
  appName: string;
  navigation: AppConfig["navigation"];
  pages: ExportedCustomPage[];
}

interface ExportPrebuiltConfig {
  components: ExportedComponentDefinition[];
  pages: ExportedPrebuiltPage[];
}

type DrawerState = "closed" | "icons-only" | "open";
type ActiveTab = "navigation" | "pages";
type IconEntryMode = "default" | "manual";
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
  name: "Home",
} as const;

const DEFAULT_NAVIGATION_STYLE: NavigationStyle = {
  type: "drawer",
  variant: "all",
};

const DEFAULT_SETTING_COMPONENTS: SettingComponentDefinition[] = [
  {
    id: "component-type-toggle",
    type: "toggle",
    label: "Toggle",
    kind: "prebuilt",
  },
  {
    id: "component-type-input",
    type: "input",
    label: "Input",
    kind: "prebuilt",
  },
  {
    id: "component-type-select",
    type: "select",
    label: "Select",
    kind: "prebuilt",
  },
  {
    id: "component-type-header1",
    type: "header",
    label: "Header 1",
    kind: "prebuilt",
  },
];

const createDefaultSettingsPage = (): PrebuiltSettingsPage => ({
  id: "settings",
  kind: "prebuilt",
  title: "Settings",
  items: [],
});

const createDefaultHomePage = (): PrebuiltHomePage => ({
  id: "home",
  kind: "prebuilt",
  title: "Home",
  items: [
    {
      id: crypto.randomUUID(),
      label: "Header 1",
      type: "header",
      componentTypeId: "component-type-header1",
      value: "Home",
    },
  ],
});

const getNormalizedIconKey = (name: string) =>
  name
    .trim()
    .replace(/[-_\s]+/g, "")
    .toLowerCase();

const LEGACY_ICON_NAME_MAP: Record<string, string> = {
  house: "home",
  gear: "settings",
  magnifyingglass: "search",
  downloadsimple: "download",
  trash: "trash-2",
};

const normalizeLucideIconName = (name: string) => {
  const normalized = getNormalizedIconKey(name);
  return LEGACY_ICON_NAME_MAP[normalized] ?? name.trim();
};

const getLucideIconComponent = (name: string) => {
  const normalized = getNormalizedIconKey(normalizeLucideIconName(name));
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

const renderNavIcon = (
  icon: { name: string },
  className: string,
  size = 20,
) => {
  const IconComponent = getLucideIconComponent(icon.name);
  if (IconComponent) {
    return <IconComponent size={size} className={className} />;
  }

  return <Home size={size} className={className} />;
};

const DEFAULT_CONFIG: AppConfig = {
  id: crypto.randomUUID(),
  appName: "",
  components: DEFAULT_SETTING_COMPONENTS,
  navigation: {
    shown: true,
    navigationHeader: "",
    navigationStyle: DEFAULT_NAVIGATION_STYLE,
    navigationPages: [],
  },
  pages: [createDefaultSettingsPage(), createDefaultHomePage()],
};

const normalizeConfig = (input: unknown): AppConfig => {
  if (!input || typeof input !== "object") return DEFAULT_CONFIG;

  const maybeConfig = input as {
    id?: string;
    appName?: unknown;
    pages?: unknown;
    navigation?: {
      shown?: unknown;
      navigationHeader?: unknown;
      navigationStyle?: unknown;
      navigationPages?: unknown;
      pages?: unknown;
      items?: unknown;
    };
    components?: unknown;
  };

  const componentsRaw = maybeConfig.components;
  const legacyComponentsObject =
    componentsRaw && typeof componentsRaw === "object" && !Array.isArray(componentsRaw)
      ? (componentsRaw as {
          settingComponentTypes?: unknown;
          navigation?: {
            shown?: unknown;
            navigationHeader?: unknown;
            navigationStyle?: unknown;
            navigationPages?: unknown;
            pages?: unknown;
            items?: unknown;
          };
          navigationDrawer?: {
            shown?: unknown;
            navigationHeader?: unknown;
            navigationStyle?: unknown;
            navigationPages?: unknown;
            pages?: unknown;
            items?: unknown;
          };
          settings?: {
            items?: unknown;
          };
        })
      : undefined;

  const settingComponentTypesRaw = legacyComponentsObject?.settingComponentTypes;

  const defaultComponentByType = (type: SettingComponentType) =>
    DEFAULT_SETTING_COMPONENTS.find((component) => component.type === type)!;

  const parseSettingComponent = (
    raw: unknown,
    fallbackType: SettingComponentType,
  ): SettingComponentDefinition => {
    const fallback = defaultComponentByType(fallbackType);
    if (!raw || typeof raw !== "object") {
      return fallback;
    }

    const entry = raw as {
      id?: unknown;
      type?: unknown;
      label?: unknown;
      kind?: unknown;
    };

    const type =
      entry.type === "toggle" ||
      entry.type === "input" ||
      entry.type === "select" ||
      entry.type === "header"
        ? entry.type
        : fallbackType;

    return {
      id:
        typeof entry.id === "string" && entry.id.trim().length > 0
          ? entry.id
          : fallback.id,
      type,
      label:
        typeof entry.label === "string" && entry.label.trim().length > 0
          ? entry.label
          : defaultComponentByType(type).label,
      kind: "prebuilt",
    };
  };

  const componentsFromArray = Array.isArray(componentsRaw)
    ? componentsRaw
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;

          const maybeType = (entry as { type?: unknown }).type;
          if (
            maybeType !== "toggle" &&
            maybeType !== "input" &&
            maybeType !== "select" &&
            maybeType !== "header"
          ) {
            return null;
          }

          return parseSettingComponent(entry, maybeType);
        })
        .filter((entry): entry is SettingComponentDefinition => Boolean(entry))
    : [];

  const componentsFromLegacyMap =
    settingComponentTypesRaw && typeof settingComponentTypesRaw === "object"
      ? (["toggle", "input", "select", "header"] as const).map((type) =>
          parseSettingComponent(
            (settingComponentTypesRaw as Record<SettingComponentType, unknown>)[type],
            type,
          ),
        )
      : [];

  const dedupeAndEnsureTypes = (
    components: SettingComponentDefinition[],
  ): SettingComponentDefinition[] => {
    const byType = new Map<SettingComponentType, SettingComponentDefinition>();
    for (const component of components) {
      if (!byType.has(component.type)) {
        byType.set(component.type, {
          ...component,
          kind: "prebuilt",
        });
      }
    }

    return (["toggle", "input", "select", "header"] as const).map(
      (type) => byType.get(type) ?? defaultComponentByType(type),
    );
  };

  const normalizedComponents = dedupeAndEnsureTypes(
    componentsFromArray.length > 0 ? componentsFromArray : componentsFromLegacyMap,
  );

  const getComponentIdForType = (type: SettingComponentType) =>
    normalizedComponents.find((component) => component.type === type)?.id ??
    defaultComponentByType(type).id;

  const navRoot =
    maybeConfig.navigation ??
    legacyComponentsObject?.navigation ??
    legacyComponentsObject?.navigationDrawer;

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

  const navPagesRaw = navRoot?.navigationPages ?? navRoot?.pages ?? navRoot?.items;

  const navPages: NavPage[] = Array.isArray(navPagesRaw)
    ? navPagesRaw.map((entry) => {
        const page = entry as Partial<NavPage> & {
          icon?: unknown;
        };

        let normalizedIcon = DEFAULT_NAV_ICON;
        if (typeof page.icon === "string") {
          normalizedIcon = {
            name: normalizeLucideIconName(page.icon),
          };
        } else if (
          page.icon &&
          typeof page.icon === "object" &&
          "name" in page.icon
        ) {
          const iconObj = page.icon as {
            name?: unknown;
          };

          normalizedIcon = {
            name:
              typeof iconObj.name === "string" && iconObj.name.trim().length > 0
                ? normalizeLucideIconName(iconObj.name)
                : DEFAULT_NAV_ICON.name,
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
            componentTypeId:
              typeof item.componentTypeId === "string" &&
              item.componentTypeId.trim().length > 0
                ? item.componentTypeId
                : getComponentIdForType("toggle"),
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
            componentTypeId:
              typeof item.componentTypeId === "string" &&
              item.componentTypeId.trim().length > 0
                ? item.componentTypeId
                : getComponentIdForType("select"),
            value: normalizedOptions,
          };
        }

        return {
          id: item.id || crypto.randomUUID(),
          label: typeof item.label === "string" ? item.label : "Setting",
          type: "input",
          componentTypeId:
            typeof item.componentTypeId === "string" &&
            item.componentTypeId.trim().length > 0
              ? item.componentTypeId
              : getComponentIdForType("input"),
          value: typeof item.value === "string" ? item.value : "",
        };
      })
      : [];

  const legacySettingsItems = parseSettingsItems(
    legacyComponentsObject?.settings?.items,
  );

  const parseSettingsPrebuiltPage = (
    value: unknown,
  ): PrebuiltSettingsPage | undefined => {
    if (!value || typeof value !== "object") return undefined;

    const page = value as {
      id?: unknown;
      kind?: unknown;
      pageType?: unknown;
      title?: unknown;
      items?: unknown;
    };

    const hasExplicitId = typeof page.id === "string" && page.id.trim().length > 0;
    const isSettingsPage =
      page.pageType === "settings" ||
      page.id === "settings" ||
      ((page.kind === "preset" || page.kind === "prebuilt") && !hasExplicitId);

    if (!isSettingsPage) return undefined;

    return {
      id:
        typeof page.id === "string" && page.id.trim().length > 0
          ? page.id
          : "settings",
      kind: "prebuilt",
      title:
        typeof page.title === "string" && page.title.trim().length > 0
          ? page.title
          : "Settings",
      items: parseSettingsItems(page.items),
    };
  };

  const parseHomeItems = (value: unknown, pageTitle: string): HomeItem[] => {
    if (!Array.isArray(value)) {
      return [
        {
          id: crypto.randomUUID(),
          label: "Header 1",
          type: "header",
          componentTypeId: getComponentIdForType("header"),
          value: pageTitle,
        },
      ];
    }

    const parsed = value.flatMap((entry) => {
      const item = entry as Partial<HomeItem> & { value?: unknown };
      if (item.type !== "header") return [];

      return [
        {
          id: item.id || crypto.randomUUID(),
          label:
            typeof item.label === "string" && item.label.trim().length > 0
              ? item.label
              : "Header 1",
          type: "header" as const,
          componentTypeId:
            typeof item.componentTypeId === "string" &&
            item.componentTypeId.trim().length > 0
              ? item.componentTypeId
              : getComponentIdForType("header"),
          value:
            typeof item.value === "string" && item.value.trim().length > 0
              ? item.value
              : pageTitle,
        },
      ];
    });

    if (parsed.length > 0) return parsed;

    return [
      {
        id: crypto.randomUUID(),
        label: "Header 1",
        type: "header",
        componentTypeId: getComponentIdForType("header"),
        value: pageTitle,
      },
    ];
  };

  const parseHomePrebuiltPage = (
    value: unknown,
  ): PrebuiltHomePage | undefined => {
    if (!value || typeof value !== "object") return undefined;

    const page = value as {
      id?: unknown;
      pageType?: unknown;
      title?: unknown;
      items?: unknown;
    };

    const isHomePage = page.pageType === "home" || page.id === "home";
    if (!isHomePage) return undefined;

    const pageTitle =
      typeof page.title === "string" && page.title.trim().length > 0
        ? page.title
        : "Home";

    return {
      id: "home",
      kind: "prebuilt",
      title: pageTitle,
      items: parseHomeItems(page.items, pageTitle),
    };
  };

  const parseCustomPage = (value: unknown): CustomPage | undefined => {
    if (!value || typeof value !== "object") return undefined;

    const page = value as {
      id?: unknown;
      kind?: unknown;
      title?: unknown;
    };

    if (page.kind !== "custom") return undefined;

    return {
      id:
        typeof page.id === "string" && page.id.trim().length > 0
          ? page.id
          : crypto.randomUUID(),
      kind: "custom",
      title:
        typeof page.title === "string" && page.title.trim().length > 0
          ? page.title
          : "Untitled",
    };
  };

  const rawPages = maybeConfig.pages;
  const arrayPages = Array.isArray(rawPages)
    ? rawPages.flatMap((entry) => {
        const home = parseHomePrebuiltPage(entry);
        if (home) return [home];

        const prebuilt = parseSettingsPrebuiltPage(entry);
        if (prebuilt) return [prebuilt];

        const custom = parseCustomPage(entry);
        return custom ? [custom] : [];
      })
    : [];

  const objectPrebuilt =
    rawPages && typeof rawPages === "object" && !Array.isArray(rawPages)
      ? parseSettingsPrebuiltPage(
          (rawPages as { prebuilt?: unknown; preset?: unknown }).prebuilt ??
            (rawPages as { prebuilt?: unknown; preset?: unknown }).preset,
        )
      : undefined;

  const objectHomePrebuilt =
    rawPages && typeof rawPages === "object" && !Array.isArray(rawPages)
      ? parseHomePrebuiltPage((rawPages as { home?: unknown }).home)
      : undefined;

  const objectCustomPages =
    rawPages && typeof rawPages === "object" && !Array.isArray(rawPages)
      ? Object.entries((rawPages as { custom?: unknown }).custom || {}).map(
          ([id, value]) => {
            const item = value as { title?: unknown };
            return {
              id,
              kind: "custom" as const,
              title:
                typeof item?.title === "string" && item.title.trim().length > 0
                  ? item.title
                  : id,
            };
          },
        )
      : [];

  const fallbackSettingsPage: PrebuiltSettingsPage = {
    ...createDefaultSettingsPage(),
    items: legacySettingsItems,
  };

  const fallbackHomePage: PrebuiltHomePage = createDefaultHomePage();

  const hasSettings =
    arrayPages.some(
      (page) => page.kind === "prebuilt" && page.id === "settings",
    ) || Boolean(objectPrebuilt);

  const hasHome =
    arrayPages.some(
      (page) => page.kind === "prebuilt" && page.id === "home",
    ) || Boolean(objectHomePrebuilt);

  const normalizedPages: AppPage[] = [
    ...(hasSettings ? [] : [fallbackSettingsPage]),
    ...(hasHome ? [] : [fallbackHomePage]),
    ...arrayPages,
    ...(objectHomePrebuilt ? [objectHomePrebuilt] : []),
    ...(objectPrebuilt ? [objectPrebuilt] : []),
    ...objectCustomPages,
  ];

  return {
    id: maybeConfig.id || crypto.randomUUID(),
    appName:
      typeof maybeConfig.appName === "string" ? maybeConfig.appName : "",
    components: normalizedComponents,
    navigation: {
      shown: typeof navRoot?.shown === "boolean" ? navRoot.shown : true,
      navigationHeader:
        typeof navRoot?.navigationHeader === "string"
          ? navRoot.navigationHeader
          : "",
      navigationStyle: normalizedNavStyle,
      navigationPages: navPages,
    },
    pages:
      normalizedPages.length > 0
        ? normalizedPages
        : [fallbackSettingsPage, fallbackHomePage],
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
  const [appNameDraft, setAppNameDraft] = useState<string>(() => config.appName);
  const [drawerState, setDrawerState] = useState<DrawerState>("closed");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkPageId, setNewLinkPageId] = useState("settings");
  const [newLinkIconMode, setNewLinkIconMode] =
    useState<IconEntryMode>("default");
  const [newLinkIconManual, setNewLinkIconManual] = useState("");
  const [newSettingLabel, setNewSettingLabel] = useState("");
  const [newSettingType, setNewSettingType] = useState<
    "toggle" | "input" | "select"
  >("toggle");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("navigation");
  const [selectedPageId, setSelectedPageId] = useState("settings");
  const [showAddCustomPage, setShowAddCustomPage] = useState(false);
  const [newCustomPageTitle, setNewCustomPageTitle] = useState("");
  const [previewToggleValues, setPreviewToggleValues] = useState<
    Record<string, boolean>
  >({});
  const [previewInputValues, setPreviewInputValues] = useState<
    Record<string, string>
  >({});
  const [navDraftPages, setNavDraftPages] = useState<NavPage[]>(
    () => config.navigation.navigationPages,
  );
  const [navDraftHeader, setNavDraftHeader] = useState<string>(
    () => config.navigation.navigationHeader,
  );
  const [navDraftStyle, setNavDraftStyle] = useState<NavigationStyle>(
    () => config.navigation.navigationStyle,
  );

  useEffect(() => {
    localStorage.setItem("app-config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    setAppNameDraft(config.appName);
  }, [config.appName]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setConfig((current) => {
        const base = current || DEFAULT_CONFIG;
        if (base.appName === appNameDraft) return base;

        return {
          ...base,
          appName: appNameDraft,
        };
      });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [appNameDraft]);

  useEffect(() => {
    setNavDraftPages(config.navigation.navigationPages);
  }, [config.navigation.navigationPages]);

  useEffect(() => {
    setNavDraftHeader(config.navigation.navigationHeader);
  }, [config.navigation.navigationHeader]);

  useEffect(() => {
    setNavDraftStyle(config.navigation.navigationStyle);
  }, [config.navigation.navigationStyle]);

  const safeConfig = config || DEFAULT_CONFIG;
  const safePages = Array.isArray(safeConfig.pages)
    ? safeConfig.pages
    : [createDefaultSettingsPage(), createDefaultHomePage()];
  const pageTitleOptions = safePages.map((page) => ({
    id: page.id,
    title: page.title,
    kind: page.kind,
  }));
  const settingsPage =
    safePages.find(
      (page): page is PrebuiltSettingsPage =>
        page.kind === "prebuilt" && page.id === "settings",
    ) || createDefaultSettingsPage();
  const selectedPage =
    safePages.find((page) => page.id === selectedPageId) || settingsPage;
  const exportPrebuiltConfig: ExportPrebuiltConfig = {
    components: safeConfig.components.map((component) => ({
      id: component.id,
      type: component.type,
      label: component.label,
    })),
    pages: safePages
      .filter((page): page is PrebuiltSettingsPage | PrebuiltHomePage =>
        page.kind === "prebuilt",
      )
      .map((page) => ({
        id: page.id,
        title: page.title,
        items: page.items,
      })),
  };

  const exportConfig: ExportConfig = {
    id: safeConfig.id,
    appName: safeConfig.appName,
    navigation: safeConfig.navigation,
    pages: safePages
      .filter((page): page is CustomPage => page.kind === "custom")
      .map((page) => ({
        id: page.id,
        title: page.title,
      })),
  };
  const getComponentTypeId = (type: SettingComponentType) =>
    safeConfig.components.find((component) => component.type === type)?.id ??
    DEFAULT_SETTING_COMPONENTS.find((component) => component.type === type)!.id;

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

  useEffect(() => {
    if (pageTitleOptions.length === 0) {
      setSelectedPageId("settings");
      return;
    }

    const hasSelected = pageTitleOptions.some(
      (option) => option.id === selectedPageId,
    );

    if (!hasSelected) {
      setSelectedPageId(pageTitleOptions[0].id);
    }
  }, [selectedPageId, pageTitleOptions]);

  const updateSettingsItems = (
    transform: (items: SettingsItem[]) => SettingsItem[],
  ) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      const pages = Array.isArray(base.pages)
        ? base.pages
        : [createDefaultSettingsPage()];

      let foundSettings = false;
      const nextPages = pages.map((page) => {
        if (page.kind === "prebuilt" && page.id === "settings") {
          foundSettings = true;
          return {
            ...page,
            items: transform(page.items),
          };
        }

        return page;
      });

      if (!foundSettings) {
        const fallback = createDefaultSettingsPage();
        nextPages.push({
          ...fallback,
          items: transform(fallback.items),
        });
      }

      return {
        ...base,
        pages: nextPages,
      };
    });
  };

  const addCustomPage = () => {
    if (!newCustomPageTitle.trim()) {
      toast.error("Please enter a page title");
      return;
    }

    const newCustomPage: CustomPage = {
      id: crypto.randomUUID(),
      kind: "custom",
      title: newCustomPageTitle.trim(),
    };

    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      const pages = Array.isArray(base.pages)
        ? base.pages
        : [createDefaultSettingsPage()];

      return {
        ...base,
        pages: [...pages, newCustomPage],
      };
    });

    setSelectedPageId(newCustomPage.id);
    setShowAddCustomPage(false);
    setNewCustomPageTitle("");
    toast.success("Custom page added");
  };

  const navigationIsDirty =
    JSON.stringify(navDraftPages) !==
    JSON.stringify(safeConfig.navigation.navigationPages);
  const navigationFormDirty =
    newLinkTitle.trim().length > 0 ||
    newLinkUrl.trim().length > 0 ||
    newLinkIconMode !== "default" ||
    newLinkIconManual.trim().length > 0;
  const navigationHasUnsavedChanges = navigationIsDirty || navigationFormDirty;
  const iconFormDirty =
    newLinkIconMode !== "default" || newLinkIconManual.trim().length > 0;

  const updateNavigationHeader = (value: string) => {
    setNavDraftHeader(value);
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        navigation: {
          ...base.navigation,
          navigationHeader: value,
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
        navigation: {
          ...base.navigation,
          navigationStyle: style,
        },
      };
    });
  };

  const updateNavigationShown = (shown: boolean) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        navigation: {
          ...base.navigation,
          shown,
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
          name:
            normalizeLucideIconName(newLinkIconManual.trim()) ||
            DEFAULT_NAV_ICON.name,
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
        navigation: {
          ...base.navigation,
          navigationPages: nextPages,
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
            componentTypeId: getComponentTypeId("toggle"),
            value: false,
          }
        : newSettingType === "input"
          ? {
              id: crypto.randomUUID(),
              label: newSettingLabel.trim(),
              type: "input",
              componentTypeId: getComponentTypeId("input"),
              value: "",
            }
          : {
              id: crypto.randomUUID(),
              label: newSettingLabel.trim(),
              type: "select",
              componentTypeId: getComponentTypeId("select"),
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
    const json = JSON.stringify(
      {
        config: exportConfig,
        prebuilt: exportPrebuiltConfig,
      },
      null,
      2,
    );
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
              <Button
                variant="outline"
                className="gap-2"
                disabled={safeConfig.appName.trim().length === 0}
              >
                <Download size={18} />
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
                <div className="space-y-2">
                  <p className="text-sm font-medium">Config</p>
                  <pre className="bg-secondary p-4 rounded-lg overflow-auto text-sm font-mono max-h-[28vh]">
                    {JSON.stringify(exportConfig, null, 2)}
                  </pre>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Prebuilt</p>
                  <pre className="bg-secondary p-4 rounded-lg overflow-auto text-sm font-mono max-h-[28vh]">
                    {JSON.stringify(exportPrebuiltConfig, null, 2)}
                  </pre>
                </div>
                <Button onClick={copyJsonToClipboard} className="w-full">
                  Copy Both to Clipboard
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mx-auto w-full max-w-md space-y-2 text-center">
          <Label htmlFor="app-name" className="inline-block">
            App Name
          </Label>
          <Input
            id="app-name"
            required
            placeholder="Enter app name"
            value={appNameDraft}
            onChange={(e) => setAppNameDraft(e.target.value)}
            className="text-center"
          />
        </div>

        <div className="space-y-4">
          <div className="grid w-full grid-cols-2 rounded-md bg-muted p-1">
            <Button
              type="button"
              variant={activeTab === "navigation" ? "default" : "ghost"}
              onClick={() => setActiveTab("navigation")}
              className="gap-2"
            >
              <Home size={16} />
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
              <Card className="p-4">
                <div className="space-y-2">
                  <Label htmlFor="pages-selector">Pages</Label>
                  <Select
                    value={showAddCustomPage ? "__add_custom__" : selectedPageId}
                    onValueChange={(value) => {
                      if (value === "__add_custom__") {
                        setShowAddCustomPage(true);
                        return;
                      }

                      setShowAddCustomPage(false);
                      setSelectedPageId(value);
                    }}
                  >
                    <SelectTrigger id="pages-selector">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageTitleOptions.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <SelectItem value="__add_custom__">Add custom page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showAddCustomPage && (
                  <div className="mt-4 space-y-3 rounded-lg border border-border p-3">
                    <Label htmlFor="new-custom-page-title">Custom Page Title</Label>
                    <Input
                      id="new-custom-page-title"
                      placeholder="Profile"
                      value={newCustomPageTitle}
                      onChange={(e) => setNewCustomPageTitle(e.target.value)}
                    />
                    <Button type="button" onClick={addCustomPage} className="w-full gap-2">
                      <Plus size={16} weight="bold" />
                      Save Custom Page
                    </Button>
                  </div>
                )}

                {!showAddCustomPage && (
                  <div className="mt-4 rounded-lg bg-secondary p-3">
                    {selectedPage.kind === "custom" ? (
                      <div className="min-h-[220px] rounded-md border border-border bg-background p-4">
                        <p className="text-center text-sm text-muted-foreground">
                          Empty page
                        </p>
                        <p className="mt-2 text-center font-medium">
                          {selectedPage.title}
                        </p>
                      </div>
                    ) : (
                      <div className="min-h-[220px] rounded-md border border-border bg-background p-4" />
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === "navigation" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <div className="mb-4 flex items-center justify-between rounded-md border border-border bg-secondary p-3">
                  <Label htmlFor="navigation-shown">Show Navigation</Label>
                  <Switch
                    id="navigation-shown"
                    checked={safeConfig.navigation.shown}
                    onCheckedChange={updateNavigationShown}
                  />
                </div>

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
                        <Home size={20} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {DEFAULT_NAV_ICON.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Lucide icon
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="link-icon-manual">Icon Name</Label>
                      <Input
                        id="link-icon-manual"
                        placeholder="Home"
                        value={newLinkIconManual}
                        onChange={(e) => setNewLinkIconManual(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && addNavigationPage()
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Lucide only
                      </p>
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
                                      {page.link} • {page.icon.name} • pageId: {page.pageId}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeNavigationPage(page.id)}
                                  className="flex-shrink-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 size={18} />
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
                  {!safeConfig.navigation.shown ? (
                    <span className="text-xs text-muted-foreground font-mono">
                      Hidden
                    </span>
                  ) : navDraftStyle.type === "drawer" ? (
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
                  {safeConfig.navigation.shown && navDraftStyle.type === "drawer" && (
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

                  {safeConfig.navigation.shown && navDraftStyle.type === "bottom" && (
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
                      !safeConfig.navigation.shown
                        ? { paddingLeft: 24, paddingBottom: 24 }
                        : navDraftStyle.type === "drawer"
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
            !showAddCustomPage &&
            selectedPage.kind === "prebuilt" &&
            selectedPage.id === "settings" && (
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
                                <Trash2 size={18} />
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
                                        <Trash2 size={18} />
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
