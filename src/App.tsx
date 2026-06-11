import { useState, useEffect, useMemo, useRef, useDeferredValue } from "react";
import type { ComponentType, CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
  Menu,
  ArrowLeft,
  Home,
  Trash2,
  ToggleLeft,
  Box,
  ArrowUp,
  ArrowDown,
  Palette,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import prebuiltSourceConfig from "./appgen-config.json";

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
type SettingComponentType = "toggle" | "input" | "select" | "header";

interface SettingComponentDefinition {
  id: string;
  type: SettingComponentType;
  label: string;
  kind: "prebuilt";
}

interface CustomPage {
  id: string;
  kind: "custom";
  title: string;
  url: string;
  showNavigationHeader: boolean;
  navigationHeaderComponentId: string | null;
  parentPageId: string | null;
  componentIds: string[];
  styles: ComponentStyles;
}

type AppPage = CustomPage;

interface AppConfig {
  id: string;
  appName: string;
  components: AppComponent[];
  colorTheme: ColorTheme;
  navigation: {
    shown: boolean;
    navigationLabel: string;
    showNavigationHeader: boolean;
    headerMenuIconName: string;
    headerBackIconName: string;
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
  items: Array<SettingsItem | HeaderPrebuiltItem>;
}

interface ExportedCustomPage {
  id: string;
  title: string;
  url: string;
  showNavigationHeader: boolean;
  navigationHeaderComponentId: string | null;
  parentPageId: string | null;
  componentIds: string[];
  styles: ComponentStyles;
}

interface ExportConfig {
  id: string;
  appName: string;
  navigation: AppConfig["navigation"];
  pages: ExportedCustomPage[];
  components: Record<string, unknown>[];
  colorTheme: ColorTheme;
}

interface ExportPrebuiltConfig {
  pages: ExportedPrebuiltPage[];
  elements: PrebuiltElementDef[];
}

interface AppgenConfigFile {
  navigation?: unknown;
  colorTheme?: unknown;
  prebuilt?: {
    components?: unknown;
    pages?: unknown;
    elements?: unknown;
  };
  signatures?: {
    components?: unknown;
    pages?: unknown;
  };
}

type ElementTypeId =
  | "element-text"
  | "element-toggle"
  | "element-button"
  | "element-select"
  | "element-text-input"
  | "element-icon"
  | "element-image"
  | "element-container";

interface BaseComponentElement {
  instanceId: string;
  flex?: number | null;
}

interface ElementSpacingStyles {
  paddingX: number;
  paddingY: number;
  marginX: number;
  marginY: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

interface TextElementStyles extends ElementSpacingStyles {
  alignment: "left" | "center" | "right";
  size: number;
  isBold: boolean;
  isItalic: boolean;
  isLabel: boolean;
}

interface ToggleElementStyles extends ElementSpacingStyles {
  position: "left" | "center" | "right";
}

interface IconElementStyles extends ElementSpacingStyles {
  size: number;
}

type ElementDimension = number | string;
type ButtonWidth = number | "full" | "auto";

interface ButtonElementStyles extends ElementSpacingStyles {
  width: ButtonWidth;
}

interface TextInputElementStyles extends ElementSpacingStyles {
  alignment: "left" | "center" | "right";
  width: ButtonWidth;
}

interface SelectElementStyles extends ElementSpacingStyles {}

interface ImageElementStyles extends ElementSpacingStyles {
  sizing: "contain" | "cover";
  width: ButtonWidth;
  height: ElementDimension;
}

type FlexJustifyContent =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";

type FlexAlignItems = "start" | "center" | "end" | "stretch";

interface ContainerElementStyles {
  flexDirection: "row" | "column";
  justifyContent: FlexJustifyContent;
  alignItems: FlexAlignItems;
  overflowScroll: boolean;
  gap: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  borderWidth: number;
}

interface TextComponentElement extends BaseComponentElement {
  elementTypeId: "element-text";
  value: string;
  apiBinding?: string | null;
  styles: TextElementStyles;
}

interface ToggleComponentElement extends BaseComponentElement {
  elementTypeId: "element-toggle";
  defaultValue: boolean;
  styles: ToggleElementStyles;
}

interface ButtonComponentElement extends BaseComponentElement {
  elementTypeId: "element-button";
  label: string;
  highlightOnHover: boolean;
  isGhost: boolean;
  styles: ButtonElementStyles;
}

interface SelectComponentElement extends BaseComponentElement {
  elementTypeId: "element-select";
  values: string[];
  styles: SelectElementStyles;
}

interface TextInputComponentElement extends BaseComponentElement {
  elementTypeId: "element-text-input";
  textHint: string;
  value: string;
  styles: TextInputElementStyles;
}

interface IconComponentElement extends BaseComponentElement {
  elementTypeId: "element-icon";
  value: string;
  styles: IconElementStyles;
}

interface ImageComponentElement extends BaseComponentElement {
  elementTypeId: "element-image";
  styles: ImageElementStyles;
  src: string;
}

interface ContainerComponentElement extends BaseComponentElement {
  elementTypeId: "element-container";
  elements: ComponentElement[];
  styles: ContainerElementStyles;
}

type ComponentDirection = "horizontal" | "vertical";

type ComponentElement =
  | TextComponentElement
  | ToggleComponentElement
  | ButtonComponentElement
  | SelectComponentElement
  | TextInputComponentElement
  | IconComponentElement
  | ImageComponentElement
  | ContainerComponentElement;

interface ComponentStyles {
  direction: ComponentDirection;
  justifyContent: FlexJustifyContent;
  alignItems: FlexAlignItems;
  overflowScroll: boolean;
  overflowXScroll?: boolean;
  overflowYScroll?: boolean;
  gap: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  paddingX: number;
  paddingY: number;
  marginX: number;
  marginY: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  borderWidth: number;
}

interface AppComponent {
  id: string;
  label: string;
  elements: ComponentElement[];
  styles: ComponentStyles;
  api: ApiComponentConfig;
}

type ApiRequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

interface ApiRequestHeader {
  id: string;
  key: string;
  value: string;
}

interface ApiComponentConfig {
  isApitComponent: boolean;
  request: {
    url: string;
    method: ApiRequestMethod;
    headers: ApiRequestHeader[];
    body: string;
  };
  response: {
    rawTestData: string;
  };
}

type ContainerColorField = "backgroundColor" | "borderColor";

type ColorEditTarget =
  | {
      scope: "component";
      componentId: string;
      field: ContainerColorField;
      styles: ComponentStyles;
    }
  | {
      scope: "page";
      pageId: string;
      field: ContainerColorField;
      styles: ComponentStyles;
    }
  | {
      scope: "vertical-container";
      componentId: string;
      elementId: string;
      field: ContainerColorField;
      styles: ContainerElementStyles;
    }
  | {
      scope: "theme";
      variable: ThemeVariableKey;
      mode: ThemePreviewMode;
    };

interface PrebuiltElementDef {
  id: ElementTypeId;
  label: string;
  value?: string | boolean;
  values?: string[];
  showDefaultLabel?: boolean;
  defaultLabel?: string;
  styles?: {
    alignment?: "left" | "center" | "right";
    position?: "left" | "center" | "right";
    justifyContent?: FlexJustifyContent;
    alignItems?: FlexAlignItems;
    flexDirection?: "row" | "column";
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    size?: number;
    fontWeight?: number;
    isBold?: boolean;
    isItalic?: boolean;
    isLabel?: boolean;
    sizing?: "contain" | "cover";
    width?: ElementDimension;
    height?: ElementDimension;
    containerWidth?: ElementDimension;
    containerHeight?: ElementDimension;
    gap?: number;
    textColor?: string;
    color?: string;
    labelColor?: string;
    activeColor?: string;
    inactiveColor?: string;
    highlightColor?: string;
    padding?: number;
  };
  textHint?: string;
  sizing?: "contain" | "cover";
  src?: string;
  buttonLabel?: string;
  highlightOnHover?: boolean;
  isGhost?: boolean;
}

type DrawerState = "closed" | "icons-only" | "open";
type ActiveTab = "navigation" | "pages" | "components" | "theme";
type ThemeVariableKey =
  | "primary"
  | "secondary"
  | "tertiary"
  | "highlight"
  | "text"
  | "button"
  | "textHint"
  | "background"
  | "border";

interface ColorThemePair {
  light: string;
  dark: string;
}

type ColorTheme = Record<ThemeVariableKey, ColorThemePair>;

type ThemePreviewMode = "light" | "dark";
type NewCustomComponentMode =
  | "blank-component"
  | "project-components"
  | "component-library";

const THEME_VARIABLE_KEYS: ThemeVariableKey[] = [
  "primary",
  "secondary",
  "tertiary",
  "highlight",
  "background",
  "border",
  "text",
  "button",
  "textHint",
];

const THEME_VARIABLE_LABELS: Record<ThemeVariableKey, string> = (() => {
  const raw = (prebuiltSourceConfig as Record<string, unknown>).colorTheme;
  const parsed =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return THEME_VARIABLE_KEYS.reduce(
    (acc, key) => {
      const entry = parsed[key] as { label?: unknown } | undefined;
      acc[key] =
        typeof entry?.label === "string" && entry.label.trim().length > 0
          ? entry.label
          : key;
      return acc;
    },
    {} as Record<ThemeVariableKey, string>,
  );
})();

const DEFAULT_COLOR_THEME: ColorTheme = (() => {
  const raw = (prebuiltSourceConfig as Record<string, unknown>).colorTheme;
  if (!raw || typeof raw !== "object") {
    return THEME_VARIABLE_KEYS.reduce((acc, key) => {
      acc[key] = { light: "#000000", dark: "#ffffff" };
      return acc;
    }, {} as ColorTheme);
  }
  const parsed = raw as Record<string, unknown>;

  return THEME_VARIABLE_KEYS.reduce((acc, key) => {
    const candidate = parsed[key] as
      | { light?: unknown; dark?: unknown; label?: unknown }
      | undefined;
    acc[key] = {
      light:
        candidate && typeof candidate.light === "string"
          ? candidate.light
          : "#000000",
      dark:
        candidate && typeof candidate.dark === "string"
          ? candidate.dark
          : "#ffffff",
    };
    return acc;
  }, {} as ColorTheme);
})();

const normalizeColorTheme = (raw: unknown): ColorTheme => {
  const parsed =
    raw && typeof raw === "object"
      ? (raw as Partial<Record<ThemeVariableKey, Partial<ColorThemePair>>>)
      : {};

  return THEME_VARIABLE_KEYS.reduce((acc, key) => {
    const candidate = parsed[key];
    const fallback = DEFAULT_COLOR_THEME[key];
    acc[key] = {
      light:
        candidate && typeof candidate.light === "string"
          ? candidate.light
          : fallback.light,
      dark:
        candidate && typeof candidate.dark === "string"
          ? candidate.dark
          : fallback.dark,
    };
    return acc;
  }, {} as ColorTheme);
};
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

const DEFAULT_NAVIGATION_STYLE: NavigationStyle = (() => {
  const raw = (prebuiltSourceConfig as Record<string, unknown>).navigation;
  if (!raw || typeof raw !== "object")
    return { type: "drawer" as const, variant: "all" as const };
  const nav = raw as Record<string, unknown>;
  const style = nav.navigationStyle;
  if (!style || typeof style !== "object")
    return { type: "drawer" as const, variant: "all" as const };
  const s = style as Record<string, unknown>;
  if (s.type === "drawer") {
    return {
      type: "drawer" as const,
      variant:
        s.variant === "short" || s.variant === "long" || s.variant === "all"
          ? s.variant
          : ("all" as const),
    };
  }
  if (s.type === "bottom") {
    return {
      type: "bottom" as const,
      variant:
        s.variant === "short" || s.variant === "long"
          ? s.variant
          : ("short" as const),
    };
  }
  return { type: "drawer" as const, variant: "all" as const };
})();

const API_REQUEST_METHODS: ApiRequestMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

const createDefaultApiComponentConfig = (): ApiComponentConfig => ({
  isApitComponent: false,
  request: {
    url: "",
    method: "GET",
    headers: [],
    body: "",
  },
  response: {
    rawTestData: "",
  },
});

const getSafeApiComponentConfig = (
  api: ApiComponentConfig | undefined,
): ApiComponentConfig =>
  api
    ? {
        isApitComponent: Boolean(
          (api as { isApitComponent?: unknown }).isApitComponent ??
          (api as { enabled?: unknown }).enabled,
        ),
        request: {
          url: api.request?.url ?? "",
          method: API_REQUEST_METHODS.includes(api.request?.method)
            ? api.request.method
            : "GET",
          headers: Array.isArray(api.request?.headers)
            ? api.request.headers.map((header) => ({
                id:
                  typeof header.id === "string" && header.id.trim().length > 0
                    ? header.id
                    : crypto.randomUUID(),
                key: typeof header.key === "string" ? header.key : "",
                value: typeof header.value === "string" ? header.value : "",
              }))
            : [],
          body: api.request?.body ?? "",
        },
        response: {
          rawTestData:
            api.response?.rawTestData ??
            (api.response as { testJson?: unknown })?.testJson?.toString?.() ??
            "",
        },
      }
    : createDefaultApiComponentConfig();

const APP_CONFIG = prebuiltSourceConfig as AppgenConfigFile;

const DEFAULT_SETTING_COMPONENTS: SettingComponentDefinition[] = Array.isArray(
  APP_CONFIG.prebuilt?.components,
)
  ? (APP_CONFIG.prebuilt?.components as unknown[])
      .map((component, index) => {
        if (!component || typeof component !== "object") return null;
        const entry = component as Record<string, unknown>;
        const type =
          entry.type === "toggle" ||
          entry.type === "input" ||
          entry.type === "select" ||
          entry.type === "header"
            ? entry.type
            : null;
        if (!type) return null;

        return {
          id:
            typeof entry.id === "string" && entry.id.trim().length > 0
              ? entry.id
              : `component-type-${type}-${index + 1}`,
          type,
          label:
            typeof entry.label === "string" && entry.label.trim().length > 0
              ? entry.label
              : type,
          kind: "prebuilt" as const,
        };
      })
      .filter(
        (component): component is SettingComponentDefinition =>
          component !== null,
      )
  : [];

const PREBUILT_SOURCE_PAGES: ExportedPrebuiltPage[] = Array.isArray(
  APP_CONFIG.prebuilt?.pages,
)
  ? (APP_CONFIG.prebuilt?.pages as unknown[])
      .map((page) => {
        if (!page || typeof page !== "object") return null;
        const entry = page as Record<string, unknown>;
        if (typeof entry.id !== "string" || typeof entry.title !== "string") {
          return null;
        }

        return {
          id: entry.id,
          title: entry.title,
          items: Array.isArray(entry.items)
            ? (entry.items as Array<SettingsItem | HeaderPrebuiltItem>)
            : [],
        };
      })
      .filter((page): page is ExportedPrebuiltPage => page !== null)
  : [];

const PREBUILT_PAGES_FROM_SOURCE: AppPage[] = [];

export type {
  ComponentElement,
  ComponentStyles,
  AppComponent,
  ComponentDirection,
};

export const PREBUILT_ELEMENTS: PrebuiltElementDef[] = Array.isArray(
  APP_CONFIG.prebuilt?.elements,
)
  ? (APP_CONFIG.prebuilt?.elements as PrebuiltElementDef[])
      .filter((element): element is PrebuiltElementDef =>
        Boolean(
          element &&
          typeof element === "object" &&
          (typeof (element as { id?: unknown }).id === "string" ||
            typeof (element as { elementTypeId?: unknown }).elementTypeId ===
              "string"),
        ),
      )
      .map((element) => ({
        ...element,
        id:
          (element as { id?: string }).id ??
          ((element as { elementTypeId?: string })
            .elementTypeId as ElementTypeId),
      }))
  : [];

const ELEMENT_TYPE_IDS = new Set<string>([
  ...PREBUILT_ELEMENTS.map((e) => e.id),
]);

const clampComponentSpacing = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(200, Math.round(parsed)));
};

const clampTextSize = (size: unknown): number => {
  const parsed = typeof size === "number" ? size : Number(size);
  if (!Number.isFinite(parsed)) return 3;
  return Math.max(1, Math.min(10, Math.round(parsed)));
};

const getPrebuiltElementDef = (
  id: ElementTypeId,
): PrebuiltElementDef | undefined =>
  PREBUILT_ELEMENTS.find((element) => element.id === id);

const getDefaultTextStyles = (): TextElementStyles => {
  const styles = getPrebuiltElementDef("element-text")?.styles;
  return {
    ...getDefaultElementSpacingStyles(),
    alignment:
      styles?.alignment === "left" ||
      styles?.alignment === "center" ||
      styles?.alignment === "right"
        ? styles.alignment
        : "center",
    size: clampTextSize(styles?.size),
    isBold: Boolean(styles?.isBold),
    isItalic: Boolean(styles?.isItalic),
    isLabel: Boolean(styles?.isLabel),
  };
};

const getDefaultToggleValue = (): boolean =>
  typeof getPrebuiltElementDef("element-toggle")?.value === "boolean"
    ? (getPrebuiltElementDef("element-toggle")?.value as boolean)
    : false;

const getDefaultToggleStyles = (): ToggleElementStyles => {
  const styles = getPrebuiltElementDef("element-toggle")?.styles;
  return {
    ...getDefaultElementSpacingStyles(),
    position:
      styles?.position === "left" ||
      styles?.position === "center" ||
      styles?.position === "right"
        ? styles.position
        : styles?.alignment === "left" ||
            styles?.alignment === "center" ||
            styles?.alignment === "right"
          ? styles.alignment
          : "center",
  };
};

const getDefaultButtonLabel = (): string => {
  const label = getPrebuiltElementDef("element-button")?.buttonLabel;
  return typeof label === "string" ? label : "";
};

const getDefaultButtonHighlightOnHover = (): boolean => {
  const value = getPrebuiltElementDef("element-button")?.highlightOnHover;
  return Boolean(value);
};

const getDefaultButtonIsGhost = (): boolean => {
  const value = getPrebuiltElementDef("element-button")?.isGhost;
  return Boolean(value);
};

const normalizeButtonWidth = (value: unknown): ButtonWidth => {
  if (value === "auto") return "auto";
  if (value === "full") return "full";

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "auto") return "auto";
    if (trimmed === "full") return "full";
    if (/^\d+$/.test(trimmed)) {
      const parsed = Number(trimmed);
      if (parsed > 0) return parsed;
    }
  }

  return "auto";
};

const normalizeImageWidth = (value: unknown): ButtonWidth => {
  if (value === "full" || value === "100%") return "full";

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "full" || trimmed === "100%") return "full";
    if (/^\d+$/.test(trimmed)) {
      const parsed = Number(trimmed);
      if (parsed > 0) return parsed;
    }
    if (/^\d+px$/.test(trimmed)) {
      const parsed = Number(trimmed.replace("px", ""));
      if (parsed > 0) return parsed;
    }
  }

  return "full";
};

const getDefaultButtonStyles = (): ButtonElementStyles => {
  const styles = getPrebuiltElementDef("element-button")?.styles;
  return {
    ...getDefaultElementSpacingStyles(),
    width: normalizeButtonWidth(styles?.width),
  };
};

const getDefaultSelectStyles = (): SelectElementStyles => ({
  ...getDefaultElementSpacingStyles(),
});

const getDefaultSelectValues = (): string[] => {
  const values = getPrebuiltElementDef("element-select")?.values;
  if (!Array.isArray(values)) return [];
  return values.filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
};

const getDefaultTextInputHint = (): string => {
  const hint = getPrebuiltElementDef("element-text-input")?.textHint;
  return typeof hint === "string" ? hint : "";
};

const getDefaultTextInputStyles = (): TextInputElementStyles => {
  const styles = getPrebuiltElementDef("element-text-input")?.styles;
  return {
    ...getDefaultElementSpacingStyles(),
    alignment:
      styles?.alignment === "left" ||
      styles?.alignment === "center" ||
      styles?.alignment === "right"
        ? styles.alignment
        : "center",
    width: normalizeButtonWidth(styles?.width),
  };
};

const getDefaultIconValue = (): string => {
  const value = getPrebuiltElementDef("element-icon")?.value;
  return typeof value === "string" ? value : "";
};

const getDefaultIconStyles = (): IconElementStyles => {
  const styles = getPrebuiltElementDef("element-icon")?.styles;
  return {
    ...getDefaultElementSpacingStyles(),
    size: clampTextSize(styles?.size),
  };
};

const getDefaultImageSizing = (): "contain" | "cover" => {
  const sizing = getPrebuiltElementDef("element-image")?.styles?.sizing;
  if (sizing === "cover" || sizing === "contain") {
    return sizing;
  }
  return "contain";
};

const normalizeDimension = (
  value: unknown,
  fallback: ElementDimension,
): ElementDimension => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return fallback;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    return trimmed;
  }

  return fallback;
};

const getDefaultImageStyles = (): ImageElementStyles => {
  const styles = getPrebuiltElementDef("element-image")?.styles;
  return {
    ...getDefaultElementSpacingStyles(),
    sizing:
      styles?.sizing === "contain" || styles?.sizing === "cover"
        ? styles.sizing
        : "contain",
    width: normalizeImageWidth(styles?.width),
    height: normalizeDimension(styles?.height, "auto"),
  };
};

const clampFlexGap = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(50, Math.round(parsed)));
};

const clampContainerDimension = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(4096, Math.round(parsed)));
};

const normalizeElementFlex = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length === 0 || trimmed === "none") return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.min(10, Math.round(parsed)));
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(10, Math.round(value)));
  }

  return null;
};

const DEFAULT_CONTAINER_MAX_DIMENSION = (() => {
  const styles = getPrebuiltElementDef("element-container")?.styles;
  const raw = (styles as Record<string, unknown> | undefined)?.maxWidth;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  return 4096;
})();

function getDefaultElementSpacingStyles(): ElementSpacingStyles {
  return {
    paddingX: 0,
    paddingY: 0,
    marginX: 0,
    marginY: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  };
}

const normalizeAxisValue = (
  rawAxis: unknown,
  rawStart: unknown,
  rawEnd: unknown,
): { axis: number; start: number; end: number } => {
  const axisParsed = clampComponentSpacing(rawAxis);
  const startParsed =
    rawStart === undefined ? axisParsed : clampComponentSpacing(rawStart);
  const endParsed =
    rawEnd === undefined ? axisParsed : clampComponentSpacing(rawEnd);
  const axis =
    rawAxis === undefined
      ? startParsed === endParsed
        ? startParsed
        : axisParsed
      : axisParsed;

  return {
    axis,
    start: startParsed,
    end: endParsed,
  };
};

const normalizeElementSpacingStyles = (
  rawStyles: Record<string, unknown>,
  entry: Record<string, unknown>,
  defaultStyles: ElementSpacingStyles,
): ElementSpacingStyles => {
  const paddingXValues = normalizeAxisValue(
    rawStyles.paddingX ?? entry.paddingX,
    rawStyles.paddingLeft ?? entry.paddingLeft,
    rawStyles.paddingRight ?? entry.paddingRight,
  );
  const paddingYValues = normalizeAxisValue(
    rawStyles.paddingY ?? entry.paddingY,
    rawStyles.paddingTop ?? entry.paddingTop,
    rawStyles.paddingBottom ?? entry.paddingBottom,
  );
  const marginXValues = normalizeAxisValue(
    rawStyles.marginX ?? entry.marginX,
    rawStyles.marginLeft ?? entry.marginLeft,
    rawStyles.marginRight ?? entry.marginRight,
  );
  const marginYValues = normalizeAxisValue(
    rawStyles.marginY ?? entry.marginY,
    rawStyles.marginTop ?? entry.marginTop,
    rawStyles.marginBottom ?? entry.marginBottom,
  );

  return {
    paddingX:
      rawStyles.paddingX === undefined && entry.paddingX === undefined
        ? defaultStyles.paddingX
        : paddingXValues.axis,
    paddingY:
      rawStyles.paddingY === undefined && entry.paddingY === undefined
        ? defaultStyles.paddingY
        : paddingYValues.axis,
    marginX:
      rawStyles.marginX === undefined && entry.marginX === undefined
        ? defaultStyles.marginX
        : marginXValues.axis,
    marginY:
      rawStyles.marginY === undefined && entry.marginY === undefined
        ? defaultStyles.marginY
        : marginYValues.axis,
    paddingTop:
      rawStyles.paddingTop === undefined &&
      entry.paddingTop === undefined &&
      rawStyles.paddingY === undefined &&
      entry.paddingY === undefined
        ? defaultStyles.paddingTop
        : paddingYValues.start,
    paddingBottom:
      rawStyles.paddingBottom === undefined &&
      entry.paddingBottom === undefined &&
      rawStyles.paddingY === undefined &&
      entry.paddingY === undefined
        ? defaultStyles.paddingBottom
        : paddingYValues.end,
    paddingLeft:
      rawStyles.paddingLeft === undefined &&
      entry.paddingLeft === undefined &&
      rawStyles.paddingX === undefined &&
      entry.paddingX === undefined
        ? defaultStyles.paddingLeft
        : paddingXValues.start,
    paddingRight:
      rawStyles.paddingRight === undefined &&
      entry.paddingRight === undefined &&
      rawStyles.paddingX === undefined &&
      entry.paddingX === undefined
        ? defaultStyles.paddingRight
        : paddingXValues.end,
    marginTop:
      rawStyles.marginTop === undefined &&
      entry.marginTop === undefined &&
      rawStyles.marginY === undefined &&
      entry.marginY === undefined
        ? defaultStyles.marginTop
        : marginYValues.start,
    marginBottom:
      rawStyles.marginBottom === undefined &&
      entry.marginBottom === undefined &&
      rawStyles.marginY === undefined &&
      entry.marginY === undefined
        ? defaultStyles.marginBottom
        : marginYValues.end,
    marginLeft:
      rawStyles.marginLeft === undefined &&
      entry.marginLeft === undefined &&
      rawStyles.marginX === undefined &&
      entry.marginX === undefined
        ? defaultStyles.marginLeft
        : marginXValues.start,
    marginRight:
      rawStyles.marginRight === undefined &&
      entry.marginRight === undefined &&
      rawStyles.marginX === undefined &&
      entry.marginX === undefined
        ? defaultStyles.marginRight
        : marginXValues.end,
  };
};

export const getBoxSpacingStyle = (
  styles: ElementSpacingStyles,
): CSSProperties => ({
  paddingTop: `${styles.paddingTop}px`,
  paddingBottom: `${styles.paddingBottom}px`,
  paddingLeft: `${styles.paddingLeft}px`,
  paddingRight: `${styles.paddingRight}px`,
  marginTop: `${styles.marginTop}px`,
  marginBottom: `${styles.marginBottom}px`,
  marginLeft: `${styles.marginLeft}px`,
  marginRight: `${styles.marginRight}px`,
});

type EditableElementSpacingStyles = ElementSpacingStyles &
  Record<string, unknown>;

const getElementSpacingStyleEntries = (
  styles: ElementSpacingStyles,
): Array<[string, string]> => [
  ["paddingTop", `${styles.paddingTop}px`],
  ["paddingBottom", `${styles.paddingBottom}px`],
  ["paddingLeft", `${styles.paddingLeft}px`],
  ["paddingRight", `${styles.paddingRight}px`],
  ["marginTop", `${styles.marginTop}px`],
  ["marginBottom", `${styles.marginBottom}px`],
  ["marginLeft", `${styles.marginLeft}px`],
  ["marginRight", `${styles.marginRight}px`],
];

const getExplicitElementSpacingJson = (
  styles: ElementSpacingStyles,
): Record<string, number> => ({
  paddingX: styles.paddingX ?? 0,
  paddingY: styles.paddingY ?? 0,
  marginX: styles.marginX ?? 0,
  marginY: styles.marginY ?? 0,
  paddingTop: styles.paddingTop ?? 0,
  paddingBottom: styles.paddingBottom ?? 0,
  paddingLeft: styles.paddingLeft ?? 0,
  paddingRight: styles.paddingRight ?? 0,
  marginTop: styles.marginTop ?? 0,
  marginBottom: styles.marginBottom ?? 0,
  marginLeft: styles.marginLeft ?? 0,
  marginRight: styles.marginRight ?? 0,
});

const clampContainerBorderRadius = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(64, Math.round(parsed)));
};

const clampContainerBorderWidth = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(16, Math.round(parsed)));
};

const normalizeHexColor = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (trimmed.toLowerCase() === "transparent") {
    return "#ffffff00";
  }

  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)
    ? trimmed
    : fallback;
};

const clampRgbChannel = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(255, Math.round(parsed)));
};

const hexToRgba = (
  value: string,
): { r: number; g: number; b: number; a: number } | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("#")) return null;

  const hexBody = trimmed.slice(1);
  if (hexBody.length === 3) {
    const r = Number.parseInt(`${hexBody[0]}${hexBody[0]}`, 16);
    const g = Number.parseInt(`${hexBody[1]}${hexBody[1]}`, 16);
    const b = Number.parseInt(`${hexBody[2]}${hexBody[2]}`, 16);
    if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
    return { r, g, b, a: 255 };
  }

  if (hexBody.length === 6) {
    const r = Number.parseInt(hexBody.slice(0, 2), 16);
    const g = Number.parseInt(hexBody.slice(2, 4), 16);
    const b = Number.parseInt(hexBody.slice(4, 6), 16);
    if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
    return { r, g, b, a: 255 };
  }

  if (hexBody.length === 8) {
    const r = Number.parseInt(hexBody.slice(0, 2), 16);
    const g = Number.parseInt(hexBody.slice(2, 4), 16);
    const b = Number.parseInt(hexBody.slice(4, 6), 16);
    const a = Number.parseInt(hexBody.slice(6, 8), 16);
    if ([r, g, b, a].some((channel) => Number.isNaN(channel))) return null;
    return { r, g, b, a };
  }

  return null;
};

const rgbaToHex = (
  r: number,
  g: number,
  b: number,
  a = 255,
  includeAlpha = false,
): string => {
  const toHex = (value: number) =>
    clampRgbChannel(value).toString(16).padStart(2, "0");
  const alphaHex = clampRgbChannel(a).toString(16).padStart(2, "0");
  return includeAlpha
    ? `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`
    : `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const isThemeRef = (color: string): boolean =>
  color.startsWith("$") &&
  THEME_VARIABLE_KEYS.includes(color.slice(1) as ThemeVariableKey);

const normalizeThemeAwareColor = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (isThemeRef(trimmed)) return trimmed;
  return normalizeHexColor(trimmed, fallback);
};

export const resolveThemeColor = (
  color: string,
  theme: ColorTheme,
  mode: ThemePreviewMode,
): string => {
  if (!isThemeRef(color)) return color;
  const key = color.slice(1) as ThemeVariableKey;
  return theme[key][mode];
};

const suggestDarkFromLight = (lightHex: string): string => {
  const rgba = hexToRgba(lightHex);
  if (!rgba) return lightHex;
  const r = Math.min(255, Math.round(rgba.r * 0.35 + 10));
  const g = Math.min(255, Math.round(rgba.g * 0.35 + 10));
  const b = Math.min(255, Math.round(rgba.b * 0.35 + 20));
  return rgbaToHex(r, g, b, rgba.a, rgba.a < 255);
};

const suggestLightFromDark = (darkHex: string): string => {
  const rgba = hexToRgba(darkHex);
  if (!rgba) return darkHex;
  const r = Math.min(255, Math.round(rgba.r + (255 - rgba.r) * 0.72));
  const g = Math.min(255, Math.round(rgba.g + (255 - rgba.g) * 0.72));
  const b = Math.min(255, Math.round(rgba.b + (255 - rgba.b) * 0.72));
  return rgbaToHex(r, g, b, rgba.a, rgba.a < 255);
};

const normalizeFlexJustifyContent = (
  value: unknown,
  fallback: FlexJustifyContent,
): FlexJustifyContent => {
  if (
    value === "start" ||
    value === "center" ||
    value === "end" ||
    value === "space-between" ||
    value === "space-around" ||
    value === "space-evenly"
  ) {
    return value;
  }

  return fallback;
};

const normalizeFlexAlignItems = (
  value: unknown,
  fallback: FlexAlignItems,
): FlexAlignItems => {
  if (
    value === "start" ||
    value === "center" ||
    value === "end" ||
    value === "stretch"
  ) {
    return value;
  }

  return fallback;
};

const getDefaultComponentStyles = (): ComponentStyles => {
  const raw = getPrebuiltElementDef("element-container")?.styles;
  const styles = raw as Record<string, unknown> | undefined;
  const flexDir =
    styles?.flexDirection === "row" || styles?.flexDirection === "column"
      ? styles.flexDirection
      : "row";
  return {
    direction: flexDir === "row" ? "horizontal" : "vertical",
    justifyContent: normalizeFlexJustifyContent(
      styles?.justifyContent,
      "start",
    ),
    alignItems: normalizeFlexAlignItems(
      styles?.alignItems,
      styles?.alignment === "start" ||
        styles?.alignment === "center" ||
        styles?.alignment === "end"
        ? styles.alignment
        : "start",
    ),
    overflowScroll: Boolean(styles?.overflowScroll),
    overflowXScroll: false,
    overflowYScroll: false,
    gap: clampFlexGap(styles?.gap),
    minWidth: clampContainerDimension(styles?.minWidth),
    maxWidth:
      clampContainerDimension(styles?.maxWidth) ||
      DEFAULT_CONTAINER_MAX_DIMENSION,
    minHeight: clampContainerDimension(styles?.minHeight),
    maxHeight:
      clampContainerDimension(styles?.maxHeight) ||
      DEFAULT_CONTAINER_MAX_DIMENSION,
    paddingX: clampComponentSpacing(
      styles?.paddingX ?? styles?.paddingLeft ?? 0,
    ),
    paddingY: clampComponentSpacing(
      styles?.paddingY ?? styles?.paddingTop ?? 0,
    ),
    marginX: clampComponentSpacing(styles?.marginX ?? styles?.marginLeft ?? 0),
    marginY: clampComponentSpacing(styles?.marginY ?? styles?.marginTop ?? 0),
    paddingTop: clampComponentSpacing(
      styles?.paddingTop ?? styles?.paddingY ?? 0,
    ),
    paddingBottom: clampComponentSpacing(
      styles?.paddingBottom ?? styles?.paddingY ?? 0,
    ),
    paddingLeft: clampComponentSpacing(
      styles?.paddingLeft ?? styles?.paddingX ?? 0,
    ),
    paddingRight: clampComponentSpacing(
      styles?.paddingRight ?? styles?.paddingX ?? 0,
    ),
    marginTop: clampComponentSpacing(styles?.marginTop ?? styles?.marginY ?? 0),
    marginBottom: clampComponentSpacing(
      styles?.marginBottom ?? styles?.marginY ?? 0,
    ),
    marginLeft: clampComponentSpacing(
      styles?.marginLeft ?? styles?.marginX ?? 0,
    ),
    marginRight: clampComponentSpacing(
      styles?.marginRight ?? styles?.marginX ?? 0,
    ),
    backgroundColor: normalizeThemeAwareColor(
      styles?.backgroundColor,
      "$background",
    ),
    borderColor: normalizeThemeAwareColor(styles?.borderColor, "$border"),
    borderRadius: clampContainerBorderRadius(styles?.borderRadius),
    borderWidth: clampContainerBorderWidth(styles?.borderWidth),
  };
};

const getDefaultPageStyles = (): ComponentStyles => ({
  ...getDefaultComponentStyles(),
  direction: "vertical",
  justifyContent: "start",
  alignItems: "center",
});

const toUrlSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizePageUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const getDefaultPageUrl = (title: string, id: string): string => {
  const slug = toUrlSlug(title);
  if (slug.length > 0) {
    return `/${slug}`;
  }

  return `/${id}`;
};

const getDefaultContainerStyles = (): ContainerElementStyles => {
  const raw = getPrebuiltElementDef("element-container")?.styles;
  const styles = raw as Record<string, unknown> | undefined;
  return {
    flexDirection:
      styles?.flexDirection === "row" || styles?.flexDirection === "column"
        ? styles.flexDirection
        : "column",
    justifyContent: normalizeFlexJustifyContent(
      styles?.justifyContent,
      "start",
    ),
    alignItems: normalizeFlexAlignItems(
      styles?.alignItems,
      styles?.alignment === "start" ||
        styles?.alignment === "center" ||
        styles?.alignment === "end"
        ? styles.alignment
        : "start",
    ),
    overflowScroll: Boolean(styles?.overflowScroll),
    gap: clampFlexGap(styles?.gap),
    minWidth: clampContainerDimension(styles?.minWidth),
    maxWidth:
      clampContainerDimension(styles?.maxWidth) ||
      DEFAULT_CONTAINER_MAX_DIMENSION,
    minHeight: clampContainerDimension(styles?.minHeight),
    maxHeight:
      clampContainerDimension(styles?.maxHeight) ||
      DEFAULT_CONTAINER_MAX_DIMENSION,
    paddingTop: clampComponentSpacing(styles?.paddingTop ?? 0),
    paddingBottom: clampComponentSpacing(styles?.paddingBottom ?? 0),
    paddingLeft: clampComponentSpacing(styles?.paddingLeft ?? 0),
    paddingRight: clampComponentSpacing(styles?.paddingRight ?? 0),
    marginTop: clampComponentSpacing(styles?.marginTop ?? 0),
    marginBottom: clampComponentSpacing(styles?.marginBottom ?? 0),
    marginLeft: clampComponentSpacing(styles?.marginLeft ?? 0),
    marginRight: clampComponentSpacing(styles?.marginRight ?? 0),
    backgroundColor: normalizeThemeAwareColor(
      styles?.backgroundColor,
      "$background",
    ),
    borderColor: normalizeThemeAwareColor(styles?.borderColor, "$border"),
    borderRadius: clampContainerBorderRadius(styles?.borderRadius),
    borderWidth: clampContainerBorderWidth(styles?.borderWidth),
  };
};

const getDefaultImageSrc = (): string => {
  const src = getPrebuiltElementDef("element-image")?.src;
  return typeof src === "string" ? src : "";
};

const normalizeSelectValues = (rawValues: unknown): string[] => {
  if (!Array.isArray(rawValues)) {
    return getDefaultSelectValues();
  }

  return rawValues.filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
};

export const normalizeElementFromRaw = (
  raw: unknown,
): ComponentElement | null => {
  if (!raw || typeof raw !== "object") return null;

  const entry = raw as Record<string, unknown>;
  const elementTypeId = entry.elementTypeId;
  if (
    typeof elementTypeId !== "string" ||
    !ELEMENT_TYPE_IDS.has(elementTypeId)
  ) {
    return null;
  }

  const instanceId =
    typeof entry.instanceId === "string" && entry.instanceId.trim().length > 0
      ? entry.instanceId
      : crypto.randomUUID();
  const elementFlex = normalizeElementFlex(entry.flex);

  switch (elementTypeId as ElementTypeId) {
    case "element-text": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultTextStyles();

      return {
        instanceId,
        flex: elementFlex,
        elementTypeId: "element-text",
        value: typeof entry.value === "string" ? entry.value : "",
        apiBinding:
          typeof entry.apiBinding === "string" &&
          entry.apiBinding.trim().startsWith("data.")
            ? entry.apiBinding.trim()
            : null,
        styles: {
          ...normalizeElementSpacingStyles(rawStyles, entry, defaultStyles),
          alignment:
            rawStyles.alignment === "left" ||
            rawStyles.alignment === "center" ||
            rawStyles.alignment === "right"
              ? rawStyles.alignment
              : entry.alignment === "left" ||
                  entry.alignment === "center" ||
                  entry.alignment === "right"
                ? (entry.alignment as "left" | "center" | "right")
                : defaultStyles.alignment,
          size: clampTextSize(
            rawStyles.size ?? entry.size ?? defaultStyles.size,
          ),
          isBold: Boolean(
            rawStyles.isBold ?? entry.isBold ?? defaultStyles.isBold,
          ),
          isItalic: Boolean(
            rawStyles.isItalic ?? entry.isItalic ?? defaultStyles.isItalic,
          ),
          isLabel: Boolean(
            rawStyles.isLabel ?? entry.isLabel ?? defaultStyles.isLabel,
          ),
        },
      };
    }
    case "element-toggle": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultToggleStyles();

      return {
        instanceId,
        flex: elementFlex,
        elementTypeId: "element-toggle",
        defaultValue:
          typeof entry.defaultValue === "boolean"
            ? entry.defaultValue
            : typeof entry.value === "boolean"
              ? entry.value
              : getDefaultToggleValue(),
        styles: {
          ...normalizeElementSpacingStyles(rawStyles, entry, defaultStyles),
          position:
            rawStyles.position === "left" ||
            rawStyles.position === "center" ||
            rawStyles.position === "right"
              ? rawStyles.position
              : rawStyles.alignment === "left" ||
                  rawStyles.alignment === "center" ||
                  rawStyles.alignment === "right"
                ? (rawStyles.alignment as "left" | "center" | "right")
                : entry.position === "left" ||
                    entry.position === "center" ||
                    entry.position === "right"
                  ? (entry.position as "left" | "center" | "right")
                  : entry.alignment === "left" ||
                      entry.alignment === "center" ||
                      entry.alignment === "right"
                    ? (entry.alignment as "left" | "center" | "right")
                    : defaultStyles.position,
        },
      };
    }
    case "element-button": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultButtonStyles();

      return {
        instanceId,
        flex: elementFlex,
        elementTypeId: "element-button",
        label:
          typeof entry.label === "string" && entry.label.trim().length > 0
            ? entry.label
            : getDefaultButtonLabel(),
        highlightOnHover:
          typeof entry.highlightOnHover === "boolean"
            ? entry.highlightOnHover
            : getDefaultButtonHighlightOnHover(),
        isGhost:
          typeof entry.isGhost === "boolean"
            ? entry.isGhost
            : getDefaultButtonIsGhost(),
        styles: {
          ...normalizeElementSpacingStyles(rawStyles, entry, defaultStyles),
          width: normalizeButtonWidth(
            rawStyles.width ?? entry.width ?? defaultStyles.width,
          ),
        },
      };
    }
    case "element-select": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultSelectStyles();

      return {
        instanceId,
        flex: elementFlex,
        elementTypeId: "element-select",
        values: normalizeSelectValues(entry.values),
        styles: normalizeElementSpacingStyles(rawStyles, entry, defaultStyles),
      };
    }
    case "element-text-input": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultTextInputStyles();

      return {
        instanceId,
        flex: elementFlex,
        elementTypeId: "element-text-input",
        textHint:
          typeof entry.textHint === "string" && entry.textHint.trim().length > 0
            ? entry.textHint
            : getDefaultTextInputHint(),
        value: typeof entry.value === "string" ? entry.value : "",
        styles: {
          ...normalizeElementSpacingStyles(rawStyles, entry, defaultStyles),
          alignment:
            rawStyles.alignment === "left" ||
            rawStyles.alignment === "center" ||
            rawStyles.alignment === "right"
              ? rawStyles.alignment
              : entry.alignment === "left" ||
                  entry.alignment === "center" ||
                  entry.alignment === "right"
                ? (entry.alignment as "left" | "center" | "right")
                : defaultStyles.alignment,
          width: normalizeButtonWidth(
            rawStyles.width ?? entry.width ?? defaultStyles.width,
          ),
        },
      };
    }
    case "element-icon": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};

      return {
        instanceId,
        flex: elementFlex,
        elementTypeId: "element-icon",
        value:
          typeof entry.value === "string" && entry.value.trim().length > 0
            ? entry.value
            : getDefaultIconValue(),
        styles: {
          ...normalizeElementSpacingStyles(
            rawStyles,
            entry,
            getDefaultIconStyles(),
          ),
          size: clampTextSize(
            rawStyles.size ?? entry.size ?? getDefaultIconStyles().size,
          ),
        },
      };
    }
    case "element-image": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultImageStyles();

      return {
        instanceId,
        flex: elementFlex,
        elementTypeId: "element-image",
        styles: {
          ...normalizeElementSpacingStyles(rawStyles, entry, defaultStyles),
          sizing:
            rawStyles.sizing === "contain" || rawStyles.sizing === "cover"
              ? rawStyles.sizing
              : entry.sizing === "contain" || entry.sizing === "cover"
                ? entry.sizing
                : defaultStyles.sizing,
          width: normalizeImageWidth(
            rawStyles.width ?? entry.width ?? defaultStyles.width,
          ),
          height: normalizeDimension(
            rawStyles.height ?? entry.height,
            defaultStyles.height,
          ),
        },
        src:
          typeof entry.src === "string" && entry.src.trim().length > 0
            ? entry.src
            : getDefaultImageSrc(),
      };
    }
    case "element-container": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultContainerStyles();

      return {
        instanceId,
        flex: elementFlex,
        elementTypeId,
        elements: Array.isArray(entry.elements)
          ? entry.elements
              .map((child) => normalizeElementFromRaw(child))
              .filter((child): child is ComponentElement => Boolean(child))
          : [],
        styles: {
          flexDirection:
            rawStyles.flexDirection === "row" ||
            rawStyles.flexDirection === "column"
              ? rawStyles.flexDirection
              : defaultStyles.flexDirection,
          justifyContent: normalizeFlexJustifyContent(
            rawStyles.justifyContent ?? entry.justifyContent,
            defaultStyles.justifyContent,
          ),
          alignItems: normalizeFlexAlignItems(
            rawStyles.alignItems ??
              entry.alignItems ??
              rawStyles.alignment ??
              entry.alignment,
            defaultStyles.alignItems,
          ),
          overflowScroll:
            typeof rawStyles.overflowScroll === "boolean"
              ? rawStyles.overflowScroll
              : defaultStyles.overflowScroll,
          gap: clampFlexGap(rawStyles.gap ?? entry.gap ?? defaultStyles.gap),
          minWidth: clampContainerDimension(
            rawStyles.minWidth ?? entry.minWidth ?? defaultStyles.minWidth,
          ),
          maxWidth: clampContainerDimension(
            rawStyles.maxWidth ?? entry.maxWidth ?? defaultStyles.maxWidth,
          ),
          minHeight: clampContainerDimension(
            rawStyles.minHeight ?? entry.minHeight ?? defaultStyles.minHeight,
          ),
          maxHeight: clampContainerDimension(
            rawStyles.maxHeight ?? entry.maxHeight ?? defaultStyles.maxHeight,
          ),
          paddingTop: clampComponentSpacing(
            rawStyles.paddingTop ??
              entry.paddingTop ??
              defaultStyles.paddingTop,
          ),
          paddingBottom: clampComponentSpacing(
            rawStyles.paddingBottom ??
              entry.paddingBottom ??
              defaultStyles.paddingBottom,
          ),
          paddingLeft: clampComponentSpacing(
            rawStyles.paddingLeft ??
              entry.paddingLeft ??
              defaultStyles.paddingLeft,
          ),
          paddingRight: clampComponentSpacing(
            rawStyles.paddingRight ??
              entry.paddingRight ??
              defaultStyles.paddingRight,
          ),
          marginTop: clampComponentSpacing(
            rawStyles.marginTop ?? entry.marginTop ?? defaultStyles.marginTop,
          ),
          marginBottom: clampComponentSpacing(
            rawStyles.marginBottom ??
              entry.marginBottom ??
              defaultStyles.marginBottom,
          ),
          marginLeft: clampComponentSpacing(
            rawStyles.marginLeft ??
              entry.marginLeft ??
              defaultStyles.marginLeft,
          ),
          marginRight: clampComponentSpacing(
            rawStyles.marginRight ??
              entry.marginRight ??
              defaultStyles.marginRight,
          ),
          backgroundColor: normalizeHexColor(
            rawStyles.backgroundColor ?? entry.backgroundColor,
            defaultStyles.backgroundColor,
          ),
          borderColor: normalizeHexColor(
            rawStyles.borderColor ?? entry.borderColor,
            defaultStyles.borderColor,
          ),
          borderRadius: clampContainerBorderRadius(
            rawStyles.borderRadius ??
              entry.borderRadius ??
              defaultStyles.borderRadius,
          ),
          borderWidth: clampContainerBorderWidth(
            rawStyles.borderWidth ??
              entry.borderWidth ??
              defaultStyles.borderWidth,
          ),
        },
      };
    }
  }
};

export const normalizeComponentFromRaw = (
  raw: unknown,
): AppComponent | null => {
  if (!raw || typeof raw !== "object") return null;
  const comp = raw as Record<string, unknown>;
  const rawStyles =
    comp.styles && typeof comp.styles === "object"
      ? (comp.styles as Record<string, unknown>)
      : {};
  const defaultStyles = getDefaultComponentStyles();
  const paddingXValues = normalizeAxisValue(
    rawStyles.paddingX,
    rawStyles.paddingLeft,
    rawStyles.paddingRight,
  );
  const paddingYValues = normalizeAxisValue(
    rawStyles.paddingY,
    rawStyles.paddingTop,
    rawStyles.paddingBottom,
  );
  const marginXValues = normalizeAxisValue(
    rawStyles.marginX,
    rawStyles.marginLeft,
    rawStyles.marginRight,
  );
  const marginYValues = normalizeAxisValue(
    rawStyles.marginY,
    rawStyles.marginTop,
    rawStyles.marginBottom,
  );
  const rawApi =
    comp.api && typeof comp.api === "object"
      ? (comp.api as Record<string, unknown>)
      : {};
  const rawApiRequest =
    rawApi.request && typeof rawApi.request === "object"
      ? (rawApi.request as Record<string, unknown>)
      : {};
  const rawApiResponse =
    rawApi.response && typeof rawApi.response === "object"
      ? (rawApi.response as Record<string, unknown>)
      : {};
  const normalizedMethod =
    typeof rawApiRequest.method === "string" &&
    API_REQUEST_METHODS.includes(rawApiRequest.method as ApiRequestMethod)
      ? (rawApiRequest.method as ApiRequestMethod)
      : "GET";
  const normalizedHeaders = Array.isArray(rawApiRequest.headers)
    ? rawApiRequest.headers
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const header = entry as Record<string, unknown>;
          return {
            id:
              typeof header.id === "string" && header.id.trim().length > 0
                ? header.id
                : crypto.randomUUID(),
            key: typeof header.key === "string" ? header.key : "",
            value: typeof header.value === "string" ? header.value : "",
          };
        })
        .filter((entry): entry is ApiRequestHeader => entry !== null)
    : [];

  return {
    id:
      typeof comp.id === "string" && comp.id.trim()
        ? comp.id
        : crypto.randomUUID(),
    label: typeof comp.label === "string" ? comp.label : "Component",
    elements: Array.isArray(comp.elements)
      ? (comp.elements as unknown[])
          .map((el) => normalizeElementFromRaw(el))
          .filter((el): el is ComponentElement => Boolean(el))
      : [],
    styles: {
      direction:
        rawStyles.direction === "vertical" ||
        rawStyles.direction === "horizontal"
          ? rawStyles.direction
          : defaultStyles.direction,
      justifyContent: normalizeFlexJustifyContent(
        rawStyles.justifyContent,
        defaultStyles.justifyContent,
      ),
      alignItems: normalizeFlexAlignItems(
        rawStyles.alignItems,
        defaultStyles.alignItems,
      ),
      overflowScroll:
        typeof rawStyles.overflowScroll === "boolean"
          ? rawStyles.overflowScroll
          : defaultStyles.overflowScroll,
      gap: clampFlexGap(rawStyles.gap ?? defaultStyles.gap),
      minWidth: clampContainerDimension(
        rawStyles.minWidth ?? defaultStyles.minWidth,
      ),
      maxWidth: clampContainerDimension(
        rawStyles.maxWidth ?? defaultStyles.maxWidth,
      ),
      minHeight: clampContainerDimension(
        rawStyles.minHeight ?? defaultStyles.minHeight,
      ),
      maxHeight: clampContainerDimension(
        rawStyles.maxHeight ?? defaultStyles.maxHeight,
      ),
      paddingX: paddingXValues.axis,
      paddingY: paddingYValues.axis,
      marginX: marginXValues.axis,
      marginY: marginYValues.axis,
      paddingTop: paddingYValues.start,
      paddingBottom: paddingYValues.end,
      paddingLeft: paddingXValues.start,
      paddingRight: paddingXValues.end,
      marginTop: marginYValues.start,
      marginBottom: marginYValues.end,
      marginLeft: marginXValues.start,
      marginRight: marginXValues.end,
      backgroundColor: normalizeThemeAwareColor(
        rawStyles.backgroundColor,
        defaultStyles.backgroundColor,
      ),
      borderColor: normalizeThemeAwareColor(
        rawStyles.borderColor,
        defaultStyles.borderColor,
      ),
      borderRadius: clampContainerBorderRadius(
        rawStyles.borderRadius ?? defaultStyles.borderRadius,
      ),
      borderWidth: clampContainerBorderWidth(
        rawStyles.borderWidth ?? defaultStyles.borderWidth,
      ),
    },
    api: {
      isApitComponent: Boolean(
        (rawApi as { isApitComponent?: unknown }).isApitComponent ??
        (rawApi as { enabled?: unknown }).enabled,
      ),
      request: {
        url: typeof rawApiRequest.url === "string" ? rawApiRequest.url : "",
        method: normalizedMethod,
        headers: normalizedHeaders,
        body: typeof rawApiRequest.body === "string" ? rawApiRequest.body : "",
      },
      response: {
        rawTestData:
          typeof (rawApiResponse as { rawTestData?: unknown }).rawTestData ===
          "string"
            ? String((rawApiResponse as { rawTestData?: unknown }).rawTestData)
            : typeof (rawApiResponse as { testJson?: unknown }).testJson ===
                "string"
              ? String((rawApiResponse as { testJson?: unknown }).testJson)
              : "",
      },
    },
  };
};

const createDefaultComponentElement = (
  typeId: ElementTypeId,
): ComponentElement => {
  const instanceId = crypto.randomUUID();
  switch (typeId) {
    case "element-text":
      return {
        instanceId,
        elementTypeId: "element-text",
        value: "",
        styles: getDefaultTextStyles(),
      };
    case "element-toggle":
      return {
        instanceId,
        elementTypeId: "element-toggle",
        defaultValue: getDefaultToggleValue(),
        styles: getDefaultToggleStyles(),
      };
    case "element-button":
      return {
        instanceId,
        elementTypeId: "element-button",
        label: getDefaultButtonLabel(),
        highlightOnHover: getDefaultButtonHighlightOnHover(),
        isGhost: getDefaultButtonIsGhost(),
        styles: getDefaultButtonStyles(),
      };
    case "element-select":
      return {
        instanceId,
        elementTypeId: "element-select",
        values: getDefaultSelectValues(),
      };
    case "element-text-input":
      return {
        instanceId,
        elementTypeId: "element-text-input",
        textHint: getDefaultTextInputHint(),
        value: "",
        styles: getDefaultTextInputStyles(),
      };
    case "element-icon":
      return {
        instanceId,
        elementTypeId: "element-icon",
        value: getDefaultIconValue(),
        styles: getDefaultIconStyles(),
      };
    case "element-image":
      return {
        instanceId,
        elementTypeId: "element-image",
        styles: getDefaultImageStyles(),
        src: getDefaultImageSrc(),
      };
    case "element-container":
      return {
        instanceId,
        elementTypeId: "element-container",
        elements: [],
        styles: getDefaultContainerStyles(),
      };
  }
};

const createDefaultComponent = (label: string): AppComponent => ({
  id: crypto.randomUUID(),
  label,
  elements: [
    {
      instanceId: crypto.randomUUID(),
      elementTypeId: "element-text",
      value: label,
      styles: getDefaultTextStyles(),
    },
  ],
  styles: getDefaultComponentStyles(),
  api: createDefaultApiComponentConfig(),
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

export const toCssDimension = (value: number | string): string =>
  typeof value === "number" ? `${value}px` : value === "full" ? "100%" : value;

export const getFlexJustifyClass = (value: FlexJustifyContent): string => {
  if (value === "center") return "justify-center";
  if (value === "end") return "justify-end";
  if (value === "space-around") return "justify-around";
  if (value === "space-evenly") return "justify-evenly";
  if (value === "space-between") return "justify-between";
  return "justify-start";
};

export const getFlexAlignItemsClass = (value: FlexAlignItems): string => {
  if (value === "center") return "items-center";
  if (value === "end") return "items-end";
  if (value === "stretch") return "items-stretch";
  return "items-start";
};

export const getEffectiveFlexJustifyClass = (
  value: FlexJustifyContent,
  childCount: number,
): string => {
  const effectiveValue =
    childCount <= 1 &&
    (value === "space-between" ||
      value === "space-around" ||
      value === "space-evenly")
      ? "start"
      : value;

  return getFlexJustifyClass(effectiveValue);
};

export const getFlexOverflowStyle = (
  direction: ComponentDirection,
  overflowScroll: boolean,
): Record<string, string> => {
  if (!overflowScroll) {
    return {};
  }

  return direction === "horizontal"
    ? { overflowX: "auto", overflowY: "hidden" }
    : { overflowY: "auto", overflowX: "hidden" };
};

const toPascalCase = (value: string): string =>
  value
    .trim()
    .replace(/(^\w|[-_\s]+\w)/g, (match) =>
      match.replace(/[-_\s]+/, "").toUpperCase(),
    );

const formatJsxStyleValue = (value: string | number): string =>
  typeof value === "number" ? String(value) : JSON.stringify(value);

const formatJsxStyleBlock = (
  entries: Array<[string, string | number | undefined]>,
  indent: string,
): string => {
  const definedEntries = entries.filter((entry) => entry[1] !== undefined);
  if (definedEntries.length === 0) return "";

  return `\n${indent}  style={{\n${definedEntries
    .map(
      ([key, value]) =>
        `${indent}    ${key}: ${formatJsxStyleValue(value as string | number)},`,
    )
    .join("\n")}\n${indent}  }}`;
};

export const isTransparentHex = (value: string): boolean =>
  /^#(?:0000|ffffff00)$/i.test(value);

const getDirectionFromContainer = (
  element: ContainerComponentElement,
): ComponentDirection =>
  element.styles.flexDirection === "row" ? "horizontal" : "vertical";

const getOppositeDirection = (
  direction: ComponentDirection,
): ComponentDirection =>
  direction === "horizontal" ? "vertical" : "horizontal";

const getFlexDirectionFromComponentDirection = (
  direction: ComponentDirection,
): "row" | "column" => (direction === "horizontal" ? "row" : "column");

export const elementNeedsFullWidth = (element: ComponentElement): boolean => {
  if (isContainerElement(element)) return false; // containers handle their own sizing
  if (
    element.elementTypeId === "element-button" ||
    element.elementTypeId === "element-text-input"
  ) {
    return element.styles.width === "full";
  }
  if (element.elementTypeId === "element-image") {
    return (
      element.styles.width === "full" ||
      (element.styles as Record<string, unknown>).containerWidth === "full"
    );
  }
  // text is always w-full internally; toggle/icon/select size themselves
  return false;
};

export const isContainerElement = (
  element: ComponentElement,
): element is ContainerComponentElement =>
  element.elementTypeId === "element-container";

const updateElementTree = (
  elements: ComponentElement[],
  instanceId: string,
  transform: (element: ComponentElement) => ComponentElement,
): ComponentElement[] =>
  elements.map((element) => {
    if (element.instanceId === instanceId) {
      return transform(element);
    }

    if (isContainerElement(element)) {
      return {
        ...element,
        elements: updateElementTree(element.elements, instanceId, transform),
      };
    }

    return element;
  });

const removeElementFromTree = (
  elements: ComponentElement[],
  instanceId: string,
): ComponentElement[] =>
  elements
    .filter((element) => element.instanceId !== instanceId)
    .map((element) =>
      isContainerElement(element)
        ? {
            ...element,
            elements: removeElementFromTree(element.elements, instanceId),
          }
        : element,
    );

const addChildElementToTree = (
  elements: ComponentElement[],
  parentId: string,
  child: ComponentElement,
): ComponentElement[] =>
  elements.map((element) => {
    if (element.instanceId === parentId && isContainerElement(element)) {
      return {
        ...element,
        elements: [...element.elements, child],
      };
    }

    if (isContainerElement(element)) {
      return {
        ...element,
        elements: addChildElementToTree(element.elements, parentId, child),
      };
    }

    return element;
  });

const reorderElementInTree = (
  elements: ComponentElement[],
  instanceId: string,
  direction: "up" | "down",
): ComponentElement[] => {
  const localIndex = elements.findIndex(
    (element) => element.instanceId === instanceId,
  );
  if (localIndex !== -1) {
    const targetIndex = direction === "up" ? localIndex - 1 : localIndex + 1;
    if (targetIndex < 0 || targetIndex >= elements.length) {
      return elements;
    }

    const next = [...elements];
    [next[localIndex], next[targetIndex]] = [
      next[targetIndex],
      next[localIndex],
    ];
    return next;
  }

  return elements.map((element) =>
    isContainerElement(element)
      ? {
          ...element,
          elements: reorderElementInTree(
            element.elements,
            instanceId,
            direction,
          ),
        }
      : element,
  );
};

const elementTreeHasInstanceId = (
  elements: ComponentElement[],
  instanceId: string,
): boolean =>
  elements.some(
    (element) =>
      element.instanceId === instanceId ||
      (isContainerElement(element) &&
        elementTreeHasInstanceId(element.elements, instanceId)),
  );

const getElementByInstanceId = (
  elements: ComponentElement[],
  instanceId: string,
): ComponentElement | null => {
  for (const element of elements) {
    if (element.instanceId === instanceId) return element;
    if (isContainerElement(element)) {
      const nested = getElementByInstanceId(element.elements, instanceId);
      if (nested) return nested;
    }
  }

  return null;
};

const DEFAULT_CONFIG: AppConfig = (() => {
  const raw = (prebuiltSourceConfig as Record<string, unknown>).navigation;
  const nav =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    id: crypto.randomUUID(),
    appName: "",
    components: [],
    colorTheme: DEFAULT_COLOR_THEME,
    navigation: {
      shown: typeof nav.shown === "boolean" ? nav.shown : true,
      navigationLabel:
        typeof nav.navigationLabel === "string" ? nav.navigationLabel : "",
      showNavigationHeader:
        typeof nav.showNavigationHeader === "boolean"
          ? nav.showNavigationHeader
          : true,
      headerMenuIconName:
        typeof nav.headerMenuIconName === "string"
          ? nav.headerMenuIconName
          : "",
      headerBackIconName:
        typeof nav.headerBackIconName === "string"
          ? nav.headerBackIconName
          : "",
      navigationStyle: DEFAULT_NAVIGATION_STYLE,
      navigationPages: [],
    },
    pages: [],
  };
})();

const normalizeConfig = (input: unknown): AppConfig => {
  if (!input || typeof input !== "object") return DEFAULT_CONFIG;

  const maybeConfig = input as {
    id?: string;
    appName?: unknown;
    pages?: unknown;
    navigation?: {
      shown?: unknown;
      navigationLabel: navDraftLabel;
      showNavigationHeader: navDraftShowHeader;
      headerMenuIconName: navDraftHeaderMenuIconName;
      headerBackIconName: navDraftHeaderBackIconName;
      navigationHeader?: unknown;
      navigationStyle?: unknown;
      navigationPages?: unknown;
      pages?: unknown;
      items?: unknown;
    };
    components?: unknown;
    colorTheme?: unknown;
  };

  const componentsRaw = maybeConfig.components;
  const legacyComponentsObject =
    componentsRaw &&
    typeof componentsRaw === "object" &&
    !Array.isArray(componentsRaw)
      ? (componentsRaw as {
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
        })
      : undefined;

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

  const navPagesRaw =
    navRoot?.navigationPages ?? navRoot?.pages ?? navRoot?.items;

  const navPages: NavPage[] = Array.isArray(navPagesRaw)
    ? navPagesRaw.map((entry) => {
        const page = entry as Partial<NavPage> & {
          icon?: unknown;
        };

        let normalizedIcon: NavPage["icon"] = { name: "" };
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
                : "",
          };
        }

        return {
          id: page.id || crypto.randomUUID(),
          title: typeof page.title === "string" ? page.title : "",
          link: typeof page.link === "string" ? page.link : "#",
          pageId:
            typeof page.pageId === "string" && page.pageId.trim().length > 0
              ? page.pageId
              : "",
          icon: normalizedIcon,
        };
      })
    : [];

  const parseCustomPage = (value: unknown): CustomPage | undefined => {
    if (!value || typeof value !== "object") return undefined;

    const page = value as {
      id?: unknown;
      kind?: unknown;
      title?: unknown;
      url?: unknown;
      link?: unknown;
      route?: unknown;
      path?: unknown;
      showNavigationHeader?: unknown;
      navigationHeaderComponentId?: unknown;
      headerComponentId?: unknown;
      parentPageId?: unknown;
      parentId?: unknown;
      componentIds?: unknown;
      styles?: unknown;
    };

    if (page.kind !== "custom") return undefined;

    const defaultStyles = getDefaultPageStyles();
    const rawStyles =
      page.styles && typeof page.styles === "object"
        ? (page.styles as Record<string, unknown>)
        : {};
    const toNumberOr = (input: unknown, fallback: number): number => {
      if (typeof input !== "number" || !Number.isFinite(input)) {
        return fallback;
      }

      return input;
    };

    const pageId =
      typeof page.id === "string" && page.id.trim().length > 0
        ? page.id
        : crypto.randomUUID();
    const pageTitle =
      typeof page.title === "string" && page.title.trim().length > 0
        ? page.title
        : "";
    const resolvedUrl =
      typeof page.url === "string"
        ? page.url
        : typeof page.link === "string"
          ? page.link
          : typeof page.route === "string"
            ? page.route
            : typeof page.path === "string"
              ? page.path
              : "";
    const normalizedParentPageId =
      typeof page.parentPageId === "string" &&
      page.parentPageId.trim().length > 0
        ? page.parentPageId.trim()
        : typeof page.parentId === "string" && page.parentId.trim().length > 0
          ? page.parentId.trim()
          : null;
    const normalizedNavigationHeaderComponentId =
      typeof page.navigationHeaderComponentId === "string" &&
      page.navigationHeaderComponentId.trim().length > 0
        ? page.navigationHeaderComponentId.trim()
        : typeof page.headerComponentId === "string" &&
            page.headerComponentId.trim().length > 0
          ? page.headerComponentId.trim()
          : null;

    return {
      id: pageId,
      kind: "custom",
      title: pageTitle,
      url:
        normalizePageUrl(resolvedUrl) || getDefaultPageUrl(pageTitle, pageId),
      showNavigationHeader:
        typeof page.showNavigationHeader === "boolean"
          ? page.showNavigationHeader
          : true,
      navigationHeaderComponentId: normalizedNavigationHeaderComponentId,
      parentPageId: normalizedParentPageId,
      componentIds: Array.isArray(page.componentIds)
        ? page.componentIds.filter(
            (id): id is string =>
              typeof id === "string" && id.trim().length > 0,
          )
        : [],
      styles: {
        direction:
          rawStyles.direction === "vertical" ||
          rawStyles.direction === "horizontal"
            ? rawStyles.direction
            : defaultStyles.direction,
        justifyContent: normalizeFlexJustifyContent(
          rawStyles.justifyContent,
          defaultStyles.justifyContent,
        ),
        alignItems: normalizeFlexAlignItems(
          rawStyles.alignItems,
          defaultStyles.alignItems,
        ),
        overflowScroll:
          typeof rawStyles.overflowScroll === "boolean"
            ? rawStyles.overflowScroll
            : defaultStyles.overflowScroll,
        overflowXScroll:
          typeof rawStyles.overflowXScroll === "boolean"
            ? rawStyles.overflowXScroll
            : defaultStyles.overflowXScroll,
        overflowYScroll:
          typeof rawStyles.overflowYScroll === "boolean"
            ? rawStyles.overflowYScroll
            : defaultStyles.overflowYScroll,
        gap: toNumberOr(rawStyles.gap, defaultStyles.gap),
        minWidth: toNumberOr(rawStyles.minWidth, defaultStyles.minWidth),
        maxWidth: toNumberOr(rawStyles.maxWidth, defaultStyles.maxWidth),
        minHeight: toNumberOr(rawStyles.minHeight, defaultStyles.minHeight),
        maxHeight: toNumberOr(rawStyles.maxHeight, defaultStyles.maxHeight),
        paddingX: toNumberOr(rawStyles.paddingX, defaultStyles.paddingX),
        paddingY: toNumberOr(rawStyles.paddingY, defaultStyles.paddingY),
        marginX: toNumberOr(rawStyles.marginX, defaultStyles.marginX),
        marginY: toNumberOr(rawStyles.marginY, defaultStyles.marginY),
        paddingTop: toNumberOr(rawStyles.paddingTop, defaultStyles.paddingTop),
        paddingBottom: toNumberOr(
          rawStyles.paddingBottom,
          defaultStyles.paddingBottom,
        ),
        paddingLeft: toNumberOr(
          rawStyles.paddingLeft,
          defaultStyles.paddingLeft,
        ),
        paddingRight: toNumberOr(
          rawStyles.paddingRight,
          defaultStyles.paddingRight,
        ),
        marginTop: toNumberOr(rawStyles.marginTop, defaultStyles.marginTop),
        marginBottom: toNumberOr(
          rawStyles.marginBottom,
          defaultStyles.marginBottom,
        ),
        marginLeft: toNumberOr(rawStyles.marginLeft, defaultStyles.marginLeft),
        marginRight: toNumberOr(
          rawStyles.marginRight,
          defaultStyles.marginRight,
        ),
        backgroundColor:
          typeof rawStyles.backgroundColor === "string"
            ? rawStyles.backgroundColor
            : defaultStyles.backgroundColor,
        borderColor:
          typeof rawStyles.borderColor === "string"
            ? rawStyles.borderColor
            : defaultStyles.borderColor,
        borderRadius: toNumberOr(
          rawStyles.borderRadius,
          defaultStyles.borderRadius,
        ),
        borderWidth: toNumberOr(
          rawStyles.borderWidth,
          defaultStyles.borderWidth,
        ),
      },
    };
  };

  const rawPages = maybeConfig.pages;
  const arrayPages = Array.isArray(rawPages)
    ? rawPages.flatMap((entry) => {
        const custom = parseCustomPage(entry);
        return custom ? [custom] : [];
      })
    : [];

  const objectCustomPages =
    rawPages && typeof rawPages === "object" && !Array.isArray(rawPages)
      ? Object.entries((rawPages as { custom?: unknown }).custom || {}).map(
          ([id, value]) => {
            const item = value as {
              title?: unknown;
              url?: unknown;
              showNavigationHeader?: unknown;
              navigationHeaderComponentId?: unknown;
              headerComponentId?: unknown;
              parentPageId?: unknown;
              parentId?: unknown;
              componentIds?: unknown;
              styles?: unknown;
            };

            const parsed = parseCustomPage({
              id,
              kind: "custom",
              title:
                typeof item?.title === "string" && item.title.trim().length > 0
                  ? item.title
                  : id,
              url: item?.url,
              showNavigationHeader: item?.showNavigationHeader,
              navigationHeaderComponentId: item?.navigationHeaderComponentId,
              headerComponentId: item?.headerComponentId,
              parentPageId: item?.parentPageId,
              parentId: item?.parentId,
              componentIds: item?.componentIds,
              styles: item?.styles,
            });

            return (
              parsed ?? {
                id,
                kind: "custom" as const,
                title: id,
                url: getDefaultPageUrl(id, id),
                showNavigationHeader: true,
                navigationHeaderComponentId: null,
                parentPageId: null,
                componentIds: [],
                styles: getDefaultComponentStyles(),
              }
            );
          },
        )
      : [];

  const normalizedPages: AppPage[] = [...arrayPages, ...objectCustomPages];

  const normalizeCustomComponents = (raw: unknown): AppComponent[] => {
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const comp = entry as Record<string, unknown>;
      if (typeof comp.label !== "string" || !comp.label.trim()) return [];
      // Reject SettingComponentDefinition entries (legacy stored data)
      if (comp.kind === "prebuilt" || typeof comp.type === "string") return [];
      const rawStyles =
        comp.styles && typeof comp.styles === "object"
          ? (comp.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultComponentStyles();
      const paddingXValues = normalizeAxisValue(
        rawStyles.paddingX,
        rawStyles.paddingLeft,
        rawStyles.paddingRight,
      );
      const paddingYValues = normalizeAxisValue(
        rawStyles.paddingY,
        rawStyles.paddingTop,
        rawStyles.paddingBottom,
      );
      const marginXValues = normalizeAxisValue(
        rawStyles.marginX,
        rawStyles.marginLeft,
        rawStyles.marginRight,
      );
      const marginYValues = normalizeAxisValue(
        rawStyles.marginY,
        rawStyles.marginTop,
        rawStyles.marginBottom,
      );
      return [
        {
          id:
            typeof comp.id === "string" && comp.id.trim()
              ? comp.id
              : crypto.randomUUID(),
          label: comp.label,
          api: getSafeApiComponentConfig((comp as { api?: unknown }).api),
          elements: Array.isArray(comp.elements)
            ? (comp.elements as unknown[])
                .map((el) => normalizeElementFromRaw(el))
                .filter((el): el is ComponentElement => Boolean(el))
            : [],
          styles: {
            direction:
              rawStyles.direction === "vertical" ||
              rawStyles.direction === "horizontal"
                ? rawStyles.direction
                : defaultStyles.direction,
            justifyContent: normalizeFlexJustifyContent(
              rawStyles.justifyContent ??
                (rawStyles.horizontalAlignment === "end-to-end"
                  ? "space-between"
                  : rawStyles.horizontalAlignment === "evenly-spaced"
                    ? "space-evenly"
                    : rawStyles.horizontalAlignment),
              defaultStyles.justifyContent,
            ),
            alignItems: normalizeFlexAlignItems(
              rawStyles.alignItems ??
                (rawStyles.verticalAlignment === "beginning"
                  ? "start"
                  : rawStyles.verticalAlignment),
              defaultStyles.alignItems,
            ),
            overflowScroll:
              typeof rawStyles.overflowScroll === "boolean"
                ? rawStyles.overflowScroll
                : defaultStyles.overflowScroll,
            gap: clampFlexGap(rawStyles.gap ?? defaultStyles.gap),
            minWidth: clampContainerDimension(
              rawStyles.minWidth ?? defaultStyles.minWidth,
            ),
            maxWidth: clampContainerDimension(
              rawStyles.maxWidth ?? defaultStyles.maxWidth,
            ),
            minHeight: clampContainerDimension(
              rawStyles.minHeight ?? defaultStyles.minHeight,
            ),
            maxHeight: clampContainerDimension(
              rawStyles.maxHeight ?? defaultStyles.maxHeight,
            ),
            paddingX: paddingXValues.axis,
            paddingY: paddingYValues.axis,
            marginX: marginXValues.axis,
            marginY: marginYValues.axis,
            paddingTop: paddingYValues.start,
            paddingBottom: paddingYValues.end,
            paddingLeft: paddingXValues.start,
            paddingRight: paddingXValues.end,
            marginTop: marginYValues.start,
            marginBottom: marginYValues.end,
            marginLeft: marginXValues.start,
            marginRight: marginXValues.end,
            backgroundColor: normalizeThemeAwareColor(
              rawStyles.backgroundColor,
              defaultStyles.backgroundColor,
            ),
            borderColor: normalizeThemeAwareColor(
              rawStyles.borderColor,
              defaultStyles.borderColor,
            ),
            borderRadius: clampContainerBorderRadius(
              rawStyles.borderRadius ?? defaultStyles.borderRadius,
            ),
            borderWidth: clampContainerBorderWidth(
              rawStyles.borderWidth ?? defaultStyles.borderWidth,
            ),
          },
        },
      ];
    });
  };

  return {
    id: maybeConfig.id || crypto.randomUUID(),
    appName: typeof maybeConfig.appName === "string" ? maybeConfig.appName : "",
    components: normalizeCustomComponents(maybeConfig.components),
    colorTheme: normalizeColorTheme(maybeConfig.colorTheme),
    navigation: {
      shown: typeof navRoot?.shown === "boolean" ? navRoot.shown : true,
      navigationLabel:
        typeof (navRoot as { navigationLabel?: unknown })?.navigationLabel ===
        "string"
          ? String((navRoot as { navigationLabel?: unknown }).navigationLabel)
          : typeof navRoot?.navigationHeader === "string"
            ? navRoot.navigationHeader
            : "",
      showNavigationHeader:
        typeof (navRoot as { showNavigationHeader?: unknown })
          ?.showNavigationHeader === "boolean"
          ? Boolean(
              (navRoot as { showNavigationHeader?: unknown })
                .showNavigationHeader,
            )
          : true,
      headerMenuIconName:
        typeof (navRoot as { headerMenuIconName?: unknown })
          ?.headerMenuIconName === "string" &&
        String(
          (navRoot as { headerMenuIconName?: unknown }).headerMenuIconName,
        ).trim().length > 0
          ? String(
              (navRoot as { headerMenuIconName?: unknown }).headerMenuIconName,
            )
          : "",
      headerBackIconName:
        typeof (navRoot as { headerBackIconName?: unknown })
          ?.headerBackIconName === "string" &&
        String(
          (navRoot as { headerBackIconName?: unknown }).headerBackIconName,
        ).trim().length > 0
          ? String(
              (navRoot as { headerBackIconName?: unknown }).headerBackIconName,
            )
          : "",
      navigationStyle: normalizedNavStyle,
      navigationPages: navPages,
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

  const [appNameDraft, setAppNameDraft] = useState<string>(
    () => config.appName,
  );
  const [drawerState, setDrawerState] = useState<DrawerState>("closed");
  const [newLinkPageId, setNewLinkPageId] = useState("");
  const [newLinkIconName, setNewLinkIconName] = useState("");
  const [newSettingLabel, setNewSettingLabel] = useState("");
  const [newSettingType, setNewSettingType] = useState<
    "toggle" | "input" | "select"
  >("toggle");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [componentCodeDialogOpen, setComponentCodeDialogOpen] = useState(false);
  const [componentJsonDialogOpen, setComponentJsonDialogOpen] = useState(false);
  const [colorPickerDialogOpen, setColorPickerDialogOpen] = useState(false);
  const [colorEditTarget, setColorEditTarget] =
    useState<ColorEditTarget | null>(null);
  const [colorDraftHex, setColorDraftHex] = useState("#000000");
  const [colorDraftRed, setColorDraftRed] = useState(0);
  const [colorDraftGreen, setColorDraftGreen] = useState(0);
  const [colorDraftBlue, setColorDraftBlue] = useState(0);
  const [colorDraftAlpha, setColorDraftAlpha] = useState(255);
  const [activeTab, setActiveTab] = useState<ActiveTab>("navigation");
  const colorTheme = config.colorTheme;
  const setColorTheme = (
    themeOrUpdater: ColorTheme | ((current: ColorTheme) => ColorTheme),
  ) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      const next =
        typeof themeOrUpdater === "function"
          ? themeOrUpdater(base.colorTheme)
          : themeOrUpdater;
      return { ...base, colorTheme: next };
    });
  };
  const [themePreviewMode, setThemePreviewMode] =
    useState<ThemePreviewMode>("light");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [navigationPreviewPageId, setNavigationPreviewPageId] = useState("");
  const [navigationPreviewHistory, setNavigationPreviewHistory] = useState<
    string[]
  >([]);
  const [showAddCustomPage, setShowAddCustomPage] = useState(false);
  const [newCustomPageTitle, setNewCustomPageTitle] = useState("");
  const [newCustomPageUrl, setNewCustomPageUrl] = useState("");
  const [newCustomPageParentId, setNewCustomPageParentId] = useState("");
  const [selectedPageTitleDraft, setSelectedPageTitleDraft] =
    useState<string>("");
  const [pageMaxWidthInput, setPageMaxWidthInput] = useState<string>("none");
  const [newPageComponentId, setNewPageComponentId] = useState<string>("");
  const [previewToggleValues, setPreviewToggleValues] = useState<
    Record<string, boolean>
  >({});
  const [previewInputValues, setPreviewInputValues] = useState<
    Record<string, string>
  >({});
  const [navDraftPages, setNavDraftPages] = useState<NavPage[]>(
    () => config.navigation.navigationPages,
  );
  const [navDraftLabel, setNavDraftLabel] = useState<string>(
    () => config.navigation.navigationLabel,
  );
  const [navDraftShowHeader, setNavDraftShowHeader] = useState<boolean>(
    () => config.navigation.showNavigationHeader,
  );
  const [navDraftHeaderMenuIconName, setNavDraftHeaderMenuIconName] =
    useState<string>(() => config.navigation.headerMenuIconName);
  const [navDraftHeaderBackIconName, setNavDraftHeaderBackIconName] =
    useState<string>(() => config.navigation.headerBackIconName);
  const [navDraftStyle, setNavDraftStyle] = useState<NavigationStyle>(
    () => config.navigation.navigationStyle,
  );
  const [showAddNavigationPage, setShowAddNavigationPage] =
    useState<boolean>(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [showAddCustomComponent, setShowAddCustomComponent] = useState(false);
  const [newCustomComponentLabel, setNewCustomComponentLabel] = useState("");
  const [newCustomComponentMode, setNewCustomComponentMode] =
    useState<NewCustomComponentMode>("blank-component");
  const [newProjectTemplateComponentId, setNewProjectTemplateComponentId] =
    useState<string>("");
  const [newLibraryTemplateComponentId, setNewLibraryTemplateComponentId] =
    useState<string>("");
  const [selectedComponentLabelDraft, setSelectedComponentLabelDraft] =
    useState<string>("");
  const [componentEditUnlocked, setComponentEditUnlocked] = useState(false);
  const [showImportPrebuilt, setShowImportPrebuilt] = useState(false);
  const [newComponentElementTypeId, setNewComponentElementTypeId] =
    useState<ElementTypeId>("element-text");
  const [containerElementTypeDrafts, setContainerElementTypeDrafts] = useState<
    Record<string, ElementTypeId>
  >({});
  const [activeNestedElementEditorIds, setActiveNestedElementEditorIds] =
    useState<Record<string, string>>({});
  const [activeElementEditorId, setActiveElementEditorId] =
    useState<string>("");
  const [componentMaxWidthInput, setComponentMaxWidthInput] =
    useState<string>("none");
  const [componentMaxHeightInput, setComponentMaxHeightInput] =
    useState<string>("none");
  const [apiRequestUrlDraft, setApiRequestUrlDraft] = useState("");
  const [apiRequestBodyDraft, setApiRequestBodyDraft] = useState("");
  const [apiResponseJsonDraft, setApiResponseJsonDraft] = useState("");
  const apiResponseJsonInputRef = useRef<HTMLTextAreaElement | null>(null);
  const apiResponseJsonDraftTimeoutRef = useRef<number | null>(null);
  const apiResponsePersistTimeoutRef = useRef<number | null>(null);
  const hasInitializedConfigAutosave = useRef(false);
  const latestConfigRef = useRef(config);

  const getAutosaveErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return "Unknown local storage error";
  };

  const persistConfigToLocalStorage = (value: AppConfig) => {
    localStorage.setItem("app-config", JSON.stringify(value));
  };

  useEffect(() => {
    latestConfigRef.current = config;
  }, [config]);

  useEffect(() => {
    const flushPendingAutosave = () => {
      try {
        persistConfigToLocalStorage(latestConfigRef.current);
      } catch {
        // Ignore unload-time persistence errors.
      }
    };

    window.addEventListener("pagehide", flushPendingAutosave);
    window.addEventListener("beforeunload", flushPendingAutosave);

    return () => {
      window.removeEventListener("pagehide", flushPendingAutosave);
      window.removeEventListener("beforeunload", flushPendingAutosave);
    };
  }, []);

  useEffect(() => {
    if (!hasInitializedConfigAutosave.current) {
      hasInitializedConfigAutosave.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        persistConfigToLocalStorage(config);
        toast.success("Changes saved");
      } catch (error) {
        toast.error(`Changes weren't saved: ${getAutosaveErrorMessage(error)}`);
      }
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [config]);

  const resolveColor = (color: string): string =>
    resolveThemeColor(color, colorTheme, themePreviewMode);

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
    setNavDraftLabel(config.navigation.navigationLabel);
  }, [config.navigation.navigationLabel]);

  useEffect(() => {
    setNavDraftShowHeader(config.navigation.showNavigationHeader);
  }, [config.navigation.showNavigationHeader]);

  useEffect(() => {
    setNavDraftHeaderMenuIconName(config.navigation.headerMenuIconName);
  }, [config.navigation.headerMenuIconName]);

  useEffect(() => {
    setNavDraftHeaderBackIconName(config.navigation.headerBackIconName);
  }, [config.navigation.headerBackIconName]);

  useEffect(() => {
    setNavDraftStyle(config.navigation.navigationStyle);
  }, [config.navigation.navigationStyle]);

  const safeConfig = config || DEFAULT_CONFIG;
  const safePages = Array.isArray(safeConfig.pages) ? safeConfig.pages : [];
  const pageTitleOptions = safePages
    .filter((page): page is CustomPage => page.kind === "custom")
    .map((page) => ({
      id: page.id,
      title: page.title,
      url: page.url,
      parentPageId: page.parentPageId,
      kind: page.kind,
    }));
  const customComponents = Array.isArray(safeConfig.components)
    ? safeConfig.components
    : [];
  const prebuiltLibraryComponents = useMemo(
    () =>
      Array.isArray(APP_CONFIG.prebuilt?.components)
        ? (APP_CONFIG.prebuilt?.components as unknown[])
            .map((component) => normalizeComponentFromRaw(component))
            .filter(
              (component): component is AppComponent => component !== null,
            )
        : [],
    [],
  );
  const projectComponentTemplateOptions = customComponents.map((component) => ({
    id: component.id,
    label: component.label,
  }));
  const editablePages = safePages.filter(
    (page): page is CustomPage => page.kind === "custom",
  );
  const selectedEditablePage =
    editablePages.find((page) => page.id === selectedPageId) ??
    editablePages[0] ??
    null;
  const pageParentOptions = editablePages.map((page) => ({
    id: page.id,
    title: page.title,
  }));
  const selectedPageParentOptions = selectedEditablePage
    ? pageParentOptions.filter((page) => page.id !== selectedEditablePage.id)
    : pageParentOptions;
  const selectedPageParentExists = Boolean(
    !selectedEditablePage?.parentPageId ||
    editablePages.some((page) => page.id === selectedEditablePage.parentPageId),
  );
  const selectedPageParentValue = !selectedEditablePage?.parentPageId
    ? "__root__"
    : selectedPageParentExists
      ? selectedEditablePage.parentPageId
      : "__missing_parent__";
  const selectedPageHeaderComponentValue =
    selectedEditablePage?.navigationHeaderComponentId ?? "__none__";
  const selectedPageShownInNavigation = Boolean(
    selectedEditablePage &&
    navDraftPages.some((page) => page.pageId === selectedEditablePage.id),
  );
  const selectedLinkPageOption = pageTitleOptions.find(
    (option) => option.id === newLinkPageId,
  );
  const selectedLinkPageIsNonRoot = Boolean(
    selectedLinkPageOption?.parentPageId,
  );
  const navigationPreviewPage =
    editablePages.find((page) => page.id === navigationPreviewPageId) ??
    selectedEditablePage;
  const navigationPreviewParentPage = navigationPreviewPage?.parentPageId
    ? (editablePages.find(
        (page) => page.id === navigationPreviewPage.parentPageId,
      ) ?? null)
    : null;
  const navigationPreviewHasParent = Boolean(navigationPreviewParentPage);
  const navigationPreviewShowsHeader = Boolean(
    navigationPreviewPage?.showNavigationHeader,
  );
  const navigationPreviewHeaderComponent =
    navigationPreviewPage?.navigationHeaderComponentId
      ? (customComponents.find(
          (component) =>
            component.id === navigationPreviewPage.navigationHeaderComponentId,
        ) ?? null)
      : null;
  const navigationPreviewHeaderHeight =
    safeConfig.navigation.shown && navigationPreviewShowsHeader ? 56 : 0;
  const selectedPageComponents =
    selectedEditablePage?.componentIds
      .map((componentId) =>
        customComponents.find((component) => component.id === componentId),
      )
      .filter((component): component is AppComponent => Boolean(component)) ??
    [];
  const libraryComponentTemplateOptions = prebuiltLibraryComponents.map(
    (component) => ({
      id: component.id,
      label: component.label,
    }),
  );
  const selectedComponent =
    customComponents.find(
      (component) => component.id === selectedComponentId,
    ) ??
    customComponents[0] ??
    null;
  const selectedComponentApi = getSafeApiComponentConfig(
    selectedComponent?.api,
  );
  const componentApiResponseDataById = useMemo(() => {
    const byId: Record<string, unknown> = {};

    customComponents.forEach((component) => {
      const responseRaw = getSafeApiComponentConfig(component.api).response
        .rawTestData;
      if (responseRaw.trim().length === 0) {
        return;
      }

      try {
        byId[component.id] = JSON.parse(responseRaw);
      } catch {
        // Ignore invalid JSON and keep unresolved bindings in preview.
      }
    });

    return byId;
  }, [customComponents]);
  const pagesUsingSelectedComponent = selectedComponent
    ? editablePages.filter((page) =>
        page.componentIds.includes(selectedComponent.id),
      )
    : [];
  const isSelectedComponentUsedInPages = pagesUsingSelectedComponent.length > 0;
  const isComponentEditorReadOnly =
    !showAddCustomComponent &&
    Boolean(selectedComponent) &&
    isSelectedComponentUsedInPages &&
    !componentEditUnlocked;

  const flattenLeafEntries = (
    source: unknown,
    prefix = "",
  ): Array<{ path: string; value: unknown }> => {
    if (Array.isArray(source)) {
      if (source.length === 0 && prefix.length > 0) {
        return [{ path: prefix, value: source }];
      }

      return source.flatMap((item, index) =>
        flattenLeafEntries(
          item,
          prefix.length > 0 ? `${prefix}.${index}` : String(index),
        ),
      );
    }

    if (source && typeof source === "object") {
      const entries = Object.entries(source as Record<string, unknown>);
      if (entries.length === 0 && prefix.length > 0) {
        return [{ path: prefix, value: source }];
      }

      return entries.flatMap(([key, value]) =>
        flattenLeafEntries(value, prefix.length > 0 ? `${prefix}.${key}` : key),
      );
    }

    return prefix.length > 0 ? [{ path: prefix, value: source }] : [];
  };

  const inferTextElementBinding = (
    value: string,
    responseData: unknown,
  ): string | null => {
    const trimmed = value.trim();
    if (trimmed.length === 0 || !responseData) {
      return null;
    }

    const leafEntries = flattenLeafEntries(responseData);
    const formatLeafValue = (entryValue: unknown): string => {
      if (typeof entryValue === "string") return entryValue;
      if (typeof entryValue === "number" || typeof entryValue === "boolean") {
        return String(entryValue);
      }
      if (entryValue === null) return "null";
      return JSON.stringify(entryValue);
    };
    const exactMatches = leafEntries.filter(
      (entry) => formatLeafValue(entry.value) === trimmed,
    );

    if (exactMatches.length === 1) {
      return `data.${exactMatches[0].path}`;
    }

    const normalizedValue = trimmed.toLowerCase();
    const semanticMatches = leafEntries.filter((entry) => {
      const leafKey = entry.path.split(".").pop()?.toLowerCase() ?? "";
      return leafKey.length > 0 && normalizedValue.includes(leafKey);
    });

    if (semanticMatches.length === 1) {
      return `data.${semanticMatches[0].path}`;
    }

    return null;
  };

  const getTextElementBinding = (
    element: TextComponentElement,
    responseData?: unknown,
  ): string | null => {
    if (element.apiBinding?.trim().startsWith("data.")) {
      return element.apiBinding.trim();
    }

    const trimmed = element.value.trim();
    if (trimmed.startsWith("data.")) {
      return trimmed;
    }

    if (typeof responseData === "undefined") {
      return null;
    }

    return inferTextElementBinding(element.value, responseData);
  };

  const getExplicitTextElementBinding = (
    element: TextComponentElement,
  ): string | null => {
    if (element.apiBinding?.trim().startsWith("data.")) {
      return element.apiBinding.trim();
    }

    const trimmed = element.value.trim();
    return trimmed.startsWith("data.") ? trimmed : null;
  };

  const collectComponentDataBindings = (
    elements: ComponentElement[],
    responseData?: unknown,
    found = new Set<string>(),
  ): Set<string> => {
    for (const element of elements) {
      if (isContainerElement(element)) {
        collectComponentDataBindings(element.elements, responseData, found);
        continue;
      }

      const inspectValue = (value: string) => {
        const trimmed = value.trim();
        if (trimmed.startsWith("data.")) {
          found.add(trimmed);
        }
      };

      if (element.elementTypeId === "element-text") {
        const binding = getExplicitTextElementBinding(element);
        if (binding) {
          inspectValue(binding);
        }
      } else if (element.elementTypeId === "element-button") {
        inspectValue(element.label);
      } else if (element.elementTypeId === "element-text-input") {
        inspectValue(element.value);
        inspectValue(element.textHint);
      } else if (element.elementTypeId === "element-select") {
        element.values.forEach(inspectValue);
      } else if (element.elementTypeId === "element-icon") {
        inspectValue(element.value);
      } else if (element.elementTypeId === "element-image") {
        inspectValue(element.src);
      }
    }

    return found;
  };

  const deferredApiResponseJsonDraft = useDeferredValue(apiResponseJsonDraft);

  const selectedComponentApiResponseValidation = useMemo(() => {
    if (!selectedComponent) {
      return { isValid: true, parsed: null as unknown, error: "" };
    }

    const raw = deferredApiResponseJsonDraft;
    if (raw.trim().length === 0) {
      return { isValid: true, parsed: null as unknown, error: "" };
    }

    try {
      return {
        isValid: true,
        parsed: JSON.parse(raw),
        error: "",
      };
    } catch (error) {
      return {
        isValid: false,
        parsed: null as unknown,
        error:
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Invalid JSON",
      };
    }
  }, [selectedComponent?.id, deferredApiResponseJsonDraft]);

  const selectedComponentDataBindings = useMemo(
    () =>
      selectedComponent
        ? Array.from(
            collectComponentDataBindings(
              selectedComponent.elements,
              selectedComponentApiResponseValidation.isValid
                ? selectedComponentApiResponseValidation.parsed
                : undefined,
            ),
          ).sort((a, b) => a.localeCompare(b))
        : [],
    [
      selectedComponent?.elements,
      selectedComponentApiResponseValidation.isValid,
      selectedComponentApiResponseValidation.parsed,
    ],
  );

  const applyApiResponseToTextElements = (
    elements: ComponentElement[],
    responseData: unknown,
  ): {
    nextElements: ComponentElement[];
    changed: boolean;
  } => {
    let changed = false;

    const nextElements = elements.map((element) => {
      if (isContainerElement(element)) {
        const nested = applyApiResponseToTextElements(
          element.elements,
          responseData,
        );
        if (!nested.changed) {
          return element;
        }

        changed = true;
        return {
          ...element,
          elements: nested.nextElements,
        };
      }

      if (element.elementTypeId !== "element-text") {
        return element;
      }

      const binding = getTextElementBinding(element, responseData);
      if (!binding) {
        return element;
      }

      const resolvedBinding = resolveDataBindingPath(responseData, binding);
      const nextValue = resolvedBinding
        ? formatResolvedValue(resolvedBinding.value)
        : "";

      if (element.value === nextValue && element.apiBinding === binding) {
        return element;
      }

      changed = true;
      return {
        ...element,
        value: nextValue,
        apiBinding: binding,
      };
    });

    return {
      nextElements,
      changed,
    };
  };

  const applySelectedComponentApiResponse = (responseData: unknown) => {
    if (!selectedComponent) return;

    const applied = applyApiResponseToTextElements(
      selectedComponent.elements,
      responseData,
    );

    if (!applied.changed) {
      return;
    }

    updateCustomComponents((components) =>
      components.map((component) =>
        component.id !== selectedComponent.id
          ? component
          : {
              ...component,
              elements: applied.nextElements,
            },
      ),
    );
  };

  useEffect(() => {
    if (!selectedComponent || !selectedComponentApi.isApitComponent) {
      return;
    }

    if (
      !selectedComponentApiResponseValidation.isValid ||
      selectedComponentApiResponseValidation.parsed === null
    ) {
      return;
    }

    applySelectedComponentApiResponse(
      selectedComponentApiResponseValidation.parsed,
    );
  }, [
    selectedComponent?.id,
    selectedComponent?.elements,
    selectedComponentApi.isApitComponent,
    selectedComponentApiResponseValidation.isValid,
    selectedComponentApiResponseValidation.parsed,
  ]);

  useEffect(() => {
    setApiRequestUrlDraft(selectedComponentApi.request.url);
    setApiRequestBodyDraft(selectedComponentApi.request.body);
    setApiResponseJsonDraft(selectedComponentApi.response.rawTestData);

    // Keep the uncontrolled response textarea in sync with persisted data.
    if (
      apiResponseJsonInputRef.current &&
      apiResponseJsonInputRef.current.value !==
        selectedComponentApi.response.rawTestData
    ) {
      apiResponseJsonInputRef.current.value =
        selectedComponentApi.response.rawTestData;
    }
  }, [
    selectedComponent?.id,
    selectedComponentApi.request.url,
    selectedComponentApi.request.body,
    selectedComponentApi.response.rawTestData,
  ]);

  useEffect(() => {
    if (!selectedComponent) return;
    if (apiRequestUrlDraft === selectedComponentApi.request.url) return;

    const timeoutId = window.setTimeout(() => {
      updateSelectedComponentApiRequest({ url: apiRequestUrlDraft });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [
    apiRequestUrlDraft,
    selectedComponent?.id,
    selectedComponentApi.request.url,
  ]);

  useEffect(() => {
    if (!selectedComponent) return;
    if (apiRequestBodyDraft === selectedComponentApi.request.body) return;

    const timeoutId = window.setTimeout(() => {
      updateSelectedComponentApiRequest({ body: apiRequestBodyDraft });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [
    apiRequestBodyDraft,
    selectedComponent?.id,
    selectedComponentApi.request.body,
  ]);

  useEffect(() => {
    return () => {
      if (apiResponseJsonDraftTimeoutRef.current !== null) {
        window.clearTimeout(apiResponseJsonDraftTimeoutRef.current);
      }
      if (apiResponsePersistTimeoutRef.current !== null) {
        window.clearTimeout(apiResponsePersistTimeoutRef.current);
      }
    };
  }, []);

  const traceApiPersist = (
    event: string,
    details: Record<string, unknown> = {},
  ) => {
    if (!import.meta.env.DEV) return;
    console.debug("[api-persist]", {
      event,
      at: new Date().toISOString(),
      ...details,
    });
  };

  const scheduleApiResponseJsonDraftUpdate = (value: string) => {
    if (apiResponseJsonDraftTimeoutRef.current !== null) {
      window.clearTimeout(apiResponseJsonDraftTimeoutRef.current);
      traceApiPersist("draft-timeout-cancelled");
    }

    apiResponseJsonDraftTimeoutRef.current = window.setTimeout(() => {
      setApiResponseJsonDraft(value);
      traceApiPersist("draft-state-updated", { valueLength: value.length });
      apiResponseJsonDraftTimeoutRef.current = null;
    }, 180);

    if (apiResponsePersistTimeoutRef.current !== null) {
      window.clearTimeout(apiResponsePersistTimeoutRef.current);
      traceApiPersist("persist-timeout-cancelled");
    }

    if (selectedComponent) {
      const componentId = selectedComponent.id;
      traceApiPersist("persist-timeout-scheduled", {
        componentId,
        valueLength: value.length,
        delayMs: 900,
      });
      apiResponsePersistTimeoutRef.current = window.setTimeout(() => {
        traceApiPersist("persist-timeout-fired", {
          componentId,
          valueLength: value.length,
        });
        updateComponentApi(componentId, (api) => {
          if (api.response.rawTestData === value) {
            traceApiPersist("persist-noop", { componentId });
            return api;
          }

          traceApiPersist("persist-committed", {
            componentId,
            valueLength: value.length,
          });
          return {
            ...api,
            response: {
              ...api.response,
              rawTestData: value,
            },
          };
        });
        apiResponsePersistTimeoutRef.current = null;
      }, 900);
    } else {
      traceApiPersist("persist-skipped-no-selected-component", {
        valueLength: value.length,
      });
    }
  };

  const exportPrebuiltConfig: ExportPrebuiltConfig = {
    pages: PREBUILT_SOURCE_PAGES,
    elements: PREBUILT_ELEMENTS,
  };

  const getComponentTypeId = (type: SettingComponentType) =>
    DEFAULT_SETTING_COMPONENTS.find((component) => component.type === type)
      ?.id ?? "";

  useEffect(() => {
    if (pageTitleOptions.length === 0) {
      setNewLinkPageId("");
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
    if (customComponents.length === 0) {
      setSelectedComponentId(null);
      return;
    }

    const hasSelected = customComponents.some(
      (component) => component.id === selectedComponentId,
    );

    if (!hasSelected) {
      setSelectedComponentId(customComponents[0].id);
    }
  }, [customComponents, selectedComponentId]);

  useEffect(() => {
    if (editablePages.length === 0) {
      setSelectedPageId("");
      return;
    }

    const hasSelected = editablePages.some(
      (page) => page.id === selectedPageId,
    );

    if (!hasSelected) {
      setSelectedPageId(editablePages[0].id);
    }
  }, [editablePages, selectedPageId]);

  useEffect(() => {
    if (!selectedEditablePage) {
      setNavigationPreviewPageId("");
      setNavigationPreviewHistory([]);
      return;
    }

    setNavigationPreviewPageId(selectedEditablePage.id);
    setNavigationPreviewHistory([selectedEditablePage.id]);
  }, [selectedEditablePage?.id]);

  useEffect(() => {
    if (activeTab !== "pages") return;
    if (editablePages.length === 0) {
      setShowAddCustomPage(true);
    }
  }, [activeTab, editablePages.length]);

  useEffect(() => {
    setSelectedPageTitleDraft(selectedEditablePage?.title ?? "");
  }, [selectedEditablePage?.id, selectedEditablePage?.title]);

  useEffect(() => {
    if (!selectedEditablePage) {
      setPageMaxWidthInput("none");
      return;
    }

    setPageMaxWidthInput(
      selectedEditablePage.styles.maxWidth === 0
        ? "none"
        : String(selectedEditablePage.styles.maxWidth),
    );
  }, [selectedEditablePage?.id, selectedEditablePage?.styles.maxWidth]);

  useEffect(() => {
    if (customComponents.length === 0) {
      setNewPageComponentId("");
      return;
    }

    const hasSelected = customComponents.some(
      (component) => component.id === newPageComponentId,
    );

    if (!hasSelected) {
      setNewPageComponentId(customComponents[0].id);
    }
  }, [customComponents, newPageComponentId]);

  useEffect(() => {
    if (projectComponentTemplateOptions.length === 0) {
      setNewProjectTemplateComponentId("");
      return;
    }

    const hasSelected = projectComponentTemplateOptions.some(
      (component) => component.id === newProjectTemplateComponentId,
    );

    if (!hasSelected) {
      setNewProjectTemplateComponentId(projectComponentTemplateOptions[0].id);
    }
  }, [projectComponentTemplateOptions, newProjectTemplateComponentId]);

  useEffect(() => {
    if (libraryComponentTemplateOptions.length === 0) {
      setNewLibraryTemplateComponentId("");
      return;
    }

    const hasSelected = libraryComponentTemplateOptions.some(
      (component) => component.id === newLibraryTemplateComponentId,
    );

    if (!hasSelected) {
      setNewLibraryTemplateComponentId(libraryComponentTemplateOptions[0].id);
    }
  }, [libraryComponentTemplateOptions, newLibraryTemplateComponentId]);

  useEffect(() => {
    if (!selectedComponent) {
      setSelectedComponentLabelDraft("");
      setComponentMaxWidthInput("none");
      setComponentMaxHeightInput("none");
      setComponentEditUnlocked(false);
      return;
    }

    setSelectedComponentLabelDraft(selectedComponent.label);
    setComponentMaxWidthInput(
      selectedComponent.styles.maxWidth === 0
        ? "none"
        : String(selectedComponent.styles.maxWidth),
    );
    setComponentMaxHeightInput(
      selectedComponent.styles.maxHeight === 0
        ? "none"
        : String(selectedComponent.styles.maxHeight),
    );
    setComponentEditUnlocked(false);
  }, [
    selectedComponent?.id,
    selectedComponent?.styles.maxWidth,
    selectedComponent?.styles.maxHeight,
  ]);

  const updateCustomComponents = (
    transform: (components: AppComponent[]) => AppComponent[],
    options?: {
      persistImmediately?: boolean;
    },
  ) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      const existing = Array.isArray(base.components) ? base.components : [];
      const transformed = transform(existing);
      const next = {
        ...base,
        components: transformed,
      };

      latestConfigRef.current = next;

      if (options?.persistImmediately) {
        try {
          persistConfigToLocalStorage(next);
        } catch {
          // Keep state update even if immediate persistence fails.
        }
      }

      return next;
    });
  };

  const cloneComponentElementTree = (
    elements: ComponentElement[],
  ): ComponentElement[] =>
    elements.map((element) => {
      if (isContainerElement(element)) {
        return {
          ...element,
          instanceId: crypto.randomUUID(),
          elements: cloneComponentElementTree(element.elements),
        };
      }

      return {
        ...element,
        instanceId: crypto.randomUUID(),
      };
    });

  const cloneComponentTemplate = (
    template: AppComponent,
    label: string,
  ): AppComponent => {
    const templateApi = getSafeApiComponentConfig(template.api);

    return {
      ...template,
      id: crypto.randomUUID(),
      label,
      elements: cloneComponentElementTree(template.elements),
      styles: { ...template.styles },
      api: {
        ...templateApi,
        request: {
          ...templateApi.request,
          headers: templateApi.request.headers.map((header) => ({ ...header })),
        },
        response: {
          ...templateApi.response,
        },
      },
    };
  };

  const pendingNewComponentLabel = newCustomComponentLabel.trim();
  const normalizedPendingNewComponentLabel =
    pendingNewComponentLabel.toLowerCase();
  const isPendingNewComponentLabelBlank =
    normalizedPendingNewComponentLabel.length === 0;
  const isPendingNewComponentLabelAvailable =
    !isPendingNewComponentLabelBlank &&
    ![
      ...customComponents.map((component) => component.label),
      ...prebuiltLibraryComponents.map((component) => component.label),
    ].some(
      (label) =>
        label.trim().toLowerCase() === normalizedPendingNewComponentLabel,
    );

  const normalizedSelectedComponentLabelDraft = selectedComponentLabelDraft
    .trim()
    .toLowerCase();
  const isSelectedComponentLabelBlank =
    normalizedSelectedComponentLabelDraft.length === 0;
  const isSelectedComponentLabelAvailable =
    !isSelectedComponentLabelBlank &&
    ![
      ...customComponents
        .filter((component) => component.id !== selectedComponent?.id)
        .map((component) => component.label),
      ...prebuiltLibraryComponents.map((component) => component.label),
    ].some(
      (label) =>
        label.trim().toLowerCase() === normalizedSelectedComponentLabelDraft,
    );

  const addCustomComponent = () => {
    const resolvedLabel = newCustomComponentLabel.trim();

    if (!resolvedLabel) {
      toast.error("Please enter a component label");
      return;
    }

    if (!isPendingNewComponentLabelAvailable) {
      toast.error("That component label is not available");
      return;
    }

    const newComponent = (() => {
      if (newCustomComponentMode === "blank-component") {
        const label = resolvedLabel;
        return {
          ...createDefaultComponent(label),
          elements: [],
        };
      }

      if (newCustomComponentMode === "project-components") {
        const template = customComponents.find(
          (component) => component.id === newProjectTemplateComponentId,
        );

        if (!template) {
          toast.error("Select a project component to clone");
          return null;
        }

        const label = resolvedLabel;
        return cloneComponentTemplate(template, label);
      }

      const template = prebuiltLibraryComponents.find(
        (component) => component.id === newLibraryTemplateComponentId,
      );

      if (!template) {
        toast.error("Select a library component to clone");
        return null;
      }

      const label = resolvedLabel;
      return cloneComponentTemplate(template, label);
    })();

    if (!newComponent) return;

    updateCustomComponents((components) => [...components, newComponent]);
    setSelectedComponentId(newComponent.id);
    setShowAddCustomComponent(false);
    setNewCustomComponentLabel("");
    setNewCustomComponentMode("blank-component");
    toast.success("Component added");
  };

  const importPrebuiltComponent = (prebuilt: SettingComponentDefinition) => {
    const newComponent = createDefaultComponent(prebuilt.label);
    updateCustomComponents((components) => [...components, newComponent]);
    setSelectedComponentId(newComponent.id);
    setShowImportPrebuilt(false);
    toast.success(`${prebuilt.label} component imported`);
  };

  const addComponentElement = (
    componentId: string,
    typeId: ElementTypeId,
    parentInstanceId?: string,
  ) => {
    updateCustomComponents((components) =>
      components.map((comp) =>
        comp.id !== componentId
          ? comp
          : {
              ...comp,
              elements: (() => {
                const newElement = createDefaultComponentElement(typeId);

                if (
                  typeId === "element-container" &&
                  isContainerElement(newElement)
                ) {
                  const parentDirection: ComponentDirection | null =
                    parentInstanceId
                      ? (() => {
                          const parent = getElementByInstanceId(
                            comp.elements,
                            parentInstanceId,
                          );
                          return parent && isContainerElement(parent)
                            ? getDirectionFromContainer(parent)
                            : null;
                        })()
                      : comp.styles.direction;

                  const targetDirection = getOppositeDirection(
                    parentDirection ?? "horizontal",
                  );
                  newElement.styles = {
                    ...newElement.styles,
                    flexDirection:
                      getFlexDirectionFromComponentDirection(targetDirection),
                  };
                }

                return parentInstanceId
                  ? addChildElementToTree(
                      comp.elements,
                      parentInstanceId,
                      newElement,
                    )
                  : [...comp.elements, newElement];
              })(),
            },
      ),
    );
  };

  const removeComponentElement = (componentId: string, instanceId: string) => {
    updateCustomComponents((components) =>
      components.map((comp) =>
        comp.id !== componentId
          ? comp
          : {
              ...comp,
              elements: removeElementFromTree(comp.elements, instanceId),
            },
      ),
    );
    setActiveElementEditorId((current) =>
      current === instanceId ? "" : current,
    );
    toast.success("Element removed");
  };

  const updateComponentElementField = (
    componentId: string,
    instanceId: string,
    update: Record<string, unknown>,
  ) => {
    updateCustomComponents((components) =>
      components.map((comp) =>
        comp.id !== componentId
          ? comp
          : {
              ...comp,
              elements: updateElementTree(
                comp.elements,
                instanceId,
                (element) =>
                  normalizeElementFromRaw({ ...element, ...update }) ?? element,
              ),
            },
      ),
    );
  };

  const reorderComponentElement = (
    componentId: string,
    instanceId: string,
    direction: "up" | "down",
  ) => {
    updateCustomComponents((components) =>
      components.map((comp) => {
        if (comp.id !== componentId) return comp;
        return {
          ...comp,
          elements: reorderElementInTree(comp.elements, instanceId, direction),
        };
      }),
    );
  };

  const updateComponentStyles = (
    componentId: string,
    styles: Partial<ComponentStyles>,
  ) => {
    updateCustomComponents((components) =>
      components.map((comp) =>
        comp.id !== componentId
          ? comp
          : { ...comp, styles: { ...comp.styles, ...styles } },
      ),
    );
  };

  const updateComponentApi = (
    componentId: string,
    transform: (api: ApiComponentConfig) => ApiComponentConfig,
    options?: {
      persistImmediately?: boolean;
    },
  ) => {
    updateCustomComponents(
      (components) =>
        components.map((comp) =>
          comp.id !== componentId
            ? comp
            : { ...comp, api: transform(getSafeApiComponentConfig(comp.api)) },
        ),
      options,
    );
  };

  const updateSelectedComponentApiEnabled = (enabled: boolean) => {
    if (!selectedComponent) return;

    updateComponentApi(
      selectedComponent.id,
      (api) => ({
        ...api,
        isApitComponent: enabled,
      }),
      {
        persistImmediately: true,
      },
    );
  };

  const updateSelectedComponentApiRequest = (
    request: Partial<ApiComponentConfig["request"]>,
  ) => {
    if (!selectedComponent) return;

    updateComponentApi(selectedComponent.id, (api) => ({
      ...api,
      request: {
        ...api.request,
        ...request,
      },
    }));
  };

  const addSelectedComponentApiHeader = () => {
    if (!selectedComponent) return;

    updateComponentApi(selectedComponent.id, (api) => ({
      ...api,
      request: {
        ...api.request,
        headers: [
          ...api.request.headers,
          { id: crypto.randomUUID(), key: "", value: "" },
        ],
      },
    }));
  };

  const updateSelectedComponentApiHeader = (
    headerId: string,
    patch: Partial<Pick<ApiRequestHeader, "key" | "value">>,
  ) => {
    if (!selectedComponent) return;

    updateComponentApi(selectedComponent.id, (api) => ({
      ...api,
      request: {
        ...api.request,
        headers: api.request.headers.map((header) =>
          header.id === headerId ? { ...header, ...patch } : header,
        ),
      },
    }));
  };

  const removeSelectedComponentApiHeader = (headerId: string) => {
    if (!selectedComponent) return;

    updateComponentApi(selectedComponent.id, (api) => ({
      ...api,
      request: {
        ...api.request,
        headers: api.request.headers.filter((header) => header.id !== headerId),
      },
    }));
  };

  const updateSelectedComponentApiResponseJson = (value: string) => {
    if (!selectedComponent) return;

    updateComponentApi(selectedComponent.id, (api) => ({
      ...api,
      response: {
        ...api.response,
        rawTestData: value,
      },
    }));
  };

  const getValueAtPath = (source: unknown, path: string): unknown => {
    const segments = path
      .split(".")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    let cursor: unknown = source;
    for (const segment of segments) {
      if (Array.isArray(cursor)) {
        const numericIndex = Number(segment);
        if (!Number.isInteger(numericIndex) || numericIndex < 0) {
          return undefined;
        }
        cursor = cursor[numericIndex];
        continue;
      }

      if (!cursor || typeof cursor !== "object") {
        return undefined;
      }

      cursor = (cursor as Record<string, unknown>)[segment];
    }

    return cursor;
  };

  const flattenLeafPaths = (source: unknown, prefix = ""): string[] => {
    if (Array.isArray(source)) {
      if (source.length === 0 && prefix.length > 0) {
        return [prefix];
      }

      return source.flatMap((item, index) =>
        flattenLeafPaths(
          item,
          prefix.length > 0 ? `${prefix}.${index}` : String(index),
        ),
      );
    }

    if (source && typeof source === "object") {
      const entries = Object.entries(source as Record<string, unknown>);
      if (entries.length === 0 && prefix.length > 0) {
        return [prefix];
      }

      return entries.flatMap(([key, value]) =>
        flattenLeafPaths(value, prefix.length > 0 ? `${prefix}.${key}` : key),
      );
    }

    return prefix.length > 0 ? [prefix] : [];
  };

  const flattenAllPaths = (source: unknown, prefix = ""): string[] => {
    if (Array.isArray(source)) {
      const directPath = prefix.length > 0 ? [prefix] : [];
      if (source.length === 0) {
        return directPath;
      }

      return [
        ...directPath,
        ...source.flatMap((item, index) =>
          flattenAllPaths(
            item,
            prefix.length > 0 ? `${prefix}.${index}` : String(index),
          ),
        ),
      ];
    }

    if (source && typeof source === "object") {
      const directPath = prefix.length > 0 ? [prefix] : [];
      const entries = Object.entries(source as Record<string, unknown>);
      if (entries.length === 0) {
        return directPath;
      }

      return [
        ...directPath,
        ...entries.flatMap(([key, value]) =>
          flattenAllPaths(value, prefix.length > 0 ? `${prefix}.${key}` : key),
        ),
      ];
    }

    return prefix.length > 0 ? [prefix] : [];
  };

  const formatResolvedValue = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (value === null) return "null";
    return JSON.stringify(value);
  };

  const resolveDataBindingPath = (
    source: unknown,
    binding: string,
  ): { value: unknown; path: string } | null => {
    const trimmed = binding.trim();
    if (!trimmed.startsWith("data.")) {
      return null;
    }

    // Preferred lookup keeps the full `data.*` path semantics.
    const direct = getValueAtPath(source, trimmed);
    if (typeof direct !== "undefined") {
      return { value: direct, path: trimmed };
    }

    const legacyPath = trimmed.slice(5);
    const legacy = getValueAtPath(source, legacyPath);
    if (typeof legacy !== "undefined") {
      return { value: legacy, path: legacyPath };
    }

    return null;
  };

  const getApiBindingStatus = (
    responseData: unknown,
    bindings: string[],
  ): {
    missingList: string[];
    unusedPaths: string[];
  } => {
    const missingBindings = new Set<string>();
    const usedResponsePaths = new Set<string>();

    bindings.forEach((binding) => {
      const resolvedBinding = resolveDataBindingPath(responseData, binding);
      if (!resolvedBinding) {
        missingBindings.add(binding);
        return;
      }

      const segments = resolvedBinding.path
        .split(".")
        .filter((segment) => segment.trim().length > 0);
      for (let i = 1; i <= segments.length; i += 1) {
        usedResponsePaths.add(segments.slice(0, i).join("."));
      }
    });

    const flattenedResponsePaths = new Set(flattenAllPaths(responseData));

    return {
      missingList: Array.from(missingBindings).sort((a, b) =>
        a.localeCompare(b),
      ),
      unusedPaths: Array.from(flattenedResponsePaths)
        .filter((path) => !usedResponsePaths.has(path))
        .sort((a, b) => a.localeCompare(b)),
    };
  };

  const selectedComponentApiBindingStatus = useMemo(() => {
    if (
      !selectedComponent ||
      !selectedComponentApiResponseValidation.isValid ||
      selectedComponentApiResponseValidation.parsed === null
    ) {
      return {
        missingList: [] as string[],
        unusedPaths: [] as string[],
      };
    }

    return getApiBindingStatus(
      selectedComponentApiResponseValidation.parsed,
      selectedComponentDataBindings,
    );
  }, [
    selectedComponent?.id,
    selectedComponentApiResponseValidation.isValid,
    selectedComponentApiResponseValidation.parsed,
    selectedComponentDataBindings,
  ]);

  const getPreviewResponseDataForComponent = (componentId: string): unknown => {
    if (selectedComponent && componentId === selectedComponent.id) {
      if (
        selectedComponentApiResponseValidation.isValid &&
        selectedComponentApiResponseValidation.parsed !== null
      ) {
        return selectedComponentApiResponseValidation.parsed;
      }

      return undefined;
    }

    return componentApiResponseDataById[componentId];
  };

  const populateSelectedComponentFromApiResponse = () => {
    if (!selectedComponent) return;

    const responseRaw =
      apiResponseJsonInputRef.current?.value ?? apiResponseJsonDraft;
    setApiResponseJsonDraft(responseRaw);
    updateSelectedComponentApiResponseJson(responseRaw);
    if (responseRaw.trim().length === 0) {
      toast.success("Response is empty; preview data has been reset");
      return;
    }

    let responseData: unknown;
    try {
      responseData = JSON.parse(responseRaw);
    } catch (error) {
      toast.error(
        `Response JSON is invalid: ${error instanceof Error ? error.message : "Invalid JSON"}`,
      );
      return;
    }

    const { missingList } = getApiBindingStatus(
      responseData,
      selectedComponentDataBindings,
    );

    applySelectedComponentApiResponse(responseData);

    if (missingList.length > 0) {
      toast.error("Some data items were missing in the response");
      return;
    }

    toast.success("Data items populated from response");
  };

  const updateComponentLabel = (componentId: string, label: string) => {
    updateCustomComponents((components) =>
      components.map((comp) =>
        comp.id !== componentId ? comp : { ...comp, label },
      ),
    );
  };

  const handleSelectedComponentLabelChange = (
    componentId: string,
    label: string,
  ) => {
    setSelectedComponentLabelDraft(label);

    const normalizedLabel = label.trim().toLowerCase();
    if (!normalizedLabel) {
      return;
    }

    const isAvailable = ![
      ...customComponents
        .filter((component) => component.id !== componentId)
        .map((component) => component.label),
      ...prebuiltLibraryComponents.map((component) => component.label),
    ].some(
      (existingLabel) => existingLabel.trim().toLowerCase() === normalizedLabel,
    );

    if (!isAvailable) {
      return;
    }

    updateComponentLabel(componentId, label);
  };

  const enableSelectedComponentEditing = () => {
    if (!selectedComponent) return;

    if (!isSelectedComponentUsedInPages) {
      setComponentEditUnlocked(true);
      return;
    }

    const usedByPages = pagesUsingSelectedComponent
      .map((page) => page.title.trim())
      .filter((title) => title.length > 0)
      .join(", ");
    const confirmMessage =
      usedByPages.length > 0
        ? `This component is used on page(s): ${usedByPages}.\n\nEditing it will update those pages. Continue?`
        : "This component is used on one or more pages. Editing it will update those pages. Continue?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setComponentEditUnlocked(true);
  };

  const getAxisInputValue = (start: number, end: number): string =>
    start === end ? String(start) : "";

  const parseStyleNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  };

  const parseContainerDimensionOrNone = (value: string): number | null => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length === 0) return null;
    if (trimmed === "none") return 0;

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return null;
    return clampContainerDimension(parsed);
  };

  const updateComponentPaddingAxis = (
    componentId: string,
    axis: "x" | "y",
    value: string,
  ) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);

    if (axis === "x") {
      updateComponentStyles(componentId, {
        paddingX: next,
        paddingLeft: next,
        paddingRight: next,
      });
      return;
    }

    updateComponentStyles(componentId, {
      paddingY: next,
      paddingTop: next,
      paddingBottom: next,
    });
  };

  const updateComponentPaddingAll = (componentId: string, value: string) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);

    updateComponentStyles(componentId, {
      paddingX: next,
      paddingY: next,
      paddingTop: next,
      paddingBottom: next,
      paddingLeft: next,
      paddingRight: next,
    });
  };

  const updateComponentMarginAxis = (
    componentId: string,
    axis: "x" | "y",
    value: string,
  ) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);

    if (axis === "x") {
      updateComponentStyles(componentId, {
        marginX: next,
        marginLeft: next,
        marginRight: next,
      });
      return;
    }

    updateComponentStyles(componentId, {
      marginY: next,
      marginTop: next,
      marginBottom: next,
    });
  };

  const updateComponentMarginAll = (componentId: string, value: string) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);

    updateComponentStyles(componentId, {
      marginX: next,
      marginY: next,
      marginTop: next,
      marginBottom: next,
      marginLeft: next,
      marginRight: next,
    });
  };

  const updateComponentPaddingSide = (
    componentId: string,
    currentStyles: ComponentStyles,
    side: "top" | "bottom" | "left" | "right",
    value: string,
  ) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);
    const nextTop = side === "top" ? next : currentStyles.paddingTop;
    const nextBottom = side === "bottom" ? next : currentStyles.paddingBottom;
    const nextLeft = side === "left" ? next : currentStyles.paddingLeft;
    const nextRight = side === "right" ? next : currentStyles.paddingRight;

    updateComponentStyles(componentId, {
      paddingTop: nextTop,
      paddingBottom: nextBottom,
      paddingLeft: nextLeft,
      paddingRight: nextRight,
      paddingY: nextTop === nextBottom ? nextTop : currentStyles.paddingY,
      paddingX: nextLeft === nextRight ? nextLeft : currentStyles.paddingX,
    });
  };

  const updateComponentMarginSide = (
    componentId: string,
    currentStyles: ComponentStyles,
    side: "top" | "bottom" | "left" | "right",
    value: string,
  ) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);
    const nextTop = side === "top" ? next : currentStyles.marginTop;
    const nextBottom = side === "bottom" ? next : currentStyles.marginBottom;
    const nextLeft = side === "left" ? next : currentStyles.marginLeft;
    const nextRight = side === "right" ? next : currentStyles.marginRight;

    updateComponentStyles(componentId, {
      marginTop: nextTop,
      marginBottom: nextBottom,
      marginLeft: nextLeft,
      marginRight: nextRight,
      marginY: nextTop === nextBottom ? nextTop : currentStyles.marginY,
      marginX: nextLeft === nextRight ? nextLeft : currentStyles.marginX,
    });
  };

  const updateElementStyles = (
    componentId: string,
    instanceId: string,
    styles: EditableElementSpacingStyles,
  ) => {
    updateComponentElementField(componentId, instanceId, {
      styles,
    });
  };

  const updateElementPaddingAxis = (
    componentId: string,
    instanceId: string,
    currentStyles: EditableElementSpacingStyles,
    axis: "x" | "y",
    value: string,
  ) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);

    if (axis === "x") {
      updateElementStyles(componentId, instanceId, {
        ...currentStyles,
        paddingX: next,
        paddingLeft: next,
        paddingRight: next,
      });
      return;
    }

    updateElementStyles(componentId, instanceId, {
      ...currentStyles,
      paddingY: next,
      paddingTop: next,
      paddingBottom: next,
    });
  };

  const updateElementPaddingAll = (
    componentId: string,
    instanceId: string,
    currentStyles: EditableElementSpacingStyles,
    value: string,
  ) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);

    updateElementStyles(componentId, instanceId, {
      ...currentStyles,
      paddingX: next,
      paddingY: next,
      paddingTop: next,
      paddingBottom: next,
      paddingLeft: next,
      paddingRight: next,
    });
  };

  const updateElementMarginAxis = (
    componentId: string,
    instanceId: string,
    currentStyles: EditableElementSpacingStyles,
    axis: "x" | "y",
    value: string,
  ) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);

    if (axis === "x") {
      updateElementStyles(componentId, instanceId, {
        ...currentStyles,
        marginX: next,
        marginLeft: next,
        marginRight: next,
      });
      return;
    }

    updateElementStyles(componentId, instanceId, {
      ...currentStyles,
      marginY: next,
      marginTop: next,
      marginBottom: next,
    });
  };

  const updateElementMarginAll = (
    componentId: string,
    instanceId: string,
    currentStyles: EditableElementSpacingStyles,
    value: string,
  ) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);

    updateElementStyles(componentId, instanceId, {
      ...currentStyles,
      marginX: next,
      marginY: next,
      marginTop: next,
      marginBottom: next,
      marginLeft: next,
      marginRight: next,
    });
  };

  const updateElementPaddingSide = (
    componentId: string,
    instanceId: string,
    currentStyles: EditableElementSpacingStyles,
    side: "top" | "bottom" | "left" | "right",
    value: string,
  ) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);
    const nextTop = side === "top" ? next : currentStyles.paddingTop;
    const nextBottom = side === "bottom" ? next : currentStyles.paddingBottom;
    const nextLeft = side === "left" ? next : currentStyles.paddingLeft;
    const nextRight = side === "right" ? next : currentStyles.paddingRight;

    updateElementStyles(componentId, instanceId, {
      ...currentStyles,
      paddingTop: nextTop,
      paddingBottom: nextBottom,
      paddingLeft: nextLeft,
      paddingRight: nextRight,
      paddingY: nextTop === nextBottom ? nextTop : currentStyles.paddingY,
      paddingX: nextLeft === nextRight ? nextLeft : currentStyles.paddingX,
    });
  };

  const updateElementMarginSide = (
    componentId: string,
    instanceId: string,
    currentStyles: EditableElementSpacingStyles,
    side: "top" | "bottom" | "left" | "right",
    value: string,
  ) => {
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);
    const nextTop = side === "top" ? next : currentStyles.marginTop;
    const nextBottom = side === "bottom" ? next : currentStyles.marginBottom;
    const nextLeft = side === "left" ? next : currentStyles.marginLeft;
    const nextRight = side === "right" ? next : currentStyles.marginRight;

    updateElementStyles(componentId, instanceId, {
      ...currentStyles,
      marginTop: nextTop,
      marginBottom: nextBottom,
      marginLeft: nextLeft,
      marginRight: nextRight,
      marginY: nextTop === nextBottom ? nextTop : currentStyles.marginY,
      marginX: nextLeft === nextRight ? nextLeft : currentStyles.marginX,
    });
  };

  const renderElementSpacingSection = (
    componentId: string,
    instanceId: string,
    styles: EditableElementSpacingStyles,
  ) => (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          padding
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Padding (All Sides)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={
                styles.paddingTop === styles.paddingBottom &&
                styles.paddingTop === styles.paddingLeft &&
                styles.paddingTop === styles.paddingRight
                  ? styles.paddingTop
                  : ""
              }
              onChange={(e) =>
                updateElementPaddingAll(
                  componentId,
                  instanceId,
                  styles,
                  e.target.value,
                )
              }
              placeholder="Mixed"
            />
          </div>
          <div className="space-y-2">
            <Label>Horizontal Padding (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={getAxisInputValue(styles.paddingLeft, styles.paddingRight)}
              onChange={(e) =>
                updateElementPaddingAxis(
                  componentId,
                  instanceId,
                  styles,
                  "x",
                  e.target.value,
                )
              }
              placeholder="Mixed"
            />
          </div>
          <div className="space-y-2">
            <Label>Vertical Padding (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={getAxisInputValue(styles.paddingTop, styles.paddingBottom)}
              onChange={(e) =>
                updateElementPaddingAxis(
                  componentId,
                  instanceId,
                  styles,
                  "y",
                  e.target.value,
                )
              }
              placeholder="Mixed"
            />
          </div>
          <div className="space-y-2">
            <Label>Padding Top (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={styles.paddingTop}
              onChange={(e) =>
                updateElementPaddingSide(
                  componentId,
                  instanceId,
                  styles,
                  "top",
                  e.target.value,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Padding Bottom (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={styles.paddingBottom}
              onChange={(e) =>
                updateElementPaddingSide(
                  componentId,
                  instanceId,
                  styles,
                  "bottom",
                  e.target.value,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Padding Left (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={styles.paddingLeft}
              onChange={(e) =>
                updateElementPaddingSide(
                  componentId,
                  instanceId,
                  styles,
                  "left",
                  e.target.value,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Padding Right (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={styles.paddingRight}
              onChange={(e) =>
                updateElementPaddingSide(
                  componentId,
                  instanceId,
                  styles,
                  "right",
                  e.target.value,
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          margin
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Margin (All Sides)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={
                styles.marginTop === styles.marginBottom &&
                styles.marginTop === styles.marginLeft &&
                styles.marginTop === styles.marginRight
                  ? styles.marginTop
                  : ""
              }
              onChange={(e) =>
                updateElementMarginAll(
                  componentId,
                  instanceId,
                  styles,
                  e.target.value,
                )
              }
              placeholder="Mixed"
            />
          </div>
          <div className="space-y-2">
            <Label>Horizontal Margin (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={getAxisInputValue(styles.marginLeft, styles.marginRight)}
              onChange={(e) =>
                updateElementMarginAxis(
                  componentId,
                  instanceId,
                  styles,
                  "x",
                  e.target.value,
                )
              }
              placeholder="Mixed"
            />
          </div>
          <div className="space-y-2">
            <Label>Vertical Margin (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={getAxisInputValue(styles.marginTop, styles.marginBottom)}
              onChange={(e) =>
                updateElementMarginAxis(
                  componentId,
                  instanceId,
                  styles,
                  "y",
                  e.target.value,
                )
              }
              placeholder="Mixed"
            />
          </div>
          <div className="space-y-2">
            <Label>Margin Top (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={styles.marginTop}
              onChange={(e) =>
                updateElementMarginSide(
                  componentId,
                  instanceId,
                  styles,
                  "top",
                  e.target.value,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Margin Bottom (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={styles.marginBottom}
              onChange={(e) =>
                updateElementMarginSide(
                  componentId,
                  instanceId,
                  styles,
                  "bottom",
                  e.target.value,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Margin Left (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={styles.marginLeft}
              onChange={(e) =>
                updateElementMarginSide(
                  componentId,
                  instanceId,
                  styles,
                  "left",
                  e.target.value,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Margin Right (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={styles.marginRight}
              onChange={(e) =>
                updateElementMarginSide(
                  componentId,
                  instanceId,
                  styles,
                  "right",
                  e.target.value,
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  const openColorPicker = (target: ColorEditTarget, currentColor: string) => {
    const normalized = normalizeHexColor(currentColor, "#000000");
    const rgba = hexToRgba(normalized) ?? { r: 0, g: 0, b: 0, a: 255 };
    const includeAlpha = normalized.trim().length === 9 || rgba.a < 255;
    const hex = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a, includeAlpha);

    setColorEditTarget(target);
    setColorDraftHex(hex);
    setColorDraftRed(rgba.r);
    setColorDraftGreen(rgba.g);
    setColorDraftBlue(rgba.b);
    setColorDraftAlpha(rgba.a);
    setColorPickerDialogOpen(true);
  };

  const syncColorFromHex = (nextHex: string) => {
    setColorDraftHex(nextHex);
    const rgba = hexToRgba(nextHex);
    if (rgba) {
      setColorDraftRed(rgba.r);
      setColorDraftGreen(rgba.g);
      setColorDraftBlue(rgba.b);
      setColorDraftAlpha(rgba.a);
    }
  };

  const syncColorFromRgb = (channel: "r" | "g" | "b", value: string) => {
    const parsed = clampRgbChannel(value);
    const next = {
      r: channel === "r" ? parsed : colorDraftRed,
      g: channel === "g" ? parsed : colorDraftGreen,
      b: channel === "b" ? parsed : colorDraftBlue,
    };

    setColorDraftRed(next.r);
    setColorDraftGreen(next.g);
    setColorDraftBlue(next.b);
    setColorDraftHex(
      rgbaToHex(next.r, next.g, next.b, colorDraftAlpha, colorDraftAlpha < 255),
    );
  };

  const syncColorFromAlpha = (value: string) => {
    const parsed = clampRgbChannel(value);
    setColorDraftAlpha(parsed);
    setColorDraftHex(
      rgbaToHex(
        colorDraftRed,
        colorDraftGreen,
        colorDraftBlue,
        parsed,
        parsed < 255,
      ),
    );
  };

  const saveColorFromPicker = () => {
    if (!colorEditTarget) return;

    const fallbackHex = rgbaToHex(
      colorDraftRed,
      colorDraftGreen,
      colorDraftBlue,
      colorDraftAlpha,
      colorDraftAlpha < 255,
    );
    // If user selected a theme variable reference, store it as-is
    const isRef = isThemeRef(colorDraftHex);
    const normalized = isRef
      ? colorDraftHex
      : normalizeHexColor(colorDraftHex, fallbackHex);
    const parsed = isRef
      ? (hexToRgba(
          resolveThemeColor(colorDraftHex, colorTheme, themePreviewMode),
        ) ?? {
          r: colorDraftRed,
          g: colorDraftGreen,
          b: colorDraftBlue,
          a: colorDraftAlpha,
        })
      : (hexToRgba(normalized) ?? {
          r: colorDraftRed,
          g: colorDraftGreen,
          b: colorDraftBlue,
          a: colorDraftAlpha,
        });
    const useHex8 =
      !isRef && (normalized.trim().length === 9 || parsed.a < 255);
    const finalColor = isRef
      ? normalized
      : rgbaToHex(parsed.r, parsed.g, parsed.b, parsed.a, useHex8);

    if (colorEditTarget.scope === "component") {
      updateComponentStyles(colorEditTarget.componentId, {
        ...colorEditTarget.styles,
        [colorEditTarget.field]: finalColor,
      });
    } else if (colorEditTarget.scope === "page") {
      updateCustomPageById(colorEditTarget.pageId, (page) => ({
        ...page,
        styles: {
          ...page.styles,
          [colorEditTarget.field]: finalColor,
        },
      }));
    } else if (colorEditTarget.scope === "theme") {
      const { variable, mode } = colorEditTarget;
      setColorTheme((current) => {
        const pair = { ...current[variable], [mode]: finalColor };
        const suggested =
          mode === "light"
            ? suggestDarkFromLight(finalColor)
            : suggestLightFromDark(finalColor);
        const oppositeMode = mode === "light" ? "dark" : "light";
        const oppositeIsDefault =
          current[variable][oppositeMode] ===
          DEFAULT_COLOR_THEME[variable][oppositeMode];
        return {
          ...current,
          [variable]: {
            ...pair,
            [oppositeMode]: oppositeIsDefault
              ? suggested
              : current[variable][oppositeMode],
          },
        };
      });
    } else {
      updateComponentElementField(
        colorEditTarget.componentId,
        colorEditTarget.elementId,
        {
          styles: {
            ...colorEditTarget.styles,
            [colorEditTarget.field]: finalColor,
          },
        },
      );
    }

    setColorPickerDialogOpen(false);
    setColorEditTarget(null);
  };

  const updateSettingsItems = (
    transform: (items: SettingsItem[]) => SettingsItem[],
  ) => {
    void transform;
  };

  const addCustomPage = () => {
    if (!newCustomPageTitle.trim()) {
      toast.error("Please enter a page title");
      return;
    }

    const nextPageId = crypto.randomUUID();
    const normalizedUrl = normalizePageUrl(newCustomPageUrl);
    const normalizedParentPageId =
      newCustomPageParentId.trim().length > 0 ? newCustomPageParentId : null;

    const newCustomPage: CustomPage = {
      id: nextPageId,
      kind: "custom",
      title: newCustomPageTitle.trim(),
      url:
        normalizedUrl ||
        getDefaultPageUrl(newCustomPageTitle.trim(), nextPageId),
      showNavigationHeader: true,
      navigationHeaderComponentId: null,
      parentPageId: normalizedParentPageId,
      componentIds: [],
      styles: getDefaultPageStyles(),
    };

    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      const pages = Array.isArray(base.pages) ? base.pages : [];

      return {
        ...base,
        pages: [...pages, newCustomPage],
      };
    });

    setSelectedPageId(newCustomPage.id);
    setShowAddCustomPage(false);
    setNewCustomPageTitle("");
    setNewCustomPageUrl("");
    setNewCustomPageParentId("");
    toast.success("Custom page added");
  };

  const updateCustomPageById = (
    pageId: string,
    transform: (page: CustomPage) => CustomPage,
  ) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      const pages = Array.isArray(base.pages) ? base.pages : [];

      return {
        ...base,
        pages: pages.map((page) =>
          page.kind === "custom" && page.id === pageId ? transform(page) : page,
        ),
      };
    });
  };

  const updateSelectedPageTitle = (title: string) => {
    if (!selectedEditablePage) return;
    setSelectedPageTitleDraft(title);

    if (!title.trim()) {
      return;
    }

    updateCustomPageById(selectedEditablePage.id, (page) => ({
      ...page,
      title,
    }));

    setNavDraftPages((current) =>
      current.map((page) =>
        page.pageId === selectedEditablePage.id ? { ...page, title } : page,
      ),
    );
  };

  const updateSelectedPageUrl = (url: string) => {
    if (!selectedEditablePage) return;

    updateCustomPageById(selectedEditablePage.id, (page) => ({
      ...page,
      url,
    }));

    const normalizedUrl = normalizePageUrl(url);
    if (!normalizedUrl) {
      return;
    }

    setNavDraftPages((current) =>
      current.map((page) =>
        page.pageId === selectedEditablePage.id
          ? { ...page, link: normalizedUrl }
          : page,
      ),
    );
  };

  const updateSelectedPageShowNavigationHeader = (shown: boolean) => {
    if (!selectedEditablePage) return;

    updateCustomPageById(selectedEditablePage.id, (page) => ({
      ...page,
      showNavigationHeader: shown,
    }));
  };

  const updateSelectedPageNavigationHeaderComponent = (
    componentId: string | null,
  ) => {
    if (!selectedEditablePage) return;

    updateCustomPageById(selectedEditablePage.id, (page) => ({
      ...page,
      navigationHeaderComponentId: componentId,
    }));
  };

  const updateSelectedPageShowInNavigation = (shown: boolean) => {
    if (!selectedEditablePage) return;

    if (!shown) {
      setNavDraftPages((current) =>
        current.filter((page) => page.pageId !== selectedEditablePage.id),
      );
      return;
    }

    setNavDraftPages((current) => {
      if (current.some((page) => page.pageId === selectedEditablePage.id)) {
        return current;
      }

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          title: selectedEditablePage.title,
          link: selectedEditablePage.url,
          pageId: selectedEditablePage.id,
          icon: { name: newLinkIconName.trim() || getDefaultIconValue() },
        },
      ];
    });
  };

  const updateSelectedPageParent = (parentPageId: string | null) => {
    if (!selectedEditablePage) return;

    updateCustomPageById(selectedEditablePage.id, (page) => ({
      ...page,
      parentPageId,
    }));
  };

  const updateSelectedPageStyles = (styles: Partial<ComponentStyles>) => {
    if (!selectedEditablePage) return;

    updateCustomPageById(selectedEditablePage.id, (page) => ({
      ...page,
      styles: {
        ...page.styles,
        ...styles,
      },
    }));
  };

  const updateSelectedPagePaddingAxis = (axis: "x" | "y", value: string) => {
    if (!selectedEditablePage) return;
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);

    if (axis === "x") {
      updateSelectedPageStyles({
        paddingX: next,
        paddingLeft: next,
        paddingRight: next,
      });
      return;
    }

    updateSelectedPageStyles({
      paddingY: next,
      paddingTop: next,
      paddingBottom: next,
    });
  };

  const updateSelectedPagePaddingAll = (value: string) => {
    if (!selectedEditablePage) return;
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);

    updateSelectedPageStyles({
      paddingX: next,
      paddingY: next,
      paddingTop: next,
      paddingBottom: next,
      paddingLeft: next,
      paddingRight: next,
    });
  };

  const updateSelectedPagePaddingSide = (
    side: "top" | "bottom" | "left" | "right",
    value: string,
  ) => {
    if (!selectedEditablePage) return;
    const parsed = parseStyleNumber(value);
    if (parsed === null) return;
    const next = clampComponentSpacing(parsed);
    const currentStyles = selectedEditablePage.styles;
    const nextTop = side === "top" ? next : currentStyles.paddingTop;
    const nextBottom = side === "bottom" ? next : currentStyles.paddingBottom;
    const nextLeft = side === "left" ? next : currentStyles.paddingLeft;
    const nextRight = side === "right" ? next : currentStyles.paddingRight;

    updateSelectedPageStyles({
      paddingTop: nextTop,
      paddingBottom: nextBottom,
      paddingLeft: nextLeft,
      paddingRight: nextRight,
      paddingY: nextTop === nextBottom ? nextTop : currentStyles.paddingY,
      paddingX: nextLeft === nextRight ? nextLeft : currentStyles.paddingX,
    });
  };

  const addComponentToPage = (pageId: string, componentId: string) => {
    if (!componentId) return;
    updateCustomPageById(pageId, (page) => ({
      ...page,
      componentIds: [...page.componentIds, componentId],
    }));
  };

  const removePageComponent = (pageId: string, index: number) => {
    updateCustomPageById(pageId, (page) => ({
      ...page,
      componentIds: page.componentIds.filter((_, idx) => idx !== index),
    }));
  };

  const reorderPageComponent = (
    pageId: string,
    index: number,
    direction: "up" | "down",
  ) => {
    updateCustomPageById(pageId, (page) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= page.componentIds.length) {
        return page;
      }

      const next = [...page.componentIds];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return {
        ...page,
        componentIds: next,
      };
    });
  };

  const navigationHasUnsavedChanges =
    JSON.stringify(navDraftPages) !==
      JSON.stringify(safeConfig.navigation.navigationPages) ||
    navDraftLabel !== safeConfig.navigation.navigationLabel ||
    navDraftShowHeader !== safeConfig.navigation.showNavigationHeader ||
    navDraftHeaderMenuIconName !== safeConfig.navigation.headerMenuIconName ||
    navDraftHeaderBackIconName !== safeConfig.navigation.headerBackIconName;
  const normalizedPendingNavIconName = normalizeLucideIconName(
    newLinkIconName.trim(),
  );
  const isPendingNavIconValid =
    normalizedPendingNavIconName.length > 0 &&
    Boolean(getLucideIconComponent(normalizedPendingNavIconName));

  const updateNavigationLabel = (value: string) => {
    setNavDraftLabel(value);
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        navigation: {
          ...base.navigation,
          navigationLabel: value,
        },
      };
    });
  };

  const updateNavigationShowHeader = (shown: boolean) => {
    setNavDraftShowHeader(shown);
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        navigation: {
          ...base.navigation,
          showNavigationHeader: shown,
        },
      };
    });
  };

  const updateNavigationHeaderMenuIconName = (iconName: string) => {
    setNavDraftHeaderMenuIconName(iconName);
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        navigation: {
          ...base.navigation,
          headerMenuIconName: iconName,
        },
      };
    });
  };

  const updateNavigationHeaderBackIconName = (iconName: string) => {
    setNavDraftHeaderBackIconName(iconName);
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        navigation: {
          ...base.navigation,
          headerBackIconName: iconName,
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

  const buildNavigationIconFromForm = (): NavPage["icon"] => ({
    name: normalizedPendingNavIconName,
  });

  const buildNavigationPageFromForm = (): NavPage | null => {
    const selectedPageOption = pageTitleOptions.find(
      (option) => option.id === newLinkPageId,
    );

    if (!selectedPageOption) {
      return null;
    }

    return {
      id: crypto.randomUUID(),
      title: selectedPageOption.title,
      link: selectedPageOption.url,
      pageId: selectedPageOption.id,
      icon: buildNavigationIconFromForm(),
    };
  };

  const addNavigationPage = () => {
    if (!isPendingNavIconValid) {
      toast.error("Enter a valid Lucide icon name");
      return;
    }

    const newPage = buildNavigationPageFromForm();
    if (!newPage) {
      toast.error("Select a page first");
      return;
    }

    setNavDraftPages((current) => [...current, newPage]);

    setNewLinkIconName("");
    setShowAddNavigationPage(false);
    toast.success("Link added");
  };

  const removeNavigationPage = (id: string) => {
    setNavDraftPages((current) => current.filter((page) => page.id !== id));
    toast.success("Link removed");
  };

  const saveNavigationChanges = () => {
    if (!navigationHasUnsavedChanges) return;

    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        navigation: {
          ...base.navigation,
          navigationLabel: navDraftLabel,
          showNavigationHeader: navDraftShowHeader,
          headerMenuIconName: navDraftHeaderMenuIconName,
          headerBackIconName: navDraftHeaderBackIconName,
          navigationPages: navDraftPages,
        },
      };
    });

    toast.success("Navigation changes saved");
  };

  const getNavigationPreviewCode = (): string => {
    const items = navDraftPages
      .map(
        (page) =>
          `  { id: ${JSON.stringify(page.id)}, title: ${JSON.stringify(page.title)}, link: ${JSON.stringify(page.link)}, pageId: ${JSON.stringify(page.pageId)}, icon: ${JSON.stringify(page.icon.name)} },`,
      )
      .join("\n");

    return `const navigation = {
  shown: ${safeConfig.navigation.shown},
  navigationLabel: ${JSON.stringify(navDraftLabel)},
  showNavigationHeader: ${JSON.stringify(navDraftShowHeader)},
  headerMenuIconName: ${JSON.stringify(navDraftHeaderMenuIconName)},
  headerBackIconName: ${JSON.stringify(navDraftHeaderBackIconName)},
  navigationStyle: ${JSON.stringify(navDraftStyle, null, 2)},
  navigationPages: [
${items}
  ],
};`;
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

  const openNavigationMenu = () => {
    if (navDraftStyle.type !== "drawer") {
      return;
    }

    if (navDraftStyle.variant === "short") {
      setDrawerState("icons-only");
      return;
    }

    setDrawerState("open");
  };

  const navigateNavigationPreview = (
    pageId: string,
    options?: { replace?: boolean },
  ) => {
    if (!pageId.trim()) {
      return;
    }

    const destinationExists = editablePages.some((page) => page.id === pageId);
    if (!destinationExists) {
      return;
    }

    setNavigationPreviewPageId(pageId);
    setNavigationPreviewHistory((current) => {
      if (options?.replace) {
        if (current.length === 0) {
          return [pageId];
        }
        const next = [...current];
        next[next.length - 1] = pageId;
        return next;
      }

      if (current[current.length - 1] === pageId) {
        return current;
      }

      return [...current, pageId];
    });
  };

  const copyJsonToClipboard = () => {
    const json = JSON.stringify(
      {
        config: getExportConfig(),
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

  useEffect(() => {
    if (!selectedComponent) {
      setActiveElementEditorId("");
      setActiveNestedElementEditorIds({});
      return;
    }

    const stillExists = elementTreeHasInstanceId(
      selectedComponent.elements,
      activeElementEditorId,
    );

    if (!stillExists) {
      setActiveElementEditorId("");
    }
  }, [selectedComponent, activeElementEditorId]);

  const renderComponentElementCode = (
    element: ComponentElement,
    indent = "  ",
  ): string => {
    if (element.elementTypeId === "element-text") {
      const classes = [
        element.styles.alignment === "left"
          ? "text-left"
          : element.styles.alignment === "right"
            ? "text-right"
            : "text-center",
        "w-full",
        element.styles.isLabel ? "text-muted-foreground" : "text-foreground",
      ].join(" ");
      const styleBlock = formatJsxStyleBlock(
        [
          ["fontSize", `${0.5 + element.styles.size * 0.125}rem`],
          ["fontWeight", element.styles.isBold ? 700 : 400],
          ["fontStyle", element.styles.isItalic ? "italic" : "normal"],
          ...getElementSpacingStyleEntries(element.styles),
        ],
        indent,
      );

      return `${indent}<p\n${indent}  className=${JSON.stringify(classes)}${styleBlock}\n${indent}>${element.value || "Text"}</p>`;
    }

    if (element.elementTypeId === "element-toggle") {
      const positionClass =
        element.styles.position === "left"
          ? "justify-start"
          : element.styles.position === "right"
            ? "justify-end"
            : "justify-center";

      return `${indent}<div className=${JSON.stringify(`flex w-full ${positionClass}`)}>\n${indent}  <Switch defaultChecked={${element.defaultValue}} />\n${indent}</div>`;
    }

    if (element.elementTypeId === "element-button") {
      const buttonStyleBlock = formatJsxStyleBlock(
        [
          [
            "width",
            element.styles.width === "auto"
              ? undefined
              : element.styles.width === "full"
                ? "100%"
                : `${element.styles.width}px`,
          ],
          ...getElementSpacingStyleEntries(element.styles),
        ],
        `${indent}`,
      );
      const buttonClassName =
        element.styles.width === "full"
          ? ' className="w-full"'
          : ' className="w-auto"';
      const variantProp = element.isGhost ? ' variant="ghost"' : "";

      return `${indent}<Button${variantProp}${buttonClassName}${buttonStyleBlock}>${element.label}</Button>`;
    }

    if (element.elementTypeId === "element-select") {
      const options = element.values.filter(
        (option) => option.trim().length > 0,
      );
      const renderedOptions = (
        options.length > 0 ? options : ["No values"]
      ).map(
        (option, index) =>
          `${indent}      <SelectItem value=${JSON.stringify(String(index))}${options.length === 0 ? " disabled" : ""}>${option}</SelectItem>`,
      );

      return `${indent}<Select defaultValue=${JSON.stringify(options.length > 0 ? "0" : "")}>\n${indent}  <SelectTrigger className="w-44">\n${indent}    <SelectValue placeholder="Select..." />\n${indent}  </SelectTrigger>\n${indent}  <SelectContent>\n${renderedOptions.join("\n")}\n${indent}  </SelectContent>\n${indent}</Select>`;
    }

    if (element.elementTypeId === "element-text-input") {
      const alignmentClass =
        element.styles.alignment === "left"
          ? "justify-start"
          : element.styles.alignment === "right"
            ? "justify-end"
            : "justify-center";
      const inputStyleBlock = formatJsxStyleBlock(
        [
          [
            "width",
            element.styles.width === "full"
              ? "100%"
              : `${element.styles.width}px`,
          ],
          ...getElementSpacingStyleEntries(element.styles),
        ],
        `${indent}  `,
      );
      const inputClassName =
        element.styles.width === "full" ? ' className="w-full"' : "";

      return `${indent}<div className=${JSON.stringify(`flex w-full ${alignmentClass}`)}>\n${indent}  <Input${inputClassName}${inputStyleBlock} defaultValue=${JSON.stringify(element.value)} placeholder=${JSON.stringify(element.textHint)} />\n${indent}</div>`;
    }

    if (element.elementTypeId === "element-icon") {
      const iconName = toPascalCase(element.value) || "CircleAlert";
      const styleBlock = formatJsxStyleBlock(
        getElementSpacingStyleEntries(element.styles),
        indent,
      );
      return `${indent}<${iconName} className="text-foreground" size={${10 + element.styles.size * 2}}${styleBlock} />`;
    }

    if (element.elementTypeId === "element-image") {
      const styleBlock = formatJsxStyleBlock(
        [
          ["width", toCssDimension(element.styles.width)],
          ["height", toCssDimension(element.styles.height)],
          ["objectFit", element.styles.sizing],
          ...getElementSpacingStyleEntries(element.styles),
        ],
        indent,
      );
      return `${indent}<img\n${indent}  src=${JSON.stringify(element.src)}\n${indent}  alt="preview"\n${indent}  className="rounded border border-border bg-muted"${styleBlock}\n${indent}/>`;
    }

    const containerDirection = getDirectionFromContainer(element);
    const containerClasses = [
      "flex",
      containerDirection === "horizontal" ? "flex-row" : "flex-col",
      element.styles.overflowScroll ? "" : "flex-wrap",
      getFlexJustifyClass(element.styles.justifyContent),
      getFlexAlignItemsClass(element.styles.alignItems),
    ]
      .filter((value) => value.length > 0)
      .join(" ");
    const overflowStyle = getFlexOverflowStyle(
      containerDirection,
      element.styles.overflowScroll,
    );
    const containerStyleBlock = formatJsxStyleBlock(
      [
        ["gap", `${element.styles.gap}px`],
        [
          "minWidth",
          element.styles.minWidth > 0
            ? `${element.styles.minWidth}px`
            : undefined,
        ],
        [
          "maxWidth",
          element.styles.maxWidth > 0
            ? `${element.styles.maxWidth}px`
            : undefined,
        ],
        [
          "minHeight",
          element.styles.minHeight > 0
            ? `${element.styles.minHeight}px`
            : undefined,
        ],
        [
          "maxHeight",
          element.styles.maxHeight > 0
            ? `${element.styles.maxHeight}px`
            : undefined,
        ],
        ["paddingTop", `${element.styles.paddingTop}px`],
        ["paddingBottom", `${element.styles.paddingBottom}px`],
        ["paddingLeft", `${element.styles.paddingLeft}px`],
        ["paddingRight", `${element.styles.paddingRight}px`],
        ["marginTop", `${element.styles.marginTop}px`],
        ["marginBottom", `${element.styles.marginBottom}px`],
        ["marginLeft", `${element.styles.marginLeft}px`],
        ["marginRight", `${element.styles.marginRight}px`],
        ["overflowX", overflowStyle.overflowX],
        ["overflowY", overflowStyle.overflowY],
        [
          "backgroundColor",
          isTransparentHex(element.styles.backgroundColor)
            ? undefined
            : element.styles.backgroundColor,
        ],
        [
          "borderColor",
          element.styles.borderWidth > 0
            ? element.styles.borderColor
            : undefined,
        ],
        ["borderRadius", `${element.styles.borderRadius}px`],
        ["borderWidth", `${element.styles.borderWidth}px`],
        ["borderStyle", element.styles.borderWidth > 0 ? "solid" : undefined],
      ],
      indent,
    );
    const children =
      element.elements.length > 0
        ? element.elements
            .map((child) => renderComponentElementCode(child, `${indent}  `))
            .join("\n")
        : `${indent}  <div className="w-full text-sm text-muted-foreground">Empty container</div>`;

    return `${indent}<div\n${indent}  className=${JSON.stringify(containerClasses)}${containerStyleBlock}\n${indent}>\n${children}\n${indent}</div>`;
  };

  const getExplicitComponentElementJson = (
    element: ComponentElement,
  ): Record<string, unknown> => {
    if (element.elementTypeId === "element-text") {
      return {
        elementTypeId: element.elementTypeId,
        instanceId: element.instanceId,
        flex: element.flex ?? "none",
        value: element.value ?? "",
        apiBinding:
          typeof element.apiBinding === "string" &&
          element.apiBinding.trim().length > 0
            ? element.apiBinding
            : undefined,
        styles: {
          ...getExplicitElementSpacingJson(element.styles),
          alignment: element.styles.alignment ?? "center",
          size: element.styles.size ?? 3,
          fontWeight:
            element.styles.fontWeight ?? (element.styles.isBold ? 700 : 400),
          isBold: element.styles.isBold ?? false,
          isItalic: element.styles.isItalic ?? false,
          isLabel: element.styles.isLabel ?? false,
          textColor: "$text",
          labelColor: "$textHint",
        },
      };
    }

    if (element.elementTypeId === "element-toggle") {
      return {
        elementTypeId: element.elementTypeId,
        instanceId: element.instanceId,
        flex: element.flex ?? "none",
        defaultValue: element.defaultValue ?? false,
        styles: {
          ...getExplicitElementSpacingJson(element.styles),
          position: element.styles.position ?? "center",
          activeColor: "$primary",
          inactiveColor: "$border",
        },
      };
    }

    if (element.elementTypeId === "element-button") {
      return {
        elementTypeId: element.elementTypeId,
        instanceId: element.instanceId,
        flex: element.flex ?? "none",
        label: element.label ?? "",
        highlightOnHover: element.highlightOnHover ?? false,
        isGhost: element.isGhost ?? false,
        styles: {
          ...getExplicitElementSpacingJson(element.styles),
          width: element.styles.width ?? "full",
          alignment: "center",
          textColor: "$text",
          backgroundColor: "$button",
          highlightColor: "$highlight",
        },
      };
    }

    if (element.elementTypeId === "element-select") {
      return {
        elementTypeId: element.elementTypeId,
        instanceId: element.instanceId,
        flex: element.flex ?? "none",
        values: element.values ?? [],
        showDefaultLabel: true,
        defaultLabel: "Please Select",
        styles: {
          ...getExplicitElementSpacingJson(element.styles),
          textColor: "$text",
          backgroundColor: "$secondary",
          highlightColor: "$highlight",
          borderColor: "$border",
        },
      };
    }

    if (element.elementTypeId === "element-text-input") {
      return {
        elementTypeId: element.elementTypeId,
        instanceId: element.instanceId,
        flex: element.flex ?? "none",
        textHint: element.textHint ?? "",
        value: element.value ?? "",
        styles: {
          ...getExplicitElementSpacingJson(element.styles),
          alignment: element.styles.alignment ?? "center",
          width: element.styles.width ?? "full",
          textColor: "$text",
          borderColor: "$border",
          backgroundColor: "$secondary",
        },
      };
    }

    if (element.elementTypeId === "element-icon") {
      return {
        elementTypeId: element.elementTypeId,
        instanceId: element.instanceId,
        flex: element.flex ?? "none",
        value: element.value ?? "",
        styles: {
          ...getExplicitElementSpacingJson(element.styles),
          alignment: "center",
          size: element.styles.size ?? 24,
          color: "$text",
          borderWidth: 0,
          borderColor: "$border",
          borderRadius: 8,
        },
      };
    }

    if (element.elementTypeId === "element-image") {
      return {
        elementTypeId: element.elementTypeId,
        instanceId: element.instanceId,
        flex: element.flex ?? "none",
        src: element.src ?? "https://placehold.co/600x400",
        styles: {
          ...getExplicitElementSpacingJson(element.styles),
          alignment: "center",
          sizing: element.styles.sizing ?? "contain",
          containerWidth: "auto",
          containerHeight: "auto",
          backgroundColor: "$background",
          borderWidth: 0,
          borderColor: "$border",
          borderRadius: 8,
          padding: 0,
          width: element.styles.width ?? "full",
          height: element.styles.height ?? "auto",
        },
      };
    }

    if (isContainerElement(element)) {
      return {
        elementTypeId: element.elementTypeId,
        instanceId: element.instanceId,
        flex: element.flex ?? "none",
        styles: {
          flexDirection: element.styles.flexDirection ?? "column",
          justifyContent: element.styles.justifyContent ?? "start",
          alignItems: element.styles.alignItems ?? "start",
          overflowScroll: element.styles.overflowScroll ?? false,
          gap: element.styles.gap ?? 0,
          minWidth: element.styles.minWidth ?? 0,
          maxWidth: element.styles.maxWidth ?? DEFAULT_CONTAINER_MAX_DIMENSION,
          minHeight: element.styles.minHeight ?? 0,
          maxHeight:
            element.styles.maxHeight ?? DEFAULT_CONTAINER_MAX_DIMENSION,
          paddingTop: element.styles.paddingTop ?? 0,
          paddingBottom: element.styles.paddingBottom ?? 0,
          paddingLeft: element.styles.paddingLeft ?? 0,
          paddingRight: element.styles.paddingRight ?? 0,
          marginTop: element.styles.marginTop ?? 0,
          marginBottom: element.styles.marginBottom ?? 0,
          marginLeft: element.styles.marginLeft ?? 0,
          marginRight: element.styles.marginRight ?? 0,
          backgroundColor: resolveColor(
            element.styles.backgroundColor ?? "#ffffff00",
          ),
          borderColor: resolveColor(element.styles.borderColor ?? "#d4d4d8"),
          borderRadius: element.styles.borderRadius ?? 8,
          borderWidth: element.styles.borderWidth ?? 0,
        },
        elements: element.elements.map((child) =>
          getExplicitComponentElementJson(child),
        ),
      };
    }

    return element as unknown as Record<string, unknown>;
  };

  const getExplicitComponentJson = (
    component: AppComponent,
  ): Record<string, unknown> => {
    const componentApi = getSafeApiComponentConfig(component.api);

    return {
      id: component.id,
      label: component.label,
      styles: {
        direction: component.styles.direction ?? "horizontal",
        justifyContent: component.styles.justifyContent ?? "space-between",
        alignItems: component.styles.alignItems ?? "start",
        overflowScroll: component.styles.overflowScroll ?? false,
        gap: component.styles.gap ?? 0,
        minWidth: component.styles.minWidth ?? 0,
        maxWidth: component.styles.maxWidth ?? DEFAULT_CONTAINER_MAX_DIMENSION,
        minHeight: component.styles.minHeight ?? 0,
        maxHeight:
          component.styles.maxHeight ?? DEFAULT_CONTAINER_MAX_DIMENSION,
        paddingX: component.styles.paddingX ?? 0,
        paddingY: component.styles.paddingY ?? 0,
        marginX: component.styles.marginX ?? 0,
        marginY: component.styles.marginY ?? 0,
        paddingTop: component.styles.paddingTop ?? 0,
        paddingBottom: component.styles.paddingBottom ?? 0,
        paddingLeft: component.styles.paddingLeft ?? 0,
        paddingRight: component.styles.paddingRight ?? 0,
        marginTop: component.styles.marginTop ?? 0,
        marginBottom: component.styles.marginBottom ?? 0,
        marginLeft: component.styles.marginLeft ?? 0,
        marginRight: component.styles.marginRight ?? 0,
        backgroundColor: resolveColor(
          component.styles.backgroundColor ?? "#ffffff00",
        ),
        borderColor: resolveColor(component.styles.borderColor ?? "#d4d4d8"),
        borderRadius: component.styles.borderRadius ?? 8,
        borderWidth: component.styles.borderWidth ?? 0,
      },
      elements: component.elements.map((el) =>
        getExplicitComponentElementJson(el),
      ),
      api: {
        isApitComponent: componentApi.isApitComponent,
        request: {
          url: componentApi.request.url,
          method: componentApi.request.method,
          headers: componentApi.request.headers,
          body: componentApi.request.body,
        },
        response: {
          rawTestData: componentApi.response.rawTestData,
        },
      },
    };
  };

  const getExportConfig = (): ExportConfig => ({
    id: safeConfig.id,
    appName: safeConfig.appName,
    navigation: safeConfig.navigation,
    pages: safePages
      .filter((page): page is CustomPage => page.kind === "custom")
      .map((page) => ({
        id: page.id,
        title: page.title,
        url: page.url,
        showNavigationHeader: page.showNavigationHeader,
        navigationHeaderComponentId: page.navigationHeaderComponentId,
        parentPageId: page.parentPageId,
        componentIds: page.componentIds,
        styles: page.styles,
      })),
    components: customComponents.map((component) =>
      getExplicitComponentJson(component),
    ),
    colorTheme,
  });

  const getComponentPreviewCode = (component: AppComponent): string => {
    const justifyClass = getEffectiveFlexJustifyClass(
      component.styles.justifyContent,
      component.elements.length,
    );
    const className = [
      "flex",
      "w-full",
      component.styles.direction === "vertical" ? "flex-col" : "flex-row",
      component.styles.overflowScroll ? "" : "flex-wrap",
      getFlexAlignItemsClass(component.styles.alignItems),
      justifyClass,
    ]
      .filter((value) => value.length > 0)
      .join(" ");
    const overflowStyle = getFlexOverflowStyle(
      component.styles.direction,
      component.styles.overflowScroll,
    );
    const styleBlock = formatJsxStyleBlock(
      [
        ["gap", `${component.styles.gap}px`],
        [
          "minWidth",
          component.styles.minWidth > 0
            ? `${component.styles.minWidth}px`
            : undefined,
        ],
        [
          "maxWidth",
          component.styles.maxWidth > 0
            ? `${component.styles.maxWidth}px`
            : undefined,
        ],
        [
          "minHeight",
          component.styles.minHeight > 0
            ? `${component.styles.minHeight}px`
            : undefined,
        ],
        [
          "maxHeight",
          component.styles.maxHeight > 0
            ? `${component.styles.maxHeight}px`
            : undefined,
        ],
        ["paddingLeft", `${component.styles.paddingLeft}px`],
        ["paddingRight", `${component.styles.paddingRight}px`],
        ["paddingTop", `${component.styles.paddingTop}px`],
        ["paddingBottom", `${component.styles.paddingBottom}px`],
        ["marginLeft", `${component.styles.marginLeft}px`],
        ["marginRight", `${component.styles.marginRight}px`],
        ["marginTop", `${component.styles.marginTop}px`],
        ["marginBottom", `${component.styles.marginBottom}px`],
        ["overflowX", overflowStyle.overflowX],
        ["overflowY", overflowStyle.overflowY],
        [
          "backgroundColor",
          isTransparentHex(component.styles.backgroundColor)
            ? undefined
            : component.styles.backgroundColor,
        ],
        [
          "borderColor",
          component.styles.borderWidth > 0
            ? component.styles.borderColor
            : undefined,
        ],
        ["borderRadius", `${component.styles.borderRadius}px`],
        ["borderWidth", `${component.styles.borderWidth}px`],
        ["borderStyle", component.styles.borderWidth > 0 ? "solid" : undefined],
      ],
      "",
    );
    const children =
      component.elements.length > 0
        ? component.elements
            .map((element) => renderComponentElementCode(element, "  "))
            .join("\n")
        : "  {/* Add elements here */}";

    return `<div\n  className=${JSON.stringify(className)}${styleBlock}\n>\n${children}\n</div>`;
  };

  const renderAppComponentPreview = (component: AppComponent) => {
    const justifyClass = getEffectiveFlexJustifyClass(
      component.styles.justifyContent,
      component.elements.length,
    );
    const overflowStyle = getFlexOverflowStyle(
      component.styles.direction,
      component.styles.overflowScroll,
    );

    return (
      <div
        className={`flex w-full ${component.styles.direction === "vertical" ? "flex-col" : "flex-row"} ${component.styles.overflowScroll ? "" : "flex-wrap"} ${getFlexAlignItemsClass(component.styles.alignItems)} ${justifyClass}`}
        style={{
          gap: `${component.styles.gap}px`,
          minWidth:
            component.styles.minWidth > 0
              ? `${component.styles.minWidth}px`
              : undefined,
          maxWidth:
            component.styles.maxWidth > 0
              ? `${component.styles.maxWidth}px`
              : undefined,
          minHeight:
            component.styles.minHeight > 0
              ? `${component.styles.minHeight}px`
              : undefined,
          maxHeight:
            component.styles.maxHeight > 0
              ? `${component.styles.maxHeight}px`
              : undefined,
          paddingLeft: `${component.styles.paddingLeft}px`,
          paddingRight: `${component.styles.paddingRight}px`,
          paddingTop: `${component.styles.paddingTop}px`,
          paddingBottom: `${component.styles.paddingBottom}px`,
          marginLeft: `${component.styles.marginLeft}px`,
          marginRight: `${component.styles.marginRight}px`,
          marginTop: `${component.styles.marginTop}px`,
          marginBottom: `${component.styles.marginBottom}px`,
          overflowX: overflowStyle.overflowX,
          overflowY: overflowStyle.overflowY,
          backgroundColor: resolveColor(component.styles.backgroundColor),
          borderColor: resolveColor(component.styles.borderColor),
          borderRadius: `${component.styles.borderRadius}px`,
          borderWidth: `${component.styles.borderWidth}px`,
          borderStyle: component.styles.borderWidth > 0 ? "solid" : "none",
        }}
      >
        {component.elements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Empty component</p>
        ) : (
          component.elements.map((element) => (
            <div
              key={element.instanceId}
              className={`min-w-0 ${isContainerElement(element) ? "flex self-stretch" : elementNeedsFullWidth(element) ? "w-full" : ""}`}
              style={
                element.flex === null || element.flex === undefined
                  ? undefined
                  : element.flex === 0
                    ? { flex: "0 0 auto" }
                    : {
                        flex: `${element.flex} ${element.flex} 0%`,
                      }
              }
            >
              {renderComponentElementPreview(element, component.id)}
            </div>
          ))
        )}
      </div>
    );
  };

  const renderComponentElementPreview = (
    element: ComponentElement,
    componentId?: string,
  ) => {
    const resolvePreviewBinding = (value: string) => {
      const trimmed = value.trim();
      if (!componentId) {
        return value;
      }

      const responseData = getPreviewResponseDataForComponent(componentId);
      if (typeof responseData === "undefined") {
        return value;
      }

      const textBinding =
        element.elementTypeId === "element-text"
          ? getTextElementBinding(element, responseData)
          : null;
      const binding =
        textBinding ?? (trimmed.startsWith("data.") ? trimmed : null);
      if (!binding) {
        return value;
      }

      const resolvedBinding = resolveDataBindingPath(responseData, binding);
      if (!resolvedBinding) {
        return "";
      }

      return formatResolvedValue(resolvedBinding.value);
    };

    if (element.elementTypeId === "element-text") {
      const fontSize = `${0.5 + element.styles.size * 0.125}rem`;
      const alignClass =
        element.styles.alignment === "left"
          ? "text-left"
          : element.styles.alignment === "right"
            ? "text-right"
            : "text-center";
      const textColor = resolveColor(
        element.styles.isLabel ? "$textHint" : "$text",
      );

      const resolvedText = resolvePreviewBinding(element.value);
      return (
        <p
          className={`${alignClass} w-full`}
          style={{
            ...getBoxSpacingStyle(element.styles),
            fontSize,
            ...getBoxSpacingStyle(element.styles),
            fontWeight: element.styles.isBold ? 700 : 400,
            fontStyle: element.styles.isItalic ? "italic" : "normal",
            color: textColor,
          }}
        >
          {resolvedText ||
            ((element.apiBinding?.trim().startsWith("data.") ?? false) ||
            element.value.trim().startsWith("data.")
              ? ""
              : "Text")}
        </p>
      );
    }

    if (element.elementTypeId === "element-toggle") {
      const positionClass =
        element.styles.position === "left"
          ? "justify-start"
          : element.styles.position === "right"
            ? "justify-end"
            : "justify-center";
      const trackColor = resolveColor(
        element.defaultValue ? "$primary" : "$border",
      );

      return (
        <div
          className={`flex w-full ${positionClass}`}
          style={getBoxSpacingStyle(element.styles)}
        >
          <div
            className="inline-flex items-center"
            style={{
              width: "44px",
              height: "24px",
              borderRadius: "999px",
              backgroundColor: trackColor,
              padding: "2px",
              justifyContent: element.defaultValue ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "999px",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
              }}
            />
          </div>
        </div>
      );
    }

    if (element.elementTypeId === "element-button") {
      const widthStyle =
        element.styles.width === "full"
          ? { width: "100%" }
          : element.styles.width === "auto"
            ? undefined
            : { width: `${element.styles.width}px` };
      const backgroundColor = element.isGhost
        ? "transparent"
        : resolveColor("$button");
      const textColor = resolveColor("$text");
      const borderColor = element.isGhost ? resolveColor("$button") : undefined;

      return (
        <Button
          variant={element.isGhost ? "ghost" : "default"}
          style={{
            ...getBoxSpacingStyle(element.styles),
            ...widthStyle,
            backgroundColor,
            color: textColor,
            borderColor,
            borderWidth: element.isGhost ? "1px" : undefined,
            borderStyle: element.isGhost ? "solid" : undefined,
          }}
          className={element.styles.width === "full" ? "w-full" : "w-auto"}
        >
          {resolvePreviewBinding(element.label)}
        </Button>
      );
    }

    if (element.elementTypeId === "element-select") {
      const options = element.values
        .map((option) => resolvePreviewBinding(option))
        .filter((option) => option.trim().length > 0);
      const selectTextColor = resolveColor("$text");
      const selectBackgroundColor = resolveColor("$secondary");
      const selectBorderColor = resolveColor("$border");
      return (
        <Select defaultValue={options.length > 0 ? "0" : undefined}>
          <SelectTrigger
            className="w-44"
            style={{
              ...getBoxSpacingStyle(element.styles),
              color: selectTextColor,
              backgroundColor: selectBackgroundColor,
              borderColor: selectBorderColor,
            }}
          >
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {options.length > 0 ? (
              options.map((option, index) => (
                <SelectItem
                  key={`${element.instanceId}-preview-${index}`}
                  value={String(index)}
                >
                  {option}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-options" disabled>
                No values
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      );
    }

    if (element.elementTypeId === "element-text-input") {
      const alignmentClass =
        element.styles.alignment === "left"
          ? "justify-start"
          : element.styles.alignment === "right"
            ? "justify-end"
            : "justify-center";

      const widthStyle =
        element.styles.width === "full"
          ? { width: "100%" }
          : { width: `${element.styles.width}px` };
      const inputTextColor = resolveColor("$text");
      const inputBackgroundColor = resolveColor("$secondary");
      const inputBorderColor = resolveColor("$border");

      return (
        <div
          className={`flex w-full ${alignmentClass}`}
          style={getBoxSpacingStyle(element.styles)}
        >
          <Input
            className={element.styles.width === "full" ? "w-full" : undefined}
            style={{
              ...widthStyle,
              color: inputTextColor,
              backgroundColor: inputBackgroundColor,
              borderColor: inputBorderColor,
            }}
            value={resolvePreviewBinding(element.value)}
            placeholder={resolvePreviewBinding(element.textHint)}
            readOnly
          />
        </div>
      );
    }

    if (element.elementTypeId === "element-icon") {
      const IconComponent =
        getLucideIconComponent(resolvePreviewBinding(element.value)) || Home;
      const size = 10 + element.styles.size * 2;
      return (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderColor: resolveColor("$border"),
            borderWidth: "0px",
            borderStyle: "solid",
            borderRadius: "8px",
            padding: "6px",
            backgroundColor: resolveColor("$background"),
            ...getBoxSpacingStyle(element.styles),
          }}
        >
          <IconComponent size={size} color={resolveColor("$text")} />
        </div>
      );
    }

    if (isContainerElement(element)) {
      const containerDirection = getDirectionFromContainer(element);
      const overflowStyle = getFlexOverflowStyle(
        containerDirection,
        element.styles.overflowScroll,
      );
      return (
        <div
          className={`flex h-full w-full ${containerDirection === "horizontal" ? "flex-row" : "flex-col"} rounded-lg ${element.styles.overflowScroll ? "" : "flex-wrap"} ${getFlexJustifyClass(element.styles.justifyContent)} ${getFlexAlignItemsClass(element.styles.alignItems)}`}
          style={{
            gap: `${element.styles.gap}px`,
            minWidth:
              element.styles.minWidth > 0
                ? `${element.styles.minWidth}px`
                : undefined,
            maxWidth:
              element.styles.maxWidth > 0
                ? `${element.styles.maxWidth}px`
                : undefined,
            minHeight:
              element.styles.minHeight > 0
                ? `${element.styles.minHeight}px`
                : undefined,
            maxHeight:
              element.styles.maxHeight > 0
                ? `${element.styles.maxHeight}px`
                : undefined,
            paddingTop: `${element.styles.paddingTop}px`,
            paddingBottom: `${element.styles.paddingBottom}px`,
            paddingLeft: `${element.styles.paddingLeft}px`,
            paddingRight: `${element.styles.paddingRight}px`,
            marginTop: `${element.styles.marginTop}px`,
            marginBottom: `${element.styles.marginBottom}px`,
            marginLeft: `${element.styles.marginLeft}px`,
            marginRight: `${element.styles.marginRight}px`,
            overflowX: overflowStyle.overflowX,
            overflowY: overflowStyle.overflowY,
            backgroundColor: resolveColor(element.styles.backgroundColor),
            borderColor: resolveColor(element.styles.borderColor),
            borderRadius: `${element.styles.borderRadius}px`,
            borderWidth: `${element.styles.borderWidth}px`,
            borderStyle: element.styles.borderWidth > 0 ? "solid" : "none",
          }}
        >
          {element.elements.length > 0 ? (
            element.elements.map((child) => (
              <div
                key={child.instanceId}
                className={`min-w-0 ${isContainerElement(child) ? "flex self-stretch" : elementNeedsFullWidth(child) ? "w-full" : ""}`}
                style={
                  child.flex === null || child.flex === undefined
                    ? undefined
                    : child.flex === 0
                      ? { flex: "0 0 auto" }
                      : { flex: `${child.flex} ${child.flex} 0%` }
                }
              >
                {renderComponentElementPreview(child, componentId)}
              </div>
            ))
          ) : (
            <div className="w-full text-sm text-muted-foreground">
              Empty container
            </div>
          )}
        </div>
      );
    }

    const objectFit = element.styles.sizing;

    return (
      <img
        src={resolvePreviewBinding(element.src)}
        alt="preview"
        className="rounded"
        style={{
          ...getBoxSpacingStyle(element.styles),
          width: toCssDimension(element.styles.width),
          height: toCssDimension(element.styles.height),
          objectFit,
          backgroundColor: resolveColor("$background"),
          borderColor: resolveColor("$border"),
          borderWidth: "0px",
          borderStyle: "solid",
        }}
      />
    );
  };

  const getComponentElementLabel = (typeId: ElementTypeId) => {
    return (
      PREBUILT_ELEMENTS.find((element) => element.id === typeId)?.label ??
      typeId
    );
  };

  const getAllowedElementOptions = () => {
    return PREBUILT_ELEMENTS.map((el) => ({ id: el.id, label: el.label }));
  };

  const renderComponentElementFields = (
    componentId: string,
    element: ComponentElement,
  ) => {
    if (element.elementTypeId === "element-text") {
      const isBound = element.apiBinding?.trim().startsWith("data.") ?? false;
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Value</Label>
              {isBound && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Bound to {element.apiBinding}
                </span>
              )}
            </div>
            <Input
              value={element.apiBinding ?? element.value}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  value: e.target.value,
                  apiBinding: e.target.value.trim().startsWith("data.")
                    ? e.target.value.trim()
                    : null,
                })
              }
              placeholder="Text content"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            styles
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select
                value={element.styles.alignment}
                onValueChange={(value: "left" | "center" | "right") =>
                  updateComponentElementField(componentId, element.instanceId, {
                    styles: {
                      ...element.styles,
                      alignment: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Size (1-10)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={element.styles.size}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  const clamped = isNaN(parsed)
                    ? 3
                    : Math.min(10, Math.max(1, parsed));
                  updateComponentElementField(componentId, element.instanceId, {
                    styles: {
                      ...element.styles,
                      size: clamped,
                    },
                  });
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Bold</Label>
            <Switch
              checked={element.styles.isBold}
              onCheckedChange={(checked) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    isBold: checked,
                  },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Italic</Label>
            <Switch
              checked={element.styles.isItalic}
              onCheckedChange={(checked) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    isItalic: checked,
                  },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Label Style</Label>
            <Switch
              checked={element.styles.isLabel}
              onCheckedChange={(checked) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    isLabel: checked,
                  },
                })
              }
            />
          </div>
          {renderElementSpacingSection(
            componentId,
            element.instanceId,
            element.styles,
          )}
        </div>
      );
    }

    if (element.elementTypeId === "element-toggle") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Default Value</Label>
            <Switch
              checked={element.defaultValue}
              onCheckedChange={(checked) =>
                updateComponentElementField(componentId, element.instanceId, {
                  defaultValue: checked,
                })
              }
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            styles
          </p>
          <div className="space-y-2">
            <Label>Position</Label>
            <Select
              value={element.styles.position}
              onValueChange={(value: "left" | "center" | "right") =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    position: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {renderElementSpacingSection(
            componentId,
            element.instanceId,
            element.styles,
          )}
        </div>
      );
    }

    if (element.elementTypeId === "element-button") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={element.label}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  label: e.target.value,
                })
              }
              placeholder="Button"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Highlight on Hover</Label>
            <Switch
              checked={element.highlightOnHover}
              onCheckedChange={(checked) =>
                updateComponentElementField(componentId, element.instanceId, {
                  highlightOnHover: checked,
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Ghost Style</Label>
            <Switch
              checked={element.isGhost}
              onCheckedChange={(checked) =>
                updateComponentElementField(componentId, element.instanceId, {
                  isGhost: checked,
                })
              }
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            styles
          </p>
          <div className="space-y-2">
            <Label>Width</Label>
            <Select
              value={
                element.styles.width === "full"
                  ? "full"
                  : element.styles.width === "auto"
                    ? "auto"
                    : "pixels"
              }
              onValueChange={(mode: "auto" | "full" | "pixels") =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    width:
                      mode === "full"
                        ? "full"
                        : mode === "auto"
                          ? "auto"
                          : typeof element.styles.width === "number"
                            ? element.styles.width
                            : 240,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="full">Full Width</SelectItem>
                <SelectItem value="pixels">Pixels</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {element.styles.width !== "full" &&
            element.styles.width !== "auto" && (
              <div className="space-y-2">
                <Label>Width (px)</Label>
                <Input
                  type="number"
                  min={1}
                  value={element.styles.width}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    const nextWidth = isNaN(parsed) ? 240 : Math.max(1, parsed);
                    updateComponentElementField(
                      componentId,
                      element.instanceId,
                      {
                        styles: {
                          ...element.styles,
                          width: nextWidth,
                        },
                      },
                    );
                  }}
                />
              </div>
            )}
          {renderElementSpacingSection(
            componentId,
            element.instanceId,
            element.styles,
          )}
        </div>
      );
    }

    if (element.elementTypeId === "element-select") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {element.values.map((val, valIndex) => (
                <div
                  key={`${element.instanceId}-val-${valIndex}`}
                  className="flex items-center gap-2"
                >
                  <Input
                    placeholder={`Option ${valIndex + 1}`}
                    value={val}
                    onChange={(e) => {
                      const updated = [...element.values];
                      updated[valIndex] = e.target.value;
                      updateComponentElementField(
                        componentId,
                        element.instanceId,
                        {
                          values: updated,
                        },
                      );
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const updated =
                        element.values.length <= 1
                          ? [""]
                          : element.values.filter((_, i) => i !== valIndex);
                      updateComponentElementField(
                        componentId,
                        element.instanceId,
                        {
                          values: updated,
                        },
                      );
                    }}
                    className="text-destructive hover:text-destructive"
                    aria-label="Remove option"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              updateComponentElementField(componentId, element.instanceId, {
                values: [...element.values, ""],
              })
            }
          >
            <Plus size={16} />
            Add Option
          </Button>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            styles
          </p>
          {renderElementSpacingSection(
            componentId,
            element.instanceId,
            element.styles,
          )}
        </div>
      );
    }

    if (element.elementTypeId === "element-text-input") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Text Hint</Label>
            <Input
              value={element.textHint}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  textHint: e.target.value,
                })
              }
              placeholder="Enter text..."
            />
          </div>
          <div className="space-y-2">
            <Label>value</Label>
            <Input
              value={element.value}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  value: e.target.value,
                })
              }
              placeholder="value"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            styles
          </p>
          <div className="space-y-2">
            <Label>Width</Label>
            <Select
              value={element.styles.width === "full" ? "full" : "pixels"}
              onValueChange={(mode: "full" | "pixels") =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    width:
                      mode === "full"
                        ? "full"
                        : typeof element.styles.width === "number"
                          ? element.styles.width
                          : 240,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Width</SelectItem>
                <SelectItem value="pixels">Pixels</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {element.styles.width !== "full" && (
            <div className="space-y-2">
              <Label>Width (px)</Label>
              <Input
                type="number"
                min={1}
                value={element.styles.width}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  const nextWidth = isNaN(parsed) ? 240 : Math.max(1, parsed);
                  updateComponentElementField(componentId, element.instanceId, {
                    styles: {
                      ...element.styles,
                      width: nextWidth,
                    },
                  });
                }}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Alignment</Label>
            <Select
              value={element.styles.alignment}
              onValueChange={(value: "left" | "center" | "right") =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    alignment: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {renderElementSpacingSection(
            componentId,
            element.instanceId,
            element.styles,
          )}
        </div>
      );
    }

    if (element.elementTypeId === "element-icon") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Lucide Icon Name</Label>
            <Input
              value={element.value}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  value: e.target.value,
                })
              }
              placeholder="Home"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            styles
          </p>
          <div className="space-y-2">
            <Label>Size (1-10)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={element.styles.size}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                const clamped = isNaN(parsed)
                  ? 3
                  : Math.min(10, Math.max(1, parsed));
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    size: clamped,
                  },
                });
              }}
            />
          </div>
          {renderElementSpacingSection(
            componentId,
            element.instanceId,
            element.styles,
          )}
        </div>
      );
    }

    if (element.elementTypeId === "element-image") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Source URL</Label>
            <Input
              value={element.src}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  src: e.target.value,
                })
              }
              placeholder="https://..."
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            styles
          </p>
          <div className="space-y-2">
            <Label>Sizing</Label>
            <Select
              value={element.styles.sizing}
              onValueChange={(value: "contain" | "cover") =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    sizing: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="cover">Cover</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Width</Label>
            <Select
              value={element.styles.width === "full" ? "full" : "pixels"}
              onValueChange={(mode: "full" | "pixels") =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    width:
                      mode === "full"
                        ? "full"
                        : typeof element.styles.width === "number"
                          ? element.styles.width
                          : 320,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Width</SelectItem>
                <SelectItem value="pixels">Pixels</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {element.styles.width !== "full" && (
            <div className="space-y-2">
              <Label>Width (px)</Label>
              <Input
                type="number"
                min={1}
                value={element.styles.width}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  const nextWidth = isNaN(parsed) ? 320 : Math.max(1, parsed);
                  updateComponentElementField(componentId, element.instanceId, {
                    styles: {
                      ...element.styles,
                      width: nextWidth,
                    },
                  });
                }}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Height</Label>
            <Input
              value={String(element.styles.height)}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    height: e.target.value,
                  },
                })
              }
              placeholder="auto or 240"
            />
          </div>
          {renderElementSpacingSection(
            componentId,
            element.instanceId,
            element.styles,
          )}
        </div>
      );
    }

    const nestedElementOptions: Array<{ id: ElementTypeId; label: string }> =
      PREBUILT_ELEMENTS.map((prebuiltElement) => ({
        id: prebuiltElement.id,
        label: prebuiltElement.label,
      }));
    const nestedDraftType = nestedElementOptions.some(
      (prebuiltElement) =>
        prebuiltElement.id === containerElementTypeDrafts[element.instanceId],
    )
      ? (containerElementTypeDrafts[element.instanceId] as ElementTypeId)
      : "element-text";

    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          styles
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Justify Content</Label>
            <Select
              value={element.styles.justifyContent}
              onValueChange={(value: FlexJustifyContent) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    justifyContent: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="end">End</SelectItem>
                <SelectItem value="space-between">Space Between</SelectItem>
                <SelectItem value="space-around">Space Around</SelectItem>
                <SelectItem value="space-evenly">Space Evenly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Align Items</Label>
            <Select
              value={element.styles.alignItems}
              onValueChange={(value: FlexAlignItems) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    alignItems: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="end">End</SelectItem>
                <SelectItem value="stretch">Stretch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Flex Gap (0-50 px)</Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={element.styles.gap}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    gap: clampFlexGap(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 sm:col-span-2">
            <Label>Overflow Scroll</Label>
            <Switch
              checked={element.styles.overflowScroll}
              onCheckedChange={(checked) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    overflowScroll: checked,
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Min Width (px)</Label>
            <Input
              type="number"
              min={0}
              max={4096}
              value={element.styles.minWidth}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    minWidth: clampContainerDimension(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Max Width (px)</Label>
            <Input
              type="number"
              min={0}
              max={4096}
              value={element.styles.maxWidth}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    maxWidth: clampContainerDimension(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Min Height (px)</Label>
            <Input
              type="number"
              min={0}
              max={4096}
              value={element.styles.minHeight}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    minHeight: clampContainerDimension(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Max Height (px)</Label>
            <Input
              type="number"
              min={0}
              max={4096}
              value={element.styles.maxHeight}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    maxHeight: clampContainerDimension(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Padding Top (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={element.styles.paddingTop}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    paddingTop: clampComponentSpacing(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Padding Bottom (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={element.styles.paddingBottom}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    paddingBottom: clampComponentSpacing(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Padding Left (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={element.styles.paddingLeft}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    paddingLeft: clampComponentSpacing(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Padding Right (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={element.styles.paddingRight}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    paddingRight: clampComponentSpacing(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Margin Top (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={element.styles.marginTop}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    marginTop: clampComponentSpacing(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Margin Bottom (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={element.styles.marginBottom}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    marginBottom: clampComponentSpacing(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Margin Left (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={element.styles.marginLeft}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    marginLeft: clampComponentSpacing(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Margin Right (px)</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={element.styles.marginRight}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    marginRight: clampComponentSpacing(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Background Color</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-mono"
              onClick={() =>
                openColorPicker(
                  {
                    scope: "vertical-container",
                    componentId,
                    elementId: element.instanceId,
                    field: "backgroundColor",
                    styles: element.styles,
                  },
                  element.styles.backgroundColor,
                )
              }
            >
              <span>{element.styles.backgroundColor}</span>
              <span
                className="h-4 w-4 rounded border border-border"
                style={{
                  backgroundColor: normalizeHexColor(
                    element.styles.backgroundColor,
                    "#000000",
                  ),
                }}
              />
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Border Color</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-mono"
              onClick={() =>
                openColorPicker(
                  {
                    scope: "vertical-container",
                    componentId,
                    elementId: element.instanceId,
                    field: "borderColor",
                    styles: element.styles,
                  },
                  element.styles.borderColor,
                )
              }
            >
              <span>{element.styles.borderColor}</span>
              <span
                className="h-4 w-4 rounded border border-border"
                style={{
                  backgroundColor: normalizeHexColor(
                    element.styles.borderColor,
                    "#000000",
                  ),
                }}
              />
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Border Radius (px)</Label>
            <Input
              type="range"
              min={0}
              max={64}
              value={element.styles.borderRadius}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    borderRadius: clampContainerBorderRadius(e.target.value),
                  },
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              {element.styles.borderRadius}px
            </p>
          </div>
          <div className="space-y-2">
            <Label>Border Width (px)</Label>
            <Input
              type="number"
              min={0}
              max={16}
              value={element.styles.borderWidth}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  styles: {
                    ...element.styles,
                    borderWidth: clampContainerBorderWidth(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-2">
              <Label>Nested Element Type</Label>
              <Select
                value={nestedDraftType}
                onValueChange={(value: ElementTypeId) =>
                  setContainerElementTypeDrafts((current) => ({
                    ...current,
                    [element.instanceId]: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nestedElementOptions.map((prebuiltElement) => (
                    <SelectItem
                      key={prebuiltElement.id}
                      value={prebuiltElement.id}
                    >
                      {prebuiltElement.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              className="gap-2 sm:w-auto"
              onClick={() =>
                addComponentElement(
                  componentId,
                  nestedDraftType,
                  element.instanceId,
                )
              }
            >
              <Plus size={16} />
              Add Nested Element
            </Button>
          </div>

          {element.elements.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                nested elements
              </p>
              {renderComponentElementEditors(
                componentId,
                element.elements,
                true,
                element.instanceId,
              )}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              No nested elements yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderComponentElementEditors = (
    componentId: string,
    elements: ComponentElement[],
    nested = false,
    parentInstanceId?: string,
  ) => (
    <Accordion
      type="single"
      collapsible
      value={
        nested && parentInstanceId
          ? (activeNestedElementEditorIds[parentInstanceId] ?? "")
          : activeElementEditorId
      }
      onValueChange={(value) => {
        if (nested && parentInstanceId) {
          setActiveNestedElementEditorIds((current) => ({
            ...current,
            [parentInstanceId]: value,
          }));
          return;
        }

        setActiveElementEditorId(value);
      }}
      className={`rounded-lg border px-3 ${nested ? "border-border/70 bg-background/50" : "border-border bg-secondary"}`}
    >
      {elements.map((element, elementIndex) => (
        <AccordionItem
          key={element.instanceId}
          value={element.instanceId}
          className="border-border"
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="min-w-0 flex-1 pr-2 text-left">
              <p className="truncate font-medium">
                {getComponentElementLabel(element.elementTypeId)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {element.elementTypeId}
              </p>
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <div className="space-y-3">
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    reorderComponentElement(
                      componentId,
                      element.instanceId,
                      "up",
                    )
                  }
                  disabled={elementIndex === 0}
                  aria-label="Move up"
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    reorderComponentElement(
                      componentId,
                      element.instanceId,
                      "down",
                    )
                  }
                  disabled={elementIndex === elements.length - 1}
                  aria-label="Move down"
                >
                  <ArrowDown size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    removeComponentElement(componentId, element.instanceId)
                  }
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={18} />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Flex</Label>
                <Select
                  value={
                    element.flex === null || element.flex === undefined
                      ? "none"
                      : String(element.flex)
                  }
                  onValueChange={(value) =>
                    updateComponentElementField(
                      componentId,
                      element.instanceId,
                      {
                        flex: value === "none" ? null : Number(value),
                      },
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">none</SelectItem>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderComponentElementFields(componentId, element)}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

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
                    {JSON.stringify(getExportConfig(), null, 2)}
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

          <Dialog
            open={colorPickerDialogOpen}
            onOpenChange={(open) => {
              setColorPickerDialogOpen(open);
              if (!open) {
                setColorEditTarget(null);
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-mono">Pick Color</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {colorEditTarget?.scope !== "theme" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Theme Colors
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {THEME_VARIABLE_KEYS.map((variable) => (
                        <Button
                          key={variable}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="justify-between gap-1 font-mono text-xs h-8"
                          onClick={() => {
                            const refColor = `$${variable}`;
                            setColorDraftHex(refColor);
                            const resolved =
                              colorTheme[variable][themePreviewMode];
                            const rgba = hexToRgba(resolved) ?? {
                              r: 0,
                              g: 0,
                              b: 0,
                              a: 255,
                            };
                            setColorDraftRed(rgba.r);
                            setColorDraftGreen(rgba.g);
                            setColorDraftBlue(rgba.b);
                            setColorDraftAlpha(rgba.a);
                          }}
                        >
                          <span className="truncate">
                            {THEME_VARIABLE_LABELS[variable]}
                          </span>
                          <span
                            className="h-3 w-3 rounded-sm border border-border shrink-0"
                            style={{
                              backgroundColor:
                                colorTheme[variable][themePreviewMode],
                            }}
                          />
                        </Button>
                      ))}
                    </div>
                    <Separator />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="picker-native-color">Color Picker</Label>
                  <Input
                    id="picker-native-color"
                    type="color"
                    value={rgbaToHex(
                      colorDraftRed,
                      colorDraftGreen,
                      colorDraftBlue,
                    )}
                    onChange={(e) => syncColorFromHex(e.target.value)}
                    className="h-10 w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="picker-hex">HEX</Label>
                  <Input
                    id="picker-hex"
                    value={colorDraftHex}
                    onChange={(e) => syncColorFromHex(e.target.value)}
                    placeholder="#RRGGBB or #RRGGBBAA or $variable"
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="picker-r">R</Label>
                    <Input
                      id="picker-r"
                      type="number"
                      min={0}
                      max={255}
                      value={colorDraftRed}
                      onChange={(e) => syncColorFromRgb("r", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="picker-g">G</Label>
                    <Input
                      id="picker-g"
                      type="number"
                      min={0}
                      max={255}
                      value={colorDraftGreen}
                      onChange={(e) => syncColorFromRgb("g", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="picker-b">B</Label>
                    <Input
                      id="picker-b"
                      type="number"
                      min={0}
                      max={255}
                      value={colorDraftBlue}
                      onChange={(e) => syncColorFromRgb("b", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="picker-a">A</Label>
                    <Input
                      id="picker-a"
                      type="number"
                      min={0}
                      max={255}
                      value={colorDraftAlpha}
                      onChange={(e) => syncColorFromAlpha(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setColorPickerDialogOpen(false);
                    setColorEditTarget(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={saveColorFromPicker}>
                  Save
                </Button>
              </DialogFooter>
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
          <div className="grid w-full grid-cols-4 rounded-md bg-muted p-1">
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
              variant={activeTab === "theme" ? "default" : "ghost"}
              onClick={() => setActiveTab("theme")}
              className="gap-2"
            >
              <Palette size={16} />
              Theme
            </Button>
            <Button
              type="button"
              variant={activeTab === "pages" ? "default" : "ghost"}
              onClick={() => setActiveTab("pages")}
              className="gap-2"
            >
              <List size={16} />
              Pages
            </Button>
            <Button
              type="button"
              variant={activeTab === "components" ? "default" : "ghost"}
              onClick={() => setActiveTab("components")}
              className="gap-2"
            >
              <Box size={16} />
              Components
            </Button>
          </div>

          {activeTab === "pages" && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="space-y-2">
                  <Label htmlFor="pages-selector">Pages</Label>
                  <Select
                    value={
                      showAddCustomPage || !selectedEditablePage
                        ? "__add_custom__"
                        : selectedEditablePage.id
                    }
                    onValueChange={(value) => {
                      if (value === "__add_custom__") {
                        setShowAddCustomPage(true);
                        setNewCustomPageTitle("");
                        setNewCustomPageUrl("");
                        setNewCustomPageParentId("");
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
                      {editablePages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <SelectItem value="__add_custom__">
                        Create new page
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showAddCustomPage && (
                  <div className="mt-4 space-y-3 rounded-lg border border-border p-3">
                    <Label htmlFor="new-custom-page-title">Page Label</Label>
                    <Input
                      id="new-custom-page-title"
                      placeholder="Profile"
                      value={newCustomPageTitle}
                      onChange={(e) => setNewCustomPageTitle(e.target.value)}
                    />
                    <Label htmlFor="new-custom-page-url">URL</Label>
                    <Input
                      id="new-custom-page-url"
                      placeholder="/profile"
                      value={newCustomPageUrl}
                      onChange={(e) => setNewCustomPageUrl(e.target.value)}
                    />
                    <Label htmlFor="new-custom-page-parent">Parent</Label>
                    <Select
                      value={newCustomPageParentId || "__root__"}
                      onValueChange={(value) =>
                        setNewCustomPageParentId(
                          value === "__root__" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger id="new-custom-page-parent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__root__">Root</SelectItem>
                        {pageParentOptions.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addCustomPage}
                      className="w-full gap-2"
                      disabled={!newCustomPageTitle.trim()}
                    >
                      <Plus size={16} weight="bold" />
                      Create Page
                    </Button>
                  </div>
                )}

                {!showAddCustomPage && selectedEditablePage && (
                  <div className="mt-4 space-y-3 rounded-lg border border-border p-3">
                    <Label htmlFor="selected-page-url">URL</Label>
                    <Input
                      id="selected-page-url"
                      placeholder="/profile"
                      value={selectedEditablePage.url}
                      onChange={(e) => updateSelectedPageUrl(e.target.value)}
                    />

                    <Label htmlFor="selected-page-parent">Parent</Label>
                    <Select
                      value={selectedPageParentValue}
                      onValueChange={(value) => {
                        if (value === "__missing_parent__") {
                          return;
                        }

                        updateSelectedPageParent(
                          value === "__root__" ? null : value,
                        );
                      }}
                    >
                      <SelectTrigger id="selected-page-parent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__root__">Root</SelectItem>
                        {selectedPageParentOptions.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title}
                          </SelectItem>
                        ))}
                        {!selectedPageParentExists &&
                          selectedEditablePage.parentPageId && (
                            <SelectItem value="__missing_parent__">
                              Missing parent (
                              {selectedEditablePage.parentPageId})
                            </SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                    {!selectedPageParentExists &&
                      selectedEditablePage.parentPageId && (
                        <p className="text-xs text-destructive">
                          Parent page does not exist:{" "}
                          {selectedEditablePage.parentPageId}
                        </p>
                      )}
                  </div>
                )}
              </Card>

              {!showAddCustomPage && selectedEditablePage && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h2 className="text-lg font-semibold mb-4 font-mono">
                        Page Editor
                      </h2>
                      <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <Select
                            value={newPageComponentId}
                            onValueChange={setNewPageComponentId}
                          >
                            <SelectTrigger id="page-component-selector">
                              <SelectValue placeholder="Select component" />
                            </SelectTrigger>
                            <SelectContent>
                              {customComponents.map((component) => (
                                <SelectItem
                                  key={component.id}
                                  value={component.id}
                                >
                                  {component.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            onClick={() =>
                              addComponentToPage(
                                selectedEditablePage.id,
                                newPageComponentId,
                              )
                            }
                            disabled={!newPageComponentId}
                            className="gap-2"
                          >
                            <Plus size={16} weight="bold" />
                            Add
                          </Button>
                        </div>

                        {selectedPageComponents.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No components in this page yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {selectedPageComponents.map((component, index) => (
                              <div
                                key={`${selectedEditablePage.id}-${component.id}-${index}`}
                                className="flex items-center justify-between rounded-lg bg-secondary p-3"
                              >
                                <p className="text-sm font-medium truncate pr-3">
                                  {component.label}
                                </p>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      reorderPageComponent(
                                        selectedEditablePage.id,
                                        index,
                                        "up",
                                      )
                                    }
                                    disabled={index === 0}
                                  >
                                    <ArrowUp size={16} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      reorderPageComponent(
                                        selectedEditablePage.id,
                                        index,
                                        "down",
                                      )
                                    }
                                    disabled={
                                      index ===
                                      selectedPageComponents.length - 1
                                    }
                                  >
                                    <ArrowDown size={16} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() =>
                                      removePageComponent(
                                        selectedEditablePage.id,
                                        index,
                                      )
                                    }
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h2 className="text-lg font-semibold mb-4 font-mono">
                        Page Styles
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="page-direction">Orientation</Label>
                          <Select
                            value={selectedEditablePage.styles.direction}
                            onValueChange={(value: ComponentDirection) =>
                              updateSelectedPageStyles({ direction: value })
                            }
                          >
                            <SelectTrigger id="page-direction">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="horizontal">
                                Horizontal
                              </SelectItem>
                              <SelectItem value="vertical">Vertical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-justify-content">
                            Justify Content
                          </Label>
                          <Select
                            value={selectedEditablePage.styles.justifyContent}
                            onValueChange={(
                              value: ComponentStyles["justifyContent"],
                            ) =>
                              updateSelectedPageStyles({
                                justifyContent: value,
                              })
                            }
                          >
                            <SelectTrigger id="page-justify-content">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="start">Start</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="end">End</SelectItem>
                              <SelectItem value="space-between">
                                Space Between
                              </SelectItem>
                              <SelectItem value="space-around">
                                Space Around
                              </SelectItem>
                              <SelectItem value="space-evenly">
                                Space Evenly
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-align-items">Align Items</Label>
                          <Select
                            value={selectedEditablePage.styles.alignItems}
                            onValueChange={(
                              value: ComponentStyles["alignItems"],
                            ) =>
                              updateSelectedPageStyles({ alignItems: value })
                            }
                          >
                            <SelectTrigger id="page-align-items">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="start">Start</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="end">End</SelectItem>
                              <SelectItem value="stretch">Stretch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-gap">Gap (px)</Label>
                          <Input
                            id="page-gap"
                            type="number"
                            min={0}
                            max={50}
                            value={selectedEditablePage.styles.gap}
                            onChange={(e) =>
                              updateSelectedPageStyles({
                                gap: clampFlexGap(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                          <Label htmlFor="page-overflow-y">Overflow Y</Label>
                          <Switch
                            id="page-overflow-y"
                            checked={
                              selectedEditablePage.styles.overflowYScroll ===
                              true
                            }
                            onCheckedChange={(checked) =>
                              updateSelectedPageStyles({
                                overflowYScroll: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                          <Label htmlFor="page-overflow-x">Overflow X</Label>
                          <Switch
                            id="page-overflow-x"
                            checked={
                              selectedEditablePage.styles.overflowXScroll ===
                              true
                            }
                            onCheckedChange={(checked) =>
                              updateSelectedPageStyles({
                                overflowXScroll: checked,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-min-width">Min Width (px)</Label>
                          <Input
                            id="page-min-width"
                            type="number"
                            min={0}
                            max={4096}
                            value={selectedEditablePage.styles.minWidth}
                            onChange={(e) => {
                              const parsed = parseStyleNumber(e.target.value);
                              if (parsed === null) return;
                              updateSelectedPageStyles({
                                minWidth: clampContainerDimension(parsed),
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-max-width">Max Width (px)</Label>
                          <Input
                            id="page-max-width"
                            type="text"
                            value={pageMaxWidthInput}
                            placeholder="none"
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              setPageMaxWidthInput(nextValue);
                              const parsed =
                                parseContainerDimensionOrNone(nextValue);
                              if (parsed === null) return;
                              updateSelectedPageStyles({ maxWidth: parsed });
                            }}
                            onBlur={() => {
                              const parsed =
                                parseContainerDimensionOrNone(
                                  pageMaxWidthInput,
                                );
                              if (parsed === null) {
                                setPageMaxWidthInput(
                                  selectedEditablePage.styles.maxWidth === 0
                                    ? "none"
                                    : String(
                                        selectedEditablePage.styles.maxWidth,
                                      ),
                                );
                                return;
                              }

                              setPageMaxWidthInput(
                                parsed === 0 ? "none" : String(parsed),
                              );
                            }}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="page-padding">
                              <AccordionTrigger className="font-mono text-sm">
                                Padding
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="page-padding-all">
                                      Padding (All Sides)
                                    </Label>
                                    <Input
                                      id="page-padding-all"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedEditablePage.styles
                                          .paddingTop ===
                                          selectedEditablePage.styles
                                            .paddingBottom &&
                                        selectedEditablePage.styles
                                          .paddingTop ===
                                          selectedEditablePage.styles
                                            .paddingLeft &&
                                        selectedEditablePage.styles
                                          .paddingTop ===
                                          selectedEditablePage.styles
                                            .paddingRight
                                          ? String(
                                              selectedEditablePage.styles
                                                .paddingTop,
                                            )
                                          : ""
                                      }
                                      onChange={(e) =>
                                        updateSelectedPagePaddingAll(
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="page-padding-x">
                                      Horizontal Padding (px)
                                    </Label>
                                    <Input
                                      id="page-padding-x"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={getAxisInputValue(
                                        selectedEditablePage.styles.paddingLeft,
                                        selectedEditablePage.styles
                                          .paddingRight,
                                      )}
                                      onChange={(e) =>
                                        updateSelectedPagePaddingAxis(
                                          "x",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="page-padding-y">
                                      Vertical Padding (px)
                                    </Label>
                                    <Input
                                      id="page-padding-y"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={getAxisInputValue(
                                        selectedEditablePage.styles.paddingTop,
                                        selectedEditablePage.styles
                                          .paddingBottom,
                                      )}
                                      onChange={(e) =>
                                        updateSelectedPagePaddingAxis(
                                          "y",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="page-padding-top">
                                      Padding Top (px)
                                    </Label>
                                    <Input
                                      id="page-padding-top"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedEditablePage.styles.paddingTop
                                      }
                                      onChange={(e) =>
                                        updateSelectedPagePaddingSide(
                                          "top",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="page-padding-bottom">
                                      Padding Bottom (px)
                                    </Label>
                                    <Input
                                      id="page-padding-bottom"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedEditablePage.styles
                                          .paddingBottom
                                      }
                                      onChange={(e) =>
                                        updateSelectedPagePaddingSide(
                                          "bottom",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="page-padding-left">
                                      Padding Left (px)
                                    </Label>
                                    <Input
                                      id="page-padding-left"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedEditablePage.styles.paddingLeft
                                      }
                                      onChange={(e) =>
                                        updateSelectedPagePaddingSide(
                                          "left",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="page-padding-right">
                                      Padding Right (px)
                                    </Label>
                                    <Input
                                      id="page-padding-right"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedEditablePage.styles.paddingRight
                                      }
                                      onChange={(e) =>
                                        updateSelectedPagePaddingSide(
                                          "right",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-background-color">
                            Background Color
                          </Label>
                          <Button
                            id="page-background-color"
                            type="button"
                            variant="outline"
                            className="w-full justify-between font-mono"
                            onClick={() =>
                              openColorPicker(
                                {
                                  scope: "page",
                                  pageId: selectedEditablePage.id,
                                  field: "backgroundColor",
                                  styles: selectedEditablePage.styles,
                                },
                                selectedEditablePage.styles.backgroundColor,
                              )
                            }
                          >
                            <span>
                              {selectedEditablePage.styles.backgroundColor}
                            </span>
                            <span
                              className="h-4 w-4 rounded border border-border"
                              style={{
                                backgroundColor: normalizeHexColor(
                                  selectedEditablePage.styles.backgroundColor,
                                  "#000000",
                                ),
                              }}
                            />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-border-color">
                            Border Color
                          </Label>
                          <Button
                            id="page-border-color"
                            type="button"
                            variant="outline"
                            className="w-full justify-between font-mono"
                            onClick={() =>
                              openColorPicker(
                                {
                                  scope: "page",
                                  pageId: selectedEditablePage.id,
                                  field: "borderColor",
                                  styles: selectedEditablePage.styles,
                                },
                                selectedEditablePage.styles.borderColor,
                              )
                            }
                          >
                            <span>
                              {selectedEditablePage.styles.borderColor}
                            </span>
                            <span
                              className="h-4 w-4 rounded border border-border"
                              style={{
                                backgroundColor: normalizeHexColor(
                                  selectedEditablePage.styles.borderColor,
                                  "#000000",
                                ),
                              }}
                            />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-border-radius">
                            Border Radius
                          </Label>
                          <Input
                            id="page-border-radius"
                            type="range"
                            min={0}
                            max={64}
                            value={selectedEditablePage.styles.borderRadius}
                            onChange={(e) =>
                              updateSelectedPageStyles({
                                borderRadius: clampContainerBorderRadius(
                                  e.target.value,
                                ),
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {selectedEditablePage.styles.borderRadius}px
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-border-width">
                            Border Width (px)
                          </Label>
                          <Input
                            id="page-border-width"
                            type="number"
                            min={0}
                            max={16}
                            value={selectedEditablePage.styles.borderWidth}
                            onChange={(e) =>
                              updateSelectedPageStyles({
                                borderWidth: clampContainerBorderWidth(
                                  e.target.value,
                                ),
                              })
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <h2 className="text-lg font-semibold mb-4 font-mono">
                      Live Preview
                    </h2>
                    <div className="border-2 border-border rounded-lg bg-card min-h-[420px]">
                      <ScrollArea className="h-[420px]">
                        <div className="p-4">
                          {selectedPageComponents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Add components to preview this page.
                            </p>
                          ) : (
                            (() => {
                              const pageStyles = selectedEditablePage.styles;
                              const justifyClass = getEffectiveFlexJustifyClass(
                                pageStyles.justifyContent,
                                selectedPageComponents.length,
                              );

                              return (
                                <div
                                  className={`flex w-full ${pageStyles.direction === "vertical" ? "flex-col" : "flex-row"} ${getFlexAlignItemsClass(pageStyles.alignItems)} ${justifyClass}`}
                                  style={{
                                    gap: `${pageStyles.gap}px`,
                                    minWidth:
                                      pageStyles.minWidth > 0
                                        ? `${pageStyles.minWidth}px`
                                        : undefined,
                                    maxWidth:
                                      pageStyles.maxWidth > 0
                                        ? `${pageStyles.maxWidth}px`
                                        : undefined,
                                    paddingLeft: `${pageStyles.paddingLeft}px`,
                                    paddingRight: `${pageStyles.paddingRight}px`,
                                    paddingTop: `${pageStyles.paddingTop}px`,
                                    paddingBottom: `${pageStyles.paddingBottom}px`,
                                    overflowX:
                                      pageStyles.overflowXScroll === true
                                        ? "auto"
                                        : "hidden",
                                    overflowY:
                                      pageStyles.overflowYScroll === true
                                        ? "auto"
                                        : "hidden",
                                    backgroundColor: resolveColor(
                                      pageStyles.backgroundColor,
                                    ),
                                    borderColor: resolveColor(
                                      pageStyles.borderColor,
                                    ),
                                    borderRadius: `${pageStyles.borderRadius}px`,
                                    borderWidth: `${pageStyles.borderWidth}px`,
                                    borderStyle:
                                      pageStyles.borderWidth > 0
                                        ? "solid"
                                        : "none",
                                  }}
                                >
                                  {selectedPageComponents.map(
                                    (component, index) => (
                                      <div
                                        key={`${selectedEditablePage.id}-preview-${component.id}-${index}`}
                                        className="min-w-0"
                                      >
                                        {renderAppComponentPreview(component)}
                                      </div>
                                    ),
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </Card>
                </div>
              )}
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
                  <Label htmlFor="navigation-label">Navigation Label</Label>
                  <Input
                    id="navigation-label"
                    placeholder="none"
                    value={navDraftLabel}
                    onChange={(e) => updateNavigationLabel(e.target.value)}
                  />
                </div>

                <div className="mb-4 space-y-3 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="navigation-show-header">
                      Show Navigation Header
                    </Label>
                    <Switch
                      id="navigation-show-header"
                      checked={navDraftShowHeader}
                      onCheckedChange={updateNavigationShowHeader}
                    />
                  </div>

                  {navDraftShowHeader && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="navigation-header-menu-icon">
                          Menu Icon
                        </Label>
                        <Input
                          id="navigation-header-menu-icon"
                          value={navDraftHeaderMenuIconName}
                          onChange={(e) =>
                            updateNavigationHeaderMenuIconName(e.target.value)
                          }
                          placeholder="Menu"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="navigation-header-back-icon">
                          Back Icon
                        </Label>
                        <Input
                          id="navigation-header-back-icon"
                          value={navDraftHeaderBackIconName}
                          onChange={(e) =>
                            updateNavigationHeaderBackIconName(e.target.value)
                          }
                          placeholder="ArrowLeft"
                        />
                      </div>
                    </div>
                  )}
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

                {selectedEditablePage && (
                  <div className="mb-4 space-y-3 rounded-md border border-border p-3">
                    <p className="text-sm font-semibold">Page Navigation</p>

                    <div className="space-y-2">
                      <Label htmlFor="navigation-selected-page">Page</Label>
                      <Select
                        value={selectedEditablePage.id}
                        onValueChange={setSelectedPageId}
                      >
                        <SelectTrigger id="navigation-selected-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {editablePages.map((page) => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="selected-page-label">
                        Selected Page Label
                      </Label>
                      <Input
                        id="selected-page-label"
                        value={selectedPageTitleDraft}
                        onChange={(e) =>
                          updateSelectedPageTitle(e.target.value)
                        }
                      />
                      {!selectedPageTitleDraft.trim() && (
                        <p className="text-xs text-destructive">
                          The label cannot be blank.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <Label htmlFor="selected-page-show-navigation-header">
                        Show navigation header
                      </Label>
                      <Switch
                        id="selected-page-show-navigation-header"
                        checked={selectedEditablePage.showNavigationHeader}
                        onCheckedChange={updateSelectedPageShowNavigationHeader}
                      />
                    </div>

                    {selectedEditablePage.showNavigationHeader && (
                      <div className="space-y-2">
                        <Label htmlFor="selected-page-header-component">
                          Header Component
                        </Label>
                        <Select
                          value={selectedPageHeaderComponentValue}
                          onValueChange={(value) =>
                            updateSelectedPageNavigationHeaderComponent(
                              value === "__none__" ? null : value,
                            )
                          }
                        >
                          <SelectTrigger id="selected-page-header-component">
                            <SelectValue placeholder="Select component" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {customComponents.map((component) => (
                              <SelectItem
                                key={component.id}
                                value={component.id}
                              >
                                {component.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <Label htmlFor="selected-page-show-in-navigation">
                        Show in navigation
                      </Label>
                      <Switch
                        id="selected-page-show-in-navigation"
                        checked={selectedPageShownInNavigation}
                        onCheckedChange={updateSelectedPageShowInNavigation}
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold font-mono">
                    Navigation Pages
                  </h2>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          JSON
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                        <DialogHeader className="shrink-0">
                          <DialogTitle className="font-mono">
                            Navigation JSON
                          </DialogTitle>
                        </DialogHeader>
                        <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                          {JSON.stringify(
                            {
                              shown: safeConfig.navigation.shown,
                              navigationLabel: navDraftLabel,
                              showNavigationHeader: navDraftShowHeader,
                              headerMenuIconName: navDraftHeaderMenuIconName,
                              headerBackIconName: navDraftHeaderBackIconName,
                              navigationStyle: navDraftStyle,
                              navigationPages: navDraftPages,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                        <DialogHeader className="shrink-0">
                          <DialogTitle className="font-mono">
                            Navigation React Code
                          </DialogTitle>
                        </DialogHeader>
                        <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                          {getNavigationPreviewCode()}
                        </pre>
                      </DialogContent>
                    </Dialog>
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveNavigationChanges}
                      disabled={!navigationHasUnsavedChanges}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {!showAddNavigationPage ? (
                    <Button
                      onClick={() => setShowAddNavigationPage(true)}
                      className="w-full gap-2"
                    >
                      <Plus size={18} weight="bold" />
                      Add Page
                    </Button>
                  ) : (
                    <div className="space-y-4 rounded-lg border border-border p-3">
                      <div className="grid gap-4 sm:grid-cols-2">
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
                          {selectedLinkPageIsNonRoot && (
                            <p className="text-xs text-amber-600">
                              Selected page is not root.
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="link-icon-name">Icon Name</Label>
                            <a
                              href="https://lucide.dev/icons"
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline underline-offset-2"
                            >
                              Lucide icons
                            </a>
                          </div>
                          <Input
                            id="link-icon-name"
                            placeholder="Home"
                            value={newLinkIconName}
                            onChange={(e) => setNewLinkIconName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && addNavigationPage()
                            }
                          />
                          {!isPendingNavIconValid && (
                            <p className="text-xs text-destructive">
                              Enter a valid Lucide icon name.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={addNavigationPage}
                          className="flex-1 gap-2"
                          disabled={
                            !isPendingNavIconValid ||
                            pageTitleOptions.length === 0
                          }
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddNavigationPage(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

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
                                      {page.link}
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
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">
                      Always visible
                    </span>
                  )}
                </div>

                <div className="relative border-2 border-border rounded-lg overflow-hidden bg-card min-h-[400px]">
                  {safeConfig.navigation.shown &&
                    navigationPreviewShowsHeader && (
                      <div className="absolute top-0 left-0 right-0 z-20 h-14 border-b border-border bg-card/95 px-3">
                        <div className="flex h-full items-center justify-between gap-3">
                          {navigationPreviewHasParent ? (
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-card hover:bg-muted"
                              onClick={() => {
                                if (navigationPreviewParentPage) {
                                  navigateNavigationPreview(
                                    navigationPreviewParentPage.id,
                                    { replace: true },
                                  );
                                }
                              }}
                              aria-label="Back to parent page"
                            >
                              {renderNavIcon(
                                {
                                  name:
                                    navDraftHeaderBackIconName || "ArrowLeft",
                                },
                                "",
                                16,
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-card hover:bg-muted"
                              onClick={openNavigationMenu}
                              aria-label="Open navigation menu"
                            >
                              {renderNavIcon(
                                { name: navDraftHeaderMenuIconName || "Menu" },
                                "",
                                16,
                              )}
                            </button>
                          )}
                          <div className="min-w-0 flex-1 overflow-hidden">
                            {navigationPreviewHeaderComponent ? (
                              renderAppComponentPreview(
                                navigationPreviewHeaderComponent,
                              )
                            ) : (
                              <h3 className="truncate text-sm font-semibold">
                                {navigationPreviewPage?.title ||
                                  navDraftLabel ||
                                  "Navigation"}
                              </h3>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {safeConfig.navigation.shown &&
                    navDraftStyle.type === "drawer" && (
                      <motion.div
                        className="absolute left-0 bg-secondary border-r border-border flex flex-col z-10"
                        style={{
                          top: `${navigationPreviewHeaderHeight}px`,
                          height: `calc(100% - ${navigationPreviewHeaderHeight}px)`,
                        }}
                        initial={false}
                        animate={{ width: drawerWidth }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        {drawerState !== "closed" && (
                          <div className="flex flex-col h-full overflow-hidden">
                            <ScrollArea className="flex-1">
                              <div className="space-y-1 px-2 pb-4">
                                {navDraftPages.length === 0 ? (
                                  <div className="text-center py-8 px-4"></div>
                                ) : (
                                  navDraftPages.map((page) =>
                                    (() => {
                                      const isActive =
                                        page.pageId ===
                                        navigationPreviewPage?.id;
                                      return (
                                        <div
                                          key={page.id}
                                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${isActive ? "bg-muted" : "hover:bg-muted/50"}`}
                                          onClick={() => {
                                            if (page.pageId) {
                                              navigateNavigationPreview(
                                                page.pageId,
                                              );
                                            }
                                          }}
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

                  {safeConfig.navigation.shown &&
                    navDraftStyle.type === "bottom" && (
                      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-secondary z-10">
                        <div className="grid grid-flow-col auto-cols-fr gap-1 p-2">
                          {navDraftPages.map((page) => (
                            <button
                              key={page.id}
                              type="button"
                              className={`flex items-center justify-center rounded px-2 py-1 transition-colors ${page.pageId === navigationPreviewPage?.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                              onClick={() => {
                                if (page.pageId) {
                                  navigateNavigationPreview(page.pageId);
                                }
                              }}
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
                    className="h-full"
                    initial={false}
                    animate={
                      !safeConfig.navigation.shown
                        ? {
                            paddingTop: 24,
                            paddingLeft: 24,
                            paddingBottom: 24,
                          }
                        : navDraftStyle.type === "drawer"
                          ? {
                              paddingTop: navigationPreviewHeaderHeight + 24,
                              paddingLeft: drawerWidth + 24,
                              paddingBottom: 24,
                            }
                          : {
                              paddingTop: navigationPreviewHeaderHeight + 24,
                              paddingLeft: 24,
                              paddingBottom: 92,
                            }
                    }
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <div className="text-sm text-muted-foreground">
                      {navigationPreviewPage?.title || "No page selected"}
                    </div>
                  </motion.div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "components" && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="space-y-2">
                  <Label htmlFor="components-selector">Components</Label>
                  <Select
                    value={
                      showAddCustomComponent
                        ? "__add_custom_component__"
                        : (selectedComponent?.id ?? "")
                    }
                    onValueChange={(value) => {
                      if (value === "__add_custom_component__") {
                        setShowAddCustomComponent(true);
                        return;
                      }

                      setShowAddCustomComponent(false);
                      setSelectedComponentId(value);
                    }}
                  >
                    <SelectTrigger id="components-selector">
                      <SelectValue placeholder="Select a component" />
                    </SelectTrigger>
                    <SelectContent>
                      {customComponents.map((component) => (
                        <SelectItem key={component.id} value={component.id}>
                          {component.label}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <SelectItem value="__add_custom_component__">
                        Create new component
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showAddCustomComponent && (
                  <div className="mt-4 space-y-3 rounded-lg border border-border p-3">
                    <Label htmlFor="new-custom-component-label">
                      Component Label
                    </Label>
                    <Input
                      id="new-custom-component-label"
                      placeholder="Profile Card"
                      value={newCustomComponentLabel}
                      onChange={(e) =>
                        setNewCustomComponentLabel(e.target.value)
                      }
                    />
                    {!isPendingNewComponentLabelBlank &&
                      !isPendingNewComponentLabelAvailable && (
                        <p className="text-xs text-destructive">
                          &quot;{pendingNewComponentLabel}&quot; is not
                          available.
                        </p>
                      )}

                    <div className="space-y-2">
                      <Select
                        value={newCustomComponentMode}
                        onValueChange={(value: NewCustomComponentMode) =>
                          setNewCustomComponentMode(value)
                        }
                      >
                        <SelectTrigger id="new-component-start-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blank-component">
                            Blank Component
                          </SelectItem>
                          <SelectItem value="project-components">
                            Project Components
                          </SelectItem>
                          <SelectItem value="component-library">
                            Component Library
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newCustomComponentMode === "project-components" && (
                      <div className="space-y-2">
                        <Label htmlFor="project-component-template">
                          Copy From Project Component
                        </Label>
                        <Select
                          value={newProjectTemplateComponentId}
                          onValueChange={setNewProjectTemplateComponentId}
                        >
                          <SelectTrigger id="project-component-template">
                            <SelectValue placeholder="Select a project component" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectComponentTemplateOptions.map(
                              (component) => (
                                <SelectItem
                                  key={component.id}
                                  value={component.id}
                                >
                                  {component.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        {projectComponentTemplateOptions.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No project components available yet.
                          </p>
                        )}
                      </div>
                    )}

                    {newCustomComponentMode === "component-library" && (
                      <div className="space-y-2">
                        <Label htmlFor="library-component-template">
                          Copy From Component Library
                        </Label>
                        <Select
                          value={newLibraryTemplateComponentId}
                          onValueChange={setNewLibraryTemplateComponentId}
                        >
                          <SelectTrigger id="library-component-template">
                            <SelectValue placeholder="Select a library component" />
                          </SelectTrigger>
                          <SelectContent>
                            {libraryComponentTemplateOptions.map(
                              (component) => (
                                <SelectItem
                                  key={component.id}
                                  value={component.id}
                                >
                                  {component.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        {libraryComponentTemplateOptions.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No library components found in
                            appgen-config-prebuilt.json.
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={addCustomComponent}
                      className="w-full gap-2"
                      disabled={isPendingNewComponentLabelBlank}
                    >
                      <Plus size={16} weight="bold" />
                      Create Component
                    </Button>
                  </div>
                )}

                {!showAddCustomComponent && selectedComponent && (
                  <div className="mt-4 space-y-2 rounded-lg border border-border p-3">
                    <Label htmlFor="selected-component-label">
                      Selected Component Label
                    </Label>
                    <Input
                      id="selected-component-label"
                      value={selectedComponentLabelDraft}
                      disabled={isComponentEditorReadOnly}
                      onChange={(e) =>
                        handleSelectedComponentLabelChange(
                          selectedComponent.id,
                          e.target.value,
                        )
                      }
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        deleteCustomComponent(selectedComponent.id)
                      }
                      className="w-full text-destructive hover:text-destructive"
                    >
                      Delete Component
                    </Button>

                    {isSelectedComponentUsedInPages && (
                      <p className="text-xs text-muted-foreground">
                        Used in:{" "}
                        {pagesUsingSelectedComponent
                          .map((page) => page.title)
                          .join(", ")}
                      </p>
                    )}
                    {isComponentEditorReadOnly && (
                      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                          This component is read-only because it belongs to one
                          or more pages.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={enableSelectedComponentEditing}
                        >
                          Edit Component
                        </Button>
                      </div>
                    )}
                    {isSelectedComponentLabelBlank ? (
                      <p className="text-xs text-destructive">
                        The label cannot be blank.
                      </p>
                    ) : !isSelectedComponentLabelAvailable ? (
                      <p className="text-xs text-destructive">
                        &quot;{selectedComponentLabelDraft.trim()}&quot; is not
                        available.
                      </p>
                    ) : null}
                  </div>
                )}
              </Card>

              {!showAddCustomComponent && selectedComponent && (
                <div className="space-y-4">
                  <div
                    className={
                      isComponentEditorReadOnly
                        ? "space-y-4 opacity-60 pointer-events-none"
                        : "space-y-4"
                    }
                  >
                    {(() => {
                      const topLevelElementOptions = getAllowedElementOptions();
                      const selectedElementType = topLevelElementOptions.some(
                        (option) => option.id === newComponentElementTypeId,
                      )
                        ? newComponentElementTypeId
                        : (topLevelElementOptions[0]?.id ?? "element-text");

                      return (
                        <Card className="p-4">
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <h2 className="text-lg font-semibold font-mono">
                              Component
                            </h2>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                  >
                                    JSON
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                                  <DialogHeader className="shrink-0">
                                    <DialogTitle className="font-mono">
                                      Component JSON
                                    </DialogTitle>
                                  </DialogHeader>
                                  <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                                    {JSON.stringify(
                                      getExplicitComponentJson(
                                        selectedComponent,
                                      ),
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </DialogContent>
                              </Dialog>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                  >
                                    Code
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                                  <DialogHeader className="shrink-0">
                                    <DialogTitle className="font-mono">
                                      Component React Code
                                    </DialogTitle>
                                  </DialogHeader>
                                  <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                                    {getComponentPreviewCode(selectedComponent)}
                                  </pre>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                              <Label htmlFor="selected-component-api-enabled">
                                API Component
                              </Label>
                              <Switch
                                id="selected-component-api-enabled"
                                checked={selectedComponentApi.isApitComponent}
                                disabled={isComponentEditorReadOnly}
                                onCheckedChange={
                                  updateSelectedComponentApiEnabled
                                }
                              />
                            </div>

                            {selectedComponentApi.isApitComponent && (
                              <div className="space-y-4 rounded-md border border-border bg-secondary/30 p-3">
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold">
                                    Data Items
                                  </p>
                                  {selectedComponentDataBindings.length ===
                                  0 ? (
                                    <p className="text-xs text-muted-foreground">
                                      No data bindings found. Use values
                                      starting with data. in component elements.
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {selectedComponentDataBindings.map(
                                        (binding) => (
                                          <span
                                            key={binding}
                                            className="rounded-md border border-border bg-card px-2 py-1 text-xs font-mono"
                                          >
                                            {binding}
                                          </span>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2 rounded-md border border-border bg-card p-3">
                                  <p className="text-sm font-semibold">
                                    Request
                                  </p>
                                  <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                                    <Select
                                      value={
                                        selectedComponentApi.request.method
                                      }
                                      onValueChange={(
                                        value: ApiRequestMethod,
                                      ) =>
                                        updateSelectedComponentApiRequest({
                                          method: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger id="api-request-method">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {API_REQUEST_METHODS.map((method) => (
                                          <SelectItem
                                            key={method}
                                            value={method}
                                          >
                                            {method}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      id="api-request-url"
                                      placeholder="https://api.example.com/resource"
                                      value={apiRequestUrlDraft}
                                      onChange={(e) =>
                                        setApiRequestUrlDraft(e.target.value)
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Headers
                                      </Label>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addSelectedComponentApiHeader}
                                      >
                                        <Plus size={14} />
                                        Add Header
                                      </Button>
                                    </div>

                                    {selectedComponentApi.request.headers
                                      .length === 0 ? (
                                      <p className="text-xs text-muted-foreground">
                                        No headers configured.
                                      </p>
                                    ) : (
                                      <div className="space-y-2">
                                        {selectedComponentApi.request.headers.map(
                                          (header) => (
                                            <div
                                              key={header.id}
                                              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                                            >
                                              <Input
                                                placeholder="Header"
                                                value={header.key}
                                                onChange={(e) =>
                                                  updateSelectedComponentApiHeader(
                                                    header.id,
                                                    { key: e.target.value },
                                                  )
                                                }
                                              />
                                              <Input
                                                placeholder="Value"
                                                value={header.value}
                                                onChange={(e) =>
                                                  updateSelectedComponentApiHeader(
                                                    header.id,
                                                    { value: e.target.value },
                                                  )
                                                }
                                              />
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  removeSelectedComponentApiHeader(
                                                    header.id,
                                                  )
                                                }
                                                className="text-destructive hover:text-destructive"
                                              >
                                                <Trash2 size={16} />
                                              </Button>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="api-request-body">
                                      Body
                                    </Label>
                                    <textarea
                                      id="api-request-body"
                                      className="min-h-[110px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                                      placeholder='{"name":"Example"}'
                                      value={apiRequestBodyDraft}
                                      onChange={(e) =>
                                        setApiRequestBodyDraft(e.target.value)
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2 rounded-md border border-border bg-card p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold">
                                      Response
                                    </p>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={
                                        populateSelectedComponentFromApiResponse
                                      }
                                    >
                                      Populate
                                    </Button>
                                  </div>
                                  <textarea
                                    key={`api-response-${selectedComponent.id}`}
                                    ref={apiResponseJsonInputRef}
                                    id="api-response-test-json"
                                    className={`min-h-[140px] w-full rounded-md border bg-background px-3 py-2 text-sm font-mono ${selectedComponentApiResponseValidation.isValid ? "border-border" : "border-destructive"}`}
                                    placeholder='{"user":{"name":"Ada"}}'
                                    defaultValue={apiResponseJsonDraft}
                                    onChange={(e) =>
                                      scheduleApiResponseJsonDraftUpdate(
                                        e.target.value,
                                      )
                                    }
                                    onBlur={(e) => {
                                      const value = e.target.value;
                                      setApiResponseJsonDraft(value);
                                      updateSelectedComponentApiResponseJson(
                                        value,
                                      );
                                    }}
                                  />
                                  {!selectedComponentApiResponseValidation.isValid && (
                                    <p className="text-xs text-destructive">
                                      Invalid JSON:{" "}
                                      {
                                        selectedComponentApiResponseValidation.error
                                      }
                                    </p>
                                  )}

                                  {selectedComponentApiBindingStatus.missingList
                                    .length > 0 && (
                                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                                      <p className="text-xs font-semibold text-destructive">
                                        Missing data items:
                                      </p>
                                      <p className="mt-1 text-xs text-destructive">
                                        {selectedComponentApiBindingStatus.missingList.join(
                                          ", ",
                                        )}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="component-element-type">
                                  Element Type
                                </Label>
                                <Select
                                  value={selectedElementType}
                                  onValueChange={(value: ElementTypeId) =>
                                    setNewComponentElementTypeId(value)
                                  }
                                >
                                  <SelectTrigger id="component-element-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {topLevelElementOptions.map((option) => (
                                      <SelectItem
                                        key={option.id}
                                        value={option.id}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <Button
                              onClick={() =>
                                addComponentElement(
                                  selectedComponent.id,
                                  selectedElementType,
                                )
                              }
                              className="w-full gap-2"
                            >
                              <Plus size={18} />
                              Add Element
                            </Button>

                            {selectedComponent.elements.length > 0 && (
                              <>
                                <Separator />
                                {renderComponentElementEditors(
                                  selectedComponent.id,
                                  selectedComponent.elements,
                                )}
                              </>
                            )}
                          </div>
                        </Card>
                      );
                    })()}

                    <Card className="p-4">
                      <h2 className="text-lg font-semibold mb-4 font-mono">
                        Component Styles
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="comp-direction">Orientation</Label>
                          <Select
                            value={selectedComponent.styles.direction}
                            onValueChange={(value: ComponentDirection) =>
                              updateComponentStyles(selectedComponent.id, {
                                direction: value,
                              })
                            }
                          >
                            <SelectTrigger id="comp-direction">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="horizontal">
                                Horizontal
                              </SelectItem>
                              <SelectItem value="vertical">Vertical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-justify-content">
                            Justify Content
                          </Label>
                          <Select
                            value={selectedComponent.styles.justifyContent}
                            onValueChange={(
                              value: ComponentStyles["justifyContent"],
                            ) =>
                              updateComponentStyles(selectedComponent.id, {
                                justifyContent: value,
                              })
                            }
                          >
                            <SelectTrigger id="comp-justify-content">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="start">Start</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="end">End</SelectItem>
                              <SelectItem value="space-between">
                                Space Between
                              </SelectItem>
                              <SelectItem value="space-around">
                                Space Around
                              </SelectItem>
                              <SelectItem value="space-evenly">
                                Space Evenly
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-align-items">Align Items</Label>
                          <Select
                            value={selectedComponent.styles.alignItems}
                            onValueChange={(
                              value: ComponentStyles["alignItems"],
                            ) =>
                              updateComponentStyles(selectedComponent.id, {
                                alignItems: value,
                              })
                            }
                          >
                            <SelectTrigger id="comp-align-items">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="start">Start</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="end">End</SelectItem>
                              <SelectItem value="stretch">Stretch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-gap">Gap (px)</Label>
                          <Input
                            id="comp-gap"
                            type="number"
                            min={0}
                            max={50}
                            value={selectedComponent.styles.gap}
                            onChange={(e) =>
                              updateComponentStyles(selectedComponent.id, {
                                gap: clampFlexGap(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 sm:col-span-2">
                          <Label htmlFor="comp-overflow-scroll">
                            Overflow Scroll
                          </Label>
                          <Switch
                            id="comp-overflow-scroll"
                            checked={selectedComponent.styles.overflowScroll}
                            onCheckedChange={(checked) =>
                              updateComponentStyles(selectedComponent.id, {
                                overflowScroll: checked,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-min-width">Min Width (px)</Label>
                          <Input
                            id="comp-min-width"
                            type="number"
                            min={0}
                            max={4096}
                            value={selectedComponent.styles.minWidth}
                            onChange={(e) => {
                              const parsed = parseStyleNumber(e.target.value);
                              if (parsed === null) return;
                              updateComponentStyles(selectedComponent.id, {
                                minWidth: clampContainerDimension(parsed),
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-max-width">Max Width (px)</Label>
                          <Input
                            id="comp-max-width"
                            type="text"
                            value={componentMaxWidthInput}
                            placeholder="none"
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              setComponentMaxWidthInput(nextValue);

                              const parsed =
                                parseContainerDimensionOrNone(nextValue);
                              if (parsed === null) return;
                              updateComponentStyles(selectedComponent.id, {
                                maxWidth: parsed,
                              });
                            }}
                            onBlur={() => {
                              const parsed = parseContainerDimensionOrNone(
                                componentMaxWidthInput,
                              );
                              if (parsed === null) {
                                setComponentMaxWidthInput(
                                  selectedComponent.styles.maxWidth === 0
                                    ? "none"
                                    : String(selectedComponent.styles.maxWidth),
                                );
                                return;
                              }

                              setComponentMaxWidthInput(
                                parsed === 0 ? "none" : String(parsed),
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-min-height">
                            Min Height (px)
                          </Label>
                          <Input
                            id="comp-min-height"
                            type="number"
                            min={0}
                            max={4096}
                            value={selectedComponent.styles.minHeight}
                            onChange={(e) => {
                              const parsed = parseStyleNumber(e.target.value);
                              if (parsed === null) return;
                              updateComponentStyles(selectedComponent.id, {
                                minHeight: clampContainerDimension(parsed),
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-max-height">
                            Max Height (px)
                          </Label>
                          <Input
                            id="comp-max-height"
                            type="text"
                            value={componentMaxHeightInput}
                            placeholder="none"
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              setComponentMaxHeightInput(nextValue);

                              const parsed =
                                parseContainerDimensionOrNone(nextValue);
                              if (parsed === null) return;
                              updateComponentStyles(selectedComponent.id, {
                                maxHeight: parsed,
                              });
                            }}
                            onBlur={() => {
                              const parsed = parseContainerDimensionOrNone(
                                componentMaxHeightInput,
                              );
                              if (parsed === null) {
                                setComponentMaxHeightInput(
                                  selectedComponent.styles.maxHeight === 0
                                    ? "none"
                                    : String(
                                        selectedComponent.styles.maxHeight,
                                      ),
                                );
                                return;
                              }

                              setComponentMaxHeightInput(
                                parsed === 0 ? "none" : String(parsed),
                              );
                            }}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="component-padding">
                              <AccordionTrigger className="font-mono text-sm">
                                Padding
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-padding-all">
                                      Padding (All Sides)
                                    </Label>
                                    <Input
                                      id="comp-padding-all"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedComponent.styles.paddingTop ===
                                          selectedComponent.styles
                                            .paddingBottom &&
                                        selectedComponent.styles.paddingTop ===
                                          selectedComponent.styles
                                            .paddingLeft &&
                                        selectedComponent.styles.paddingTop ===
                                          selectedComponent.styles.paddingRight
                                          ? String(
                                              selectedComponent.styles
                                                .paddingTop,
                                            )
                                          : ""
                                      }
                                      onChange={(e) =>
                                        updateComponentPaddingAll(
                                          selectedComponent.id,
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-padding-x">
                                      Horizontal Padding (px)
                                    </Label>
                                    <Input
                                      id="comp-padding-x"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={getAxisInputValue(
                                        selectedComponent.styles.paddingLeft,
                                        selectedComponent.styles.paddingRight,
                                      )}
                                      onChange={(e) =>
                                        updateComponentPaddingAxis(
                                          selectedComponent.id,
                                          "x",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-padding-y">
                                      Vertical Padding (px)
                                    </Label>
                                    <Input
                                      id="comp-padding-y"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={getAxisInputValue(
                                        selectedComponent.styles.paddingTop,
                                        selectedComponent.styles.paddingBottom,
                                      )}
                                      onChange={(e) =>
                                        updateComponentPaddingAxis(
                                          selectedComponent.id,
                                          "y",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-padding-top">
                                      Padding Top (px)
                                    </Label>
                                    <Input
                                      id="comp-padding-top"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedComponent.styles.paddingTop
                                      }
                                      onChange={(e) =>
                                        updateComponentPaddingSide(
                                          selectedComponent.id,
                                          selectedComponent.styles,
                                          "top",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-padding-bottom">
                                      Padding Bottom (px)
                                    </Label>
                                    <Input
                                      id="comp-padding-bottom"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedComponent.styles.paddingBottom
                                      }
                                      onChange={(e) =>
                                        updateComponentPaddingSide(
                                          selectedComponent.id,
                                          selectedComponent.styles,
                                          "bottom",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-padding-left">
                                      Padding Left (px)
                                    </Label>
                                    <Input
                                      id="comp-padding-left"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedComponent.styles.paddingLeft
                                      }
                                      onChange={(e) =>
                                        updateComponentPaddingSide(
                                          selectedComponent.id,
                                          selectedComponent.styles,
                                          "left",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-padding-right">
                                      Padding Right (px)
                                    </Label>
                                    <Input
                                      id="comp-padding-right"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedComponent.styles.paddingRight
                                      }
                                      onChange={(e) =>
                                        updateComponentPaddingSide(
                                          selectedComponent.id,
                                          selectedComponent.styles,
                                          "right",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                        <div className="sm:col-span-2">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="component-margin">
                              <AccordionTrigger className="font-mono text-sm">
                                Margin
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-margin-all">
                                      Margin (All Sides)
                                    </Label>
                                    <Input
                                      id="comp-margin-all"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedComponent.styles.marginTop ===
                                          selectedComponent.styles
                                            .marginBottom &&
                                        selectedComponent.styles.marginTop ===
                                          selectedComponent.styles.marginLeft &&
                                        selectedComponent.styles.marginTop ===
                                          selectedComponent.styles.marginRight
                                          ? String(
                                              selectedComponent.styles
                                                .marginTop,
                                            )
                                          : ""
                                      }
                                      onChange={(e) =>
                                        updateComponentMarginAll(
                                          selectedComponent.id,
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-margin-x">
                                      Horizontal Margin (px)
                                    </Label>
                                    <Input
                                      id="comp-margin-x"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={getAxisInputValue(
                                        selectedComponent.styles.marginLeft,
                                        selectedComponent.styles.marginRight,
                                      )}
                                      onChange={(e) =>
                                        updateComponentMarginAxis(
                                          selectedComponent.id,
                                          "x",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-margin-y">
                                      Vertical Margin (px)
                                    </Label>
                                    <Input
                                      id="comp-margin-y"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={getAxisInputValue(
                                        selectedComponent.styles.marginTop,
                                        selectedComponent.styles.marginBottom,
                                      )}
                                      onChange={(e) =>
                                        updateComponentMarginAxis(
                                          selectedComponent.id,
                                          "y",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-margin-top">
                                      Margin Top (px)
                                    </Label>
                                    <Input
                                      id="comp-margin-top"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={selectedComponent.styles.marginTop}
                                      onChange={(e) =>
                                        updateComponentMarginSide(
                                          selectedComponent.id,
                                          selectedComponent.styles,
                                          "top",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-margin-bottom">
                                      Margin Bottom (px)
                                    </Label>
                                    <Input
                                      id="comp-margin-bottom"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedComponent.styles.marginBottom
                                      }
                                      onChange={(e) =>
                                        updateComponentMarginSide(
                                          selectedComponent.id,
                                          selectedComponent.styles,
                                          "bottom",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-margin-left">
                                      Margin Left (px)
                                    </Label>
                                    <Input
                                      id="comp-margin-left"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedComponent.styles.marginLeft
                                      }
                                      onChange={(e) =>
                                        updateComponentMarginSide(
                                          selectedComponent.id,
                                          selectedComponent.styles,
                                          "left",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comp-margin-right">
                                      Margin Right (px)
                                    </Label>
                                    <Input
                                      id="comp-margin-right"
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={
                                        selectedComponent.styles.marginRight
                                      }
                                      onChange={(e) =>
                                        updateComponentMarginSide(
                                          selectedComponent.id,
                                          selectedComponent.styles,
                                          "right",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-background-color">
                            Background Color
                          </Label>
                          <Button
                            id="comp-background-color"
                            type="button"
                            variant="outline"
                            className="w-full justify-between font-mono"
                            onClick={() =>
                              openColorPicker(
                                {
                                  scope: "component",
                                  componentId: selectedComponent.id,
                                  field: "backgroundColor",
                                  styles: selectedComponent.styles,
                                },
                                selectedComponent.styles.backgroundColor,
                              )
                            }
                          >
                            <span>
                              {selectedComponent.styles.backgroundColor}
                            </span>
                            <span
                              className="h-4 w-4 rounded border border-border"
                              style={{
                                backgroundColor: normalizeHexColor(
                                  selectedComponent.styles.backgroundColor,
                                  "#000000",
                                ),
                              }}
                            />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-border-color">
                            Border Color
                          </Label>
                          <Button
                            id="comp-border-color"
                            type="button"
                            variant="outline"
                            className="w-full justify-between font-mono"
                            onClick={() =>
                              openColorPicker(
                                {
                                  scope: "component",
                                  componentId: selectedComponent.id,
                                  field: "borderColor",
                                  styles: selectedComponent.styles,
                                },
                                selectedComponent.styles.borderColor,
                              )
                            }
                          >
                            <span>{selectedComponent.styles.borderColor}</span>
                            <span
                              className="h-4 w-4 rounded border border-border"
                              style={{
                                backgroundColor: normalizeHexColor(
                                  selectedComponent.styles.borderColor,
                                  "#000000",
                                ),
                              }}
                            />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-border-radius">
                            Border Radius
                          </Label>
                          <Input
                            id="comp-border-radius"
                            type="range"
                            min={0}
                            max={64}
                            value={selectedComponent.styles.borderRadius}
                            onChange={(e) =>
                              updateComponentStyles(selectedComponent.id, {
                                borderRadius: clampContainerBorderRadius(
                                  e.target.value,
                                ),
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {selectedComponent.styles.borderRadius}px
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comp-border-width">
                            Border Width (px)
                          </Label>
                          <Input
                            id="comp-border-width"
                            type="number"
                            min={0}
                            max={16}
                            value={selectedComponent.styles.borderWidth}
                            onChange={(e) =>
                              updateComponentStyles(selectedComponent.id, {
                                borderWidth: clampContainerBorderWidth(
                                  e.target.value,
                                ),
                              })
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-0 overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold font-mono">
                        Component Preview
                      </h2>
                      <div className="flex items-center gap-2">
                        {selectedComponent && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button type="button" variant="outline" size="sm">
                                JSON
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                              <DialogHeader className="shrink-0">
                                <DialogTitle className="font-mono">
                                  Component Preview JSON
                                </DialogTitle>
                              </DialogHeader>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard
                                      .writeText(
                                        JSON.stringify(
                                          getExplicitComponentJson(
                                            selectedComponent,
                                          ),
                                          null,
                                          2,
                                        ),
                                      )
                                      .then(() =>
                                        toast.success(
                                          "JSON copied to clipboard",
                                        ),
                                      )
                                      .catch(() =>
                                        toast.error("Failed to copy JSON"),
                                      );
                                  }}
                                >
                                  Copy JSON
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const json = JSON.stringify(
                                      getExplicitComponentJson(
                                        selectedComponent,
                                      ),
                                      null,
                                      2,
                                    );
                                    const blob = new Blob([json], {
                                      type: "application/json",
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `${selectedComponent.label || "component"}-preview.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                >
                                  Download JSON
                                </Button>
                              </div>
                              <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                                {JSON.stringify(
                                  getExplicitComponentJson(selectedComponent),
                                  null,
                                  2,
                                )}
                              </pre>
                            </DialogContent>
                          </Dialog>
                        )}
                        <div className="flex items-center gap-2 rounded-md bg-muted p-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              themePreviewMode === "light" ? "default" : "ghost"
                            }
                            onClick={() => setThemePreviewMode("light")}
                            className="gap-1 h-7 text-xs"
                          >
                            Light
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              themePreviewMode === "dark" ? "default" : "ghost"
                            }
                            onClick={() => setThemePreviewMode("dark")}
                            className="gap-1 h-7 text-xs"
                          >
                            Dark
                          </Button>
                        </div>
                      </div>
                    </div>
                    {!selectedComponent ? (
                      <p className="text-sm text-muted-foreground p-4">
                        No component selected for preview.
                      </p>
                    ) : (
                      (() => {
                        const justifyClass = getEffectiveFlexJustifyClass(
                          selectedComponent.styles.justifyContent,
                          selectedComponent.elements.length,
                        );
                        const overflowStyle = getFlexOverflowStyle(
                          selectedComponent.styles.direction,
                          selectedComponent.styles.overflowScroll,
                        );

                        return (
                          <div
                            className={`flex w-full ${selectedComponent.styles.direction === "vertical" ? "flex-col" : "flex-row"} ${selectedComponent.styles.overflowScroll ? "" : "flex-wrap"} ${getFlexAlignItemsClass(selectedComponent.styles.alignItems)} ${justifyClass}`}
                            style={{
                              gap: `${selectedComponent.styles.gap}px`,
                              minWidth:
                                selectedComponent.styles.minWidth > 0
                                  ? `${selectedComponent.styles.minWidth}px`
                                  : undefined,
                              maxWidth:
                                selectedComponent.styles.maxWidth > 0
                                  ? `${selectedComponent.styles.maxWidth}px`
                                  : undefined,
                              minHeight:
                                selectedComponent.styles.minHeight > 0
                                  ? `${selectedComponent.styles.minHeight}px`
                                  : undefined,
                              maxHeight:
                                selectedComponent.styles.maxHeight > 0
                                  ? `${selectedComponent.styles.maxHeight}px`
                                  : undefined,
                              paddingLeft: `${selectedComponent.styles.paddingLeft}px`,
                              paddingRight: `${selectedComponent.styles.paddingRight}px`,
                              paddingTop: `${selectedComponent.styles.paddingTop}px`,
                              paddingBottom: `${selectedComponent.styles.paddingBottom}px`,
                              marginLeft: `${selectedComponent.styles.marginLeft}px`,
                              marginRight: `${selectedComponent.styles.marginRight}px`,
                              marginTop: `${selectedComponent.styles.marginTop}px`,
                              marginBottom: `${selectedComponent.styles.marginBottom}px`,
                              overflowX: overflowStyle.overflowX,
                              overflowY: overflowStyle.overflowY,
                              backgroundColor: resolveColor(
                                selectedComponent.styles.backgroundColor,
                              ),
                              borderColor: resolveColor(
                                selectedComponent.styles.borderColor,
                              ),
                              borderRadius: `${selectedComponent.styles.borderRadius}px`,
                              borderWidth: `${selectedComponent.styles.borderWidth}px`,
                              borderStyle:
                                selectedComponent.styles.borderWidth > 0
                                  ? "solid"
                                  : "none",
                            }}
                          >
                            {selectedComponent.elements.map((element) => (
                              <div
                                key={element.instanceId}
                                className={`min-w-0 ${isContainerElement(element) ? "flex self-stretch" : elementNeedsFullWidth(element) ? "w-full" : ""}`}
                                style={
                                  element.flex === null ||
                                  element.flex === undefined
                                    ? undefined
                                    : element.flex === 0
                                      ? { flex: "0 0 auto" }
                                      : {
                                          flex: `${element.flex} ${element.flex} 0%`,
                                        }
                                }
                              >
                                {renderComponentElementPreview(
                                  element,
                                  selectedComponent.id,
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    )}
                  </Card>
                </div>
              )}
            </div>
          )}
          {activeTab === "theme" && (
            <div className="space-y-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold font-mono">
                    Color Theme
                  </h2>
                  <div className="flex items-center gap-2 rounded-md bg-muted p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        themePreviewMode === "light" ? "default" : "ghost"
                      }
                      onClick={() => setThemePreviewMode("light")}
                      className="gap-1 h-7 text-xs"
                    >
                      Light
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        themePreviewMode === "dark" ? "default" : "ghost"
                      }
                      onClick={() => setThemePreviewMode("dark")}
                      className="gap-1 h-7 text-xs"
                    >
                      Dark
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left font-semibold pb-2 w-28">
                          Variable
                        </th>
                        <th className="text-center font-semibold pb-2 px-2">
                          Light Mode
                        </th>
                        <th className="text-center font-semibold pb-2 px-2">
                          Dark Mode
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {THEME_VARIABLE_KEYS.map((variable) => (
                        <tr
                          key={variable}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-3 font-mono text-xs font-semibold text-muted-foreground">
                            {THEME_VARIABLE_LABELS[variable]}
                          </td>
                          {(["light", "dark"] as ThemePreviewMode[]).map(
                            (mode) => (
                              <td key={mode} className="py-3 px-2 text-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full justify-between font-mono text-xs gap-2"
                                  onClick={() =>
                                    openColorPicker(
                                      {
                                        scope: "theme",
                                        variable,
                                        mode,
                                      },
                                      colorTheme[variable][mode],
                                    )
                                  }
                                >
                                  <span className="truncate">
                                    {colorTheme[variable][mode]}
                                  </span>
                                  <span
                                    className="h-4 w-4 rounded border border-border shrink-0"
                                    style={{
                                      backgroundColor: normalizeHexColor(
                                        colorTheme[variable][mode],
                                        "#000000",
                                      ),
                                    }}
                                  />
                                </Button>
                              </td>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setColorTheme(DEFAULT_COLOR_THEME)}
                    className="text-xs"
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <h2 className="text-lg font-semibold font-mono mb-3">
                  Preview
                </h2>
                <div
                  className="rounded-lg p-4 space-y-3"
                  style={{
                    backgroundColor: resolveColor(
                      colorTheme.background[themePreviewMode],
                    ),
                    border: `1px solid ${resolveColor(colorTheme.border[themePreviewMode])}`,
                  }}
                >
                  {THEME_VARIABLE_KEYS.map((variable) => (
                    <div
                      key={variable}
                      className="flex items-center justify-between rounded-md px-3 py-2"
                      style={{
                        backgroundColor:
                          variable === "background"
                            ? "transparent"
                            : colorTheme[variable][themePreviewMode],
                        border: `1px solid ${colorTheme.border[themePreviewMode]}`,
                      }}
                    >
                      <span
                        className="text-xs font-mono font-semibold"
                        style={{
                          color:
                            variable === "background"
                              ? colorTheme.primary[themePreviewMode]
                              : colorTheme.background[themePreviewMode],
                        }}
                      >
                        {THEME_VARIABLE_LABELS[variable]}
                      </span>
                      <span
                        className="text-xs font-mono opacity-80"
                        style={{
                          color:
                            variable === "background"
                              ? colorTheme.secondary[themePreviewMode]
                              : colorTheme.background[themePreviewMode],
                        }}
                      >
                        {colorTheme[variable][themePreviewMode]}
                      </span>
                    </div>
                  ))}
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
