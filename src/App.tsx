import { useState, useEffect } from "react";
import type { ComponentType } from "react";
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
  Home,
  Trash2,
  ToggleLeft,
  Box,
  ArrowUp,
  ArrowDown,
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
  customComponents: AppComponent[];
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
  components: AppComponent[];
}

interface ExportPrebuiltConfig {
  components: ExportedComponentDefinition[];
  pages: ExportedPrebuiltPage[];
  elements: PrebuiltElementDef[];
}

type ElementTypeId =
  | "element-text"
  | "element-toggle"
  | "element-button"
  | "element-select"
  | "element-text-input"
  | "element-icon"
  | "element-image"
  | "element-vertical-container";

interface BaseComponentElement {
  instanceId: string;
}

interface TextElementStyles {
  alignment: "left" | "center" | "right";
  size: number;
  isBold: boolean;
  isItalic: boolean;
  isLabel: boolean;
}

interface ToggleElementStyles {
  position: "left" | "center" | "right";
}

interface IconElementStyles {
  size: number;
}

type ElementDimension = number | string;
type ButtonWidth = number | "full" | "auto";

interface ButtonElementStyles {
  width: ButtonWidth;
}

interface TextInputElementStyles {
  alignment: "left" | "center" | "right";
  width: ButtonWidth;
}

interface ImageElementStyles {
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
  justifyContent: FlexJustifyContent;
  alignItems: FlexAlignItems;
  gap: number;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  borderWidth: number;
}

interface TextComponentElement extends BaseComponentElement {
  elementTypeId: "element-text";
  value: string;
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
  elementTypeId: "element-vertical-container";
  elements: ComponentElement[];
  styles: ContainerElementStyles;
}

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
  justifyContent: FlexJustifyContent;
  alignItems: FlexAlignItems;
  gap: number;
  paddingX: number;
  paddingY: number;
  marginX: number;
  marginY: number;
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
      scope: "vertical-container";
      componentId: string;
      elementId: string;
      field: ContainerColorField;
      styles: ContainerElementStyles;
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
  };
  textHint?: string;
  sizing?: "contain" | "cover";
  src?: string;
  buttonLabel?: string;
  highlightOnHover?: boolean;
  isGhost?: boolean;
}

type DrawerState = "closed" | "icons-only" | "open";
type ActiveTab = "navigation" | "pages" | "components";
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

export const PREBUILT_ELEMENTS: PrebuiltElementDef[] = [
  {
    id: "element-text",
    label: "Text",
    value: "",
    styles: {
      alignment: "center",
      size: 3,
      fontWeight: 400,
      isBold: false,
      isItalic: false,
      isLabel: false,
    },
  },
  {
    id: "element-toggle",
    label: "Toggle Button",
    value: false,
    styles: { position: "center" },
  },
  {
    id: "element-button",
    label: "Button",
    buttonLabel: "Button",
    highlightOnHover: true,
    isGhost: false,
    styles: { width: "full", alignment: "center" },
  },
  {
    id: "element-select",
    label: "Select Dropdown",
    values: ["Value One", "Value Two"],
    showDefaultLabel: true,
    defaultLabel: "Please Select",
  },
  {
    id: "element-text-input",
    label: "Text Input",
    textHint: "",
    value: "",
    styles: { width: "full" },
  },
  {
    id: "element-icon",
    label: "Icon",
    styles: { alignment: "center", size: 24 },
  },
  {
    id: "element-image",
    label: "Image",
    styles: {
      alignment: "center",
      sizing: "contain",
      containerWidth: "auto",
      containerHeight: "auto",
    },
    src: "https://placehold.co/600x400",
  },
];

const ELEMENT_TYPE_IDS = new Set<string>(PREBUILT_ELEMENTS.map((e) => e.id));

const DEFAULT_IMAGE_SRC = "https://placehold.co/600x400";

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
  return typeof label === "string" && label.trim().length > 0
    ? label
    : "Button";
};

const getDefaultButtonHighlightOnHover = (): boolean => {
  const value = getPrebuiltElementDef("element-button")?.highlightOnHover;
  return typeof value === "boolean" ? value : true;
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
    width: normalizeButtonWidth(styles?.width),
  };
};

const getDefaultSelectValues = (): string[] => {
  const values = getPrebuiltElementDef("element-select")?.values;
  if (!Array.isArray(values) || values.length === 0) {
    return ["Value One", "Value Two"];
  }

  return values.map((value, index) =>
    typeof value === "string" && value.trim().length > 0
      ? value
      : `Value ${index + 1}`,
  );
};

const getDefaultTextInputHint = (): string => {
  const hint = getPrebuiltElementDef("element-text-input")?.textHint;
  return typeof hint === "string" ? hint : "";
};

const getDefaultTextInputStyles = (): TextInputElementStyles => {
  const styles = getPrebuiltElementDef("element-text-input")?.styles;
  return {
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
  return typeof value === "string" && value.trim().length > 0 ? value : "Home";
};

const getDefaultIconStyles = (): IconElementStyles => {
  const styles = getPrebuiltElementDef("element-icon")?.styles;
  return {
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
    sizing:
      styles?.sizing === "contain" ||
      styles?.sizing === "cover"
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

const clampContainerBorderRadius = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 8;
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
  const toHex = (value: number) => clampRgbChannel(value).toString(16).padStart(2, "0");
  const alphaHex = clampRgbChannel(a).toString(16).padStart(2, "0");
  return includeAlpha
    ? `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`
    : `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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

const getDefaultComponentStyles = (): ComponentStyles => ({
  justifyContent: "space-between",
  alignItems: "start",
  gap: 0,
  paddingX: 0,
  paddingY: 0,
  marginX: 0,
  marginY: 0,
  backgroundColor: "#ffffff00",
  borderColor: "#d4d4d8",
  borderRadius: 8,
  borderWidth: 0,
});

const getDefaultContainerStyles = (): ContainerElementStyles => {
  const styles = getPrebuiltElementDef("element-vertical-container")?.styles;
  return {
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
    gap: clampFlexGap(styles?.gap),
    backgroundColor: normalizeHexColor(styles?.backgroundColor, "#ffffff00"),
    borderColor: normalizeHexColor(styles?.borderColor, "#d4d4d8"),
    borderRadius: clampContainerBorderRadius(styles?.borderRadius),
    borderWidth: clampContainerBorderWidth(styles?.borderWidth),
  };
};

const getDefaultImageSrc = (): string => {
  const src = getPrebuiltElementDef("element-image")?.src;
  return typeof src === "string" && src.trim().length > 0
    ? src
    : DEFAULT_IMAGE_SRC;
};

const normalizeSelectValues = (rawValues: unknown): string[] => {
  const fallbackValues = getDefaultSelectValues();
  if (!Array.isArray(rawValues)) {
    return fallbackValues;
  }

  return rawValues.map((value, index) =>
    typeof value === "string" && value.trim().length > 0
      ? value
      : (fallbackValues[index] ?? `Value ${index + 1}`),
  );
};

const normalizeElementFromRaw = (raw: unknown): ComponentElement | null => {
  if (!raw || typeof raw !== "object") return null;

  const entry = raw as Record<string, unknown>;
  const elementTypeId =
    entry.elementTypeId === "element-container"
      ? "element-vertical-container"
      : entry.elementTypeId;
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

  switch (elementTypeId as ElementTypeId) {
    case "element-text": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultTextStyles();

      return {
        instanceId,
        elementTypeId: "element-text",
        value: typeof entry.value === "string" ? entry.value : "",
        styles: {
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
        elementTypeId: "element-toggle",
        defaultValue:
          typeof entry.defaultValue === "boolean"
            ? entry.defaultValue
            : typeof entry.value === "boolean"
              ? entry.value
              : getDefaultToggleValue(),
        styles: {
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

      return {
        instanceId,
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
          width: normalizeButtonWidth(
            rawStyles.width ?? entry.width ?? getDefaultButtonStyles().width,
          ),
        },
      };
    }
    case "element-select":
      return {
        instanceId,
        elementTypeId: "element-select",
        values: normalizeSelectValues(entry.values),
      };
    case "element-text-input": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultTextInputStyles();

      return {
        instanceId,
        elementTypeId: "element-text-input",
        textHint:
          typeof entry.textHint === "string" && entry.textHint.trim().length > 0
            ? entry.textHint
            : getDefaultTextInputHint(),
        value: typeof entry.value === "string" ? entry.value : "",
        styles: {
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
        elementTypeId: "element-icon",
        value:
          typeof entry.value === "string" && entry.value.trim().length > 0
            ? entry.value
            : getDefaultIconValue(),
        styles: {
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
        elementTypeId: "element-image",
        styles: {
          sizing:
            rawStyles.sizing === "contain" ||
            rawStyles.sizing === "cover"
              ? rawStyles.sizing
              : entry.sizing === "contain" ||
                  entry.sizing === "cover"
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
    case "element-vertical-container": {
      const rawStyles =
        entry.styles && typeof entry.styles === "object"
          ? (entry.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultContainerStyles();

      return {
        instanceId,
        elementTypeId: "element-vertical-container",
        elements: Array.isArray(entry.elements)
          ? entry.elements
              .map((child) => normalizeElementFromRaw(child))
              .filter((child): child is ComponentElement => Boolean(child))
          : [],
        styles: {
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
          gap: clampFlexGap(rawStyles.gap ?? entry.gap ?? defaultStyles.gap),
          backgroundColor: normalizeHexColor(
            rawStyles.backgroundColor ?? entry.backgroundColor,
            defaultStyles.backgroundColor,
          ),
          borderColor: normalizeHexColor(
            rawStyles.borderColor ?? entry.borderColor,
            defaultStyles.borderColor,
          ),
          borderRadius: clampContainerBorderRadius(
            rawStyles.borderRadius ?? entry.borderRadius ?? defaultStyles.borderRadius,
          ),
          borderWidth: clampContainerBorderWidth(
            rawStyles.borderWidth ?? entry.borderWidth ?? defaultStyles.borderWidth,
          ),
        },
      };
    }
  }
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
    case "element-vertical-container":
      return {
        instanceId,
        elementTypeId: "element-vertical-container",
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

const toCssDimension = (value: number | string): string =>
  typeof value === "number" ? `${value}px` : value === "full" ? "100%" : value;

const getFlexJustifyClass = (value: FlexJustifyContent): string => {
  if (value === "center") return "justify-center";
  if (value === "end") return "justify-end";
  if (value === "space-around") return "justify-around";
  if (value === "space-evenly") return "justify-evenly";
  if (value === "space-between") return "justify-between";
  return "justify-start";
};

const getFlexAlignItemsClass = (value: FlexAlignItems): string => {
  if (value === "center") return "items-center";
  if (value === "end") return "items-end";
  if (value === "stretch") return "items-stretch";
  return "items-start";
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
    .map(([key, value]) => `${indent}    ${key}: ${formatJsxStyleValue(value as string | number)},`)
    .join("\n")}\n${indent}  }}`;
};

const isTransparentHex = (value: string): boolean =>
  /^#(?:0000|ffffff00)$/i.test(value);

const isContainerElement = (
  element: ComponentElement,
): element is ContainerComponentElement =>
  element.elementTypeId === "element-vertical-container";

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
  const localIndex = elements.findIndex((element) => element.instanceId === instanceId);
  if (localIndex !== -1) {
    const targetIndex = direction === "up" ? localIndex - 1 : localIndex + 1;
    if (targetIndex < 0 || targetIndex >= elements.length) {
      return elements;
    }

    const next = [...elements];
    [next[localIndex], next[targetIndex]] = [next[targetIndex], next[localIndex]];
    return next;
  }

  return elements.map((element) =>
    isContainerElement(element)
      ? {
          ...element,
          elements: reorderElementInTree(element.elements, instanceId, direction),
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

const DEFAULT_CONFIG: AppConfig = {
  id: crypto.randomUUID(),
  appName: "",
  components: DEFAULT_SETTING_COMPONENTS,
  customComponents: [],
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
    customComponents?: unknown;
  };

  const componentsRaw = maybeConfig.components;
  const legacyComponentsObject =
    componentsRaw &&
    typeof componentsRaw === "object" &&
    !Array.isArray(componentsRaw)
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

  const settingComponentTypesRaw =
    legacyComponentsObject?.settingComponentTypes;

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
            (settingComponentTypesRaw as Record<SettingComponentType, unknown>)[
              type
            ],
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
    componentsFromArray.length > 0
      ? componentsFromArray
      : componentsFromLegacyMap,
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

  const navPagesRaw =
    navRoot?.navigationPages ?? navRoot?.pages ?? navRoot?.items;

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

    const hasExplicitId =
      typeof page.id === "string" && page.id.trim().length > 0;
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
    arrayPages.some((page) => page.kind === "prebuilt" && page.id === "home") ||
    Boolean(objectHomePrebuilt);

  const normalizedPages: AppPage[] = [
    ...(hasSettings ? [] : [fallbackSettingsPage]),
    ...(hasHome ? [] : [fallbackHomePage]),
    ...arrayPages,
    ...(objectHomePrebuilt ? [objectHomePrebuilt] : []),
    ...(objectPrebuilt ? [objectPrebuilt] : []),
    ...objectCustomPages,
  ];

  const normalizeCustomComponents = (raw: unknown): AppComponent[] => {
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const comp = entry as Record<string, unknown>;
      if (typeof comp.label !== "string" || !comp.label.trim()) return [];
      const rawStyles =
        comp.styles && typeof comp.styles === "object"
          ? (comp.styles as Record<string, unknown>)
          : {};
      const defaultStyles = getDefaultComponentStyles();
      return [
        {
          id:
            typeof comp.id === "string" && comp.id.trim()
              ? comp.id
              : crypto.randomUUID(),
          label: comp.label,
          elements: Array.isArray(comp.elements)
            ? (comp.elements as unknown[])
                .map((el) => normalizeElementFromRaw(el))
                .filter((el): el is ComponentElement => Boolean(el))
            : [],
          styles: {
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
            gap: clampFlexGap(rawStyles.gap ?? defaultStyles.gap),
            paddingX: clampComponentSpacing(rawStyles.paddingX),
            paddingY: clampComponentSpacing(rawStyles.paddingY),
            marginX: clampComponentSpacing(rawStyles.marginX),
            marginY: clampComponentSpacing(rawStyles.marginY),
            backgroundColor: normalizeHexColor(
              rawStyles.backgroundColor,
              defaultStyles.backgroundColor,
            ),
            borderColor: normalizeHexColor(
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
    components: normalizedComponents,
    customComponents: normalizeCustomComponents(maybeConfig.customComponents),
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
  const [appNameDraft, setAppNameDraft] = useState<string>(
    () => config.appName,
  );
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
  const [componentCodeDialogOpen, setComponentCodeDialogOpen] = useState(false);
  const [componentJsonDialogOpen, setComponentJsonDialogOpen] = useState(false);
  const [colorPickerDialogOpen, setColorPickerDialogOpen] = useState(false);
  const [colorEditTarget, setColorEditTarget] = useState<ColorEditTarget | null>(null);
  const [colorDraftHex, setColorDraftHex] = useState("#000000");
  const [colorDraftRed, setColorDraftRed] = useState(0);
  const [colorDraftGreen, setColorDraftGreen] = useState(0);
  const [colorDraftBlue, setColorDraftBlue] = useState(0);
  const [colorDraftAlpha, setColorDraftAlpha] = useState(255);
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
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [showAddCustomComponent, setShowAddCustomComponent] = useState(false);
  const [newCustomComponentLabel, setNewCustomComponentLabel] = useState("");
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
  const customComponents = Array.isArray(safeConfig.customComponents)
    ? safeConfig.customComponents
    : [];
  const selectedComponent =
    customComponents.find((c) => c.id === selectedComponentId) ?? null;
  const exportPrebuiltConfig: ExportPrebuiltConfig = {
    components: safeConfig.components.map((component) => ({
      id: component.id,
      type: component.type,
      label: component.label,
    })),
    pages: safePages
      .filter(
        (page): page is PrebuiltSettingsPage | PrebuiltHomePage =>
          page.kind === "prebuilt",
      )
      .map((page) => ({
        id: page.id,
        title: page.title,
        items: page.items,
      })),
    elements: PREBUILT_ELEMENTS,
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
    components: customComponents,
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

  useEffect(() => {
    if (customComponents.length === 0) {
      setSelectedComponentId(null);
      return;
    }

    const exists = customComponents.some((c) => c.id === selectedComponentId);
    if (!exists) {
      setSelectedComponentId(customComponents[0].id);
    }
  }, [selectedComponentId, customComponents]);

  const updateCustomComponents = (
    transform: (components: AppComponent[]) => AppComponent[],
  ) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG;
      return {
        ...base,
        customComponents: transform(
          Array.isArray(base.customComponents) ? base.customComponents : [],
        ),
      };
    });
  };

  const addCustomComponent = () => {
    if (!newCustomComponentLabel.trim()) {
      toast.error("Please enter a component label");
      return;
    }

    const newComponent = createDefaultComponent(newCustomComponentLabel.trim());
    updateCustomComponents((components) => [...components, newComponent]);
    setSelectedComponentId(newComponent.id);
    setShowAddCustomComponent(false);
    setNewCustomComponentLabel("");
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
    const newElement = createDefaultComponentElement(typeId);
    updateCustomComponents((components) =>
      components.map((comp) =>
        comp.id !== componentId
          ? comp
          : {
              ...comp,
              elements: parentInstanceId
                ? addChildElementToTree(comp.elements, parentInstanceId, newElement)
                : [...comp.elements, newElement],
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
              elements: updateElementTree(comp.elements, instanceId, (element) =>
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

  const syncColorFromRgb = (
    channel: "r" | "g" | "b",
    value: string,
  ) => {
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
    const normalized = normalizeHexColor(colorDraftHex, fallbackHex);
    const parsed = hexToRgba(normalized) ?? {
      r: colorDraftRed,
      g: colorDraftGreen,
      b: colorDraftBlue,
      a: colorDraftAlpha,
    };
    const useHex8 = normalized.trim().length === 9 || parsed.a < 255;
    const finalColor = rgbaToHex(parsed.r, parsed.g, parsed.b, parsed.a, useHex8);

    if (colorEditTarget.scope === "component") {
      updateComponentStyles(colorEditTarget.componentId, {
        ...colorEditTarget.styles,
        [colorEditTarget.field]: finalColor,
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
      const buttonStyleBlock =
        element.styles.width === "auto"
          ? ""
          : formatJsxStyleBlock(
              [["width", element.styles.width === "full" ? "100%" : `${element.styles.width}px`]],
              `${indent}`,
            );
      const buttonClassName =
        element.styles.width === "full" ? ' className="w-full"' : ' className="w-auto"';
      const variantProp = element.isGhost ? ' variant="ghost"' : "";

      return `${indent}<Button${variantProp}${buttonClassName}${buttonStyleBlock}>${element.label}</Button>`;
    }

    if (element.elementTypeId === "element-select") {
      const options = element.values.filter((option) => option.trim().length > 0);
      const renderedOptions = (options.length > 0 ? options : ["No values"]).map(
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
        [["width", element.styles.width === "full" ? "100%" : `${element.styles.width}px`]],
        `${indent}  `,
      );
      const inputClassName =
        element.styles.width === "full" ? ' className="w-full"' : "";

      return `${indent}<div className=${JSON.stringify(`flex w-full ${alignmentClass}`)}>\n${indent}  <Input${inputClassName}${inputStyleBlock} defaultValue=${JSON.stringify(element.value)} placeholder=${JSON.stringify(element.textHint)} />\n${indent}</div>`;
    }

    if (element.elementTypeId === "element-icon") {
      const iconName = toPascalCase(element.value || "Home") || "Home";
      return `${indent}<${iconName} className="text-foreground" size={${10 + element.styles.size * 2}} />`;
    }

    if (element.elementTypeId === "element-image") {
      const styleBlock = formatJsxStyleBlock(
        [
          ["width", toCssDimension(element.styles.width)],
          ["height", toCssDimension(element.styles.height)],
          ["objectFit", element.styles.sizing],
        ],
        indent,
      );
      return `${indent}<img\n${indent}  src=${JSON.stringify(element.src)}\n${indent}  alt="preview"\n${indent}  className="rounded border border-border bg-muted"${styleBlock}\n${indent}/>`;
    }

    const containerClasses = [
      "flex",
      "flex-1",
      "flex-col",
      getFlexJustifyClass(element.styles.justifyContent),
      getFlexAlignItemsClass(element.styles.alignItems),
    ].join(" ");
    const containerStyleBlock = formatJsxStyleBlock(
      [
        ["gap", `${element.styles.gap}px`],
        ["backgroundColor", isTransparentHex(element.styles.backgroundColor) ? undefined : element.styles.backgroundColor],
        ["borderColor", element.styles.borderWidth > 0 ? element.styles.borderColor : undefined],
        ["borderRadius", `${element.styles.borderRadius}px`],
        ["borderWidth", `${element.styles.borderWidth}px`],
        ["borderStyle", element.styles.borderWidth > 0 ? "solid" : undefined],
      ],
      indent,
    );
    const children =
      element.elements.length > 0
        ? element.elements.map((child) => renderComponentElementCode(child, `${indent}  `)).join("\n")
        : `${indent}  <div className="w-full text-sm text-muted-foreground">Empty container</div>`;

    return `${indent}<div\n${indent}  className=${JSON.stringify(containerClasses)}${containerStyleBlock}\n${indent}>\n${children}\n${indent}</div>`;
  };

  const getComponentPreviewCode = (component: AppComponent): string => {
    const className = [
      "flex",
      "w-full",
      "flex-1",
      "flex-row",
      "flex-wrap",
      getFlexAlignItemsClass(component.styles.alignItems),
      getFlexJustifyClass(component.styles.justifyContent),
    ].join(" ");
    const styleBlock = formatJsxStyleBlock(
      [
        ["gap", `${component.styles.gap}px`],
        ["paddingLeft", `${component.styles.paddingX}px`],
        ["paddingRight", `${component.styles.paddingX}px`],
        ["paddingTop", `${component.styles.paddingY}px`],
        ["paddingBottom", `${component.styles.paddingY}px`],
        ["marginLeft", `${component.styles.marginX}px`],
        ["marginRight", `${component.styles.marginX}px`],
        ["marginTop", `${component.styles.marginY}px`],
        ["marginBottom", `${component.styles.marginY}px`],
        ["backgroundColor", isTransparentHex(component.styles.backgroundColor) ? undefined : component.styles.backgroundColor],
        ["borderColor", component.styles.borderWidth > 0 ? component.styles.borderColor : undefined],
        ["borderRadius", `${component.styles.borderRadius}px`],
        ["borderWidth", `${component.styles.borderWidth}px`],
        ["borderStyle", component.styles.borderWidth > 0 ? "solid" : undefined],
      ],
      "",
    );
    const children =
      component.elements.length > 0
        ? component.elements.map((element) => renderComponentElementCode(element, "  ")).join("\n")
        : "  {/* Add elements here */}";

    return `<div\n  className=${JSON.stringify(className)}${styleBlock}\n>\n${children}\n</div>`;
  };

  const renderComponentElementPreview = (element: ComponentElement) => {
    if (element.elementTypeId === "element-text") {
      const fontSize = `${0.5 + element.styles.size * 0.125}rem`;
      const alignClass =
        element.styles.alignment === "left"
          ? "text-left"
          : element.styles.alignment === "right"
            ? "text-right"
            : "text-center";

      return (
        <p
          className={`${alignClass} w-full ${element.styles.isLabel ? "text-muted-foreground" : "text-foreground"}`}
          style={{
            fontSize,
            fontWeight: element.styles.isBold ? 700 : 400,
            fontStyle: element.styles.isItalic ? "italic" : "normal",
          }}
        >
          {element.value || "Text"}
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

      return (
        <div className={`flex w-full ${positionClass}`}>
          <Switch checked={element.defaultValue} disabled />
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

      return (
        <Button
          variant={element.isGhost ? "ghost" : "default"}
          style={widthStyle}
          className={element.styles.width === "full" ? "w-full" : "w-auto"}
        >
          {element.label}
        </Button>
      );
    }

    if (element.elementTypeId === "element-select") {
      const options = element.values.filter(
        (option) => option.trim().length > 0,
      );
      return (
        <Select defaultValue={options.length > 0 ? "0" : undefined}>
          <SelectTrigger className="w-44">
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

      return (
        <div className={`flex w-full ${alignmentClass}`}>
          <Input
            className={element.styles.width === "full" ? "w-full" : undefined}
            style={widthStyle}
            value={element.value}
            placeholder={element.textHint}
            readOnly
          />
        </div>
      );
    }

    if (element.elementTypeId === "element-icon") {
      const IconComponent = getLucideIconComponent(element.value) || Home;
      const size = 10 + element.styles.size * 2;
      return <IconComponent size={size} className="text-foreground" />;
    }

    if (element.elementTypeId === "element-vertical-container") {
      return (
        <div
          className={`flex h-full w-full flex-1 flex-col rounded-lg p-4 ${getFlexJustifyClass(element.styles.justifyContent)} ${getFlexAlignItemsClass(element.styles.alignItems)}`}
          style={{
            gap: `${element.styles.gap}px`,
            backgroundColor: element.styles.backgroundColor,
            borderColor: element.styles.borderColor,
            borderRadius: `${element.styles.borderRadius}px`,
            borderWidth: `${element.styles.borderWidth}px`,
            borderStyle: element.styles.borderWidth > 0 ? "solid" : "none",
          }}
        >
          {element.elements.length > 0 ? (
            element.elements.map((child) => (
              <div key={child.instanceId} className="flex w-full flex-1">
                {renderComponentElementPreview(child)}
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
        src={element.src}
        alt="preview"
        className="rounded border border-border bg-muted"
        style={{
          width: toCssDimension(element.styles.width),
          height: toCssDimension(element.styles.height),
          objectFit,
        }}
      />
    );
  };

  const getComponentElementLabel = (typeId: ElementTypeId) =>
    PREBUILT_ELEMENTS.find((element) => element.id === typeId)?.label ?? typeId;

  const renderComponentElementFields = (
    componentId: string,
    element: ComponentElement,
  ) => {
    if (element.elementTypeId === "element-text") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              value={element.value}
              onChange={(e) =>
                updateComponentElementField(componentId, element.instanceId, {
                  value: e.target.value,
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
              value={element.styles.width === "full" ? "full" : element.styles.width === "auto" ? "auto" : "pixels"}
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
          {element.styles.width !== "full" && element.styles.width !== "auto" && (
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
        </div>
      );
    }

    if (element.elementTypeId === "element-select") {
      return (
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
                    updateComponentElementField(componentId, element.instanceId, {
                      values: updated,
                    });
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
                    updateComponentElementField(componentId, element.instanceId, {
                      values: updated,
                    });
                  }}
                  className="text-destructive hover:text-destructive"
                  aria-label="Remove option"
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
              updateComponentElementField(componentId, element.instanceId, {
                values: [...element.values, ""],
              })
            }
          >
            <Plus size={16} />
            Add Option
          </Button>
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
        </div>
      );
    }

    const nestedElementOptions = PREBUILT_ELEMENTS.filter(
      (prebuiltElement) => prebuiltElement.id !== "element-vertical-container",
    );
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
                    <SelectItem key={prebuiltElement.id} value={prebuiltElement.id}>
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
                addComponentElement(componentId, nestedDraftType, element.instanceId)
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
          ? activeNestedElementEditorIds[parentInstanceId] ?? ""
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
                    reorderComponentElement(componentId, element.instanceId, "up")
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
                    reorderComponentElement(componentId, element.instanceId, "down")
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
                <DialogTitle className="font-mono">
                  Pick Color
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="picker-native-color">Color Picker</Label>
                  <Input
                    id="picker-native-color"
                    type="color"
                    value={rgbaToHex(colorDraftRed, colorDraftGreen, colorDraftBlue)}
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
                    placeholder="#RRGGBB or #RRGGBBAA"
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
          <div className="grid w-full grid-cols-3 rounded-md bg-muted p-1">
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
                      showAddCustomPage ? "__add_custom__" : selectedPageId
                    }
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
                      <SelectItem value="__add_custom__">
                        Add custom page
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showAddCustomPage && (
                  <div className="mt-4 space-y-3 rounded-lg border border-border p-3">
                    <Label htmlFor="new-custom-page-title">
                      Custom Page Title
                    </Label>
                    <Input
                      id="new-custom-page-title"
                      placeholder="Profile"
                      value={newCustomPageTitle}
                      onChange={(e) => setNewCustomPageTitle(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={addCustomPage}
                      className="w-full gap-2"
                    >
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
                                      {page.link} • {page.icon.name} • pageId:{" "}
                                      {page.pageId}
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
                  {safeConfig.navigation.shown &&
                    navDraftStyle.type === "drawer" && (
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

                  {safeConfig.navigation.shown &&
                    navDraftStyle.type === "bottom" && (
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
                          onKeyDown={(e) =>
                            e.key === "Enter" && addSettingItem()
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="setting-type">Type</Label>
                        <Select
                          value={newSettingType}
                          onValueChange={(
                            value: "toggle" | "input" | "select",
                          ) => setNewSettingType(value)}
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
                                          <SelectItem
                                            value="no-options"
                                            disabled
                                          >
                                            No options available
                                          </SelectItem>
                                        ) : (
                                          previewOptions.map(
                                            (option, index) => (
                                              <SelectItem
                                                key={`${item.id}-preview-option-${index}`}
                                                value={String(index)}
                                              >
                                                {option}
                                              </SelectItem>
                                            ),
                                          )
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
          {activeTab === "components" && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="space-y-2">
                  <Label htmlFor="components-selector">Components</Label>
                  <Select
                    value={
                      showAddCustomComponent
                        ? "__add_custom__"
                        : showImportPrebuilt
                          ? "__import_prebuilt__"
                          : (selectedComponentId ?? "")
                    }
                    onValueChange={(value) => {
                      if (value === "__add_custom__") {
                        setShowAddCustomComponent(true);
                        setShowImportPrebuilt(false);
                        return;
                      }
                      if (value === "__import_prebuilt__") {
                        setShowImportPrebuilt(true);
                        setShowAddCustomComponent(false);
                        return;
                      }
                      setShowAddCustomComponent(false);
                      setShowImportPrebuilt(false);
                      setSelectedComponentId(value);
                    }}
                  >
                    <SelectTrigger id="components-selector">
                      <SelectValue placeholder="Select a component..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customComponents.map((comp) => (
                        <SelectItem key={comp.id} value={comp.id}>
                          {comp.label}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <SelectItem value="__import_prebuilt__">
                        Import prebuilt component
                      </SelectItem>
                      <SelectItem value="__add_custom__">
                        Add custom component
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showAddCustomComponent && (
                  <div className="mt-4 space-y-3 rounded-lg border border-border p-3">
                    <Label htmlFor="new-component-label">Component Label</Label>
                    <Input
                      id="new-component-label"
                      placeholder="My Widget"
                      value={newCustomComponentLabel}
                      onChange={(e) =>
                        setNewCustomComponentLabel(e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      onClick={addCustomComponent}
                      className="w-full gap-2"
                    >
                      <Plus size={16} />
                      Save Component
                    </Button>
                  </div>
                )}

                {showImportPrebuilt && (
                  <div className="mt-4 space-y-2 rounded-lg border border-border p-3">
                    <Label>Select Prebuilt Component</Label>
                    <div className="space-y-2 mt-2">
                      {safeConfig.components.map((comp) => (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => importPrebuiltComponent(comp)}
                          className="w-full text-left p-3 rounded-md bg-secondary hover:bg-muted/80 transition-colors"
                        >
                          <p className="font-medium">{comp.label}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {comp.type}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {!showAddCustomComponent &&
                !showImportPrebuilt &&
                customComponents.length === 0 && (
                  <Card className="p-6">
                    <p className="text-center text-sm text-muted-foreground">
                      No components yet. Use the dropdown above to add or import
                      one.
                    </p>
                  </Card>
                )}

              {!showAddCustomComponent &&
                !showImportPrebuilt &&
                selectedComponent && (
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h2 className="text-lg font-semibold mb-4 font-mono">
                        Component Items
                      </h2>
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="component-element-type">
                              Element Type
                            </Label>
                            <Select
                              value={newComponentElementTypeId}
                              onValueChange={(value: ElementTypeId) =>
                                setNewComponentElementTypeId(value)
                              }
                            >
                              <SelectTrigger id="component-element-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREBUILT_ELEMENTS.map((el) => (
                                  <SelectItem key={el.id} value={el.id}>
                                    {el.label}
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
                              newComponentElementTypeId,
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

                    <Card className="p-4">
                      <h2 className="text-lg font-semibold mb-4 font-mono">
                        Component Styles
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="comp-justify-content">
                            Justify Content
                          </Label>
                          <Select
                            value={selectedComponent.styles.justifyContent}
                            onValueChange={(value: ComponentStyles["justifyContent"]) =>
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
                          <Label htmlFor="comp-align-items">
                            Align Items
                          </Label>
                          <Select
                            value={selectedComponent.styles.alignItems}
                            onValueChange={(value: ComponentStyles["alignItems"]) =>
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
                        <div className="space-y-2">
                          <Label htmlFor="comp-padding-x">
                            Horizontal Padding (px)
                          </Label>
                          <Input
                            id="comp-padding-x"
                            type="number"
                            min={0}
                            max={200}
                            value={selectedComponent.styles.paddingX}
                            onChange={(e) =>
                              updateComponentStyles(selectedComponent.id, {
                                paddingX: clampComponentSpacing(e.target.value),
                              })
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
                            value={selectedComponent.styles.paddingY}
                            onChange={(e) =>
                              updateComponentStyles(selectedComponent.id, {
                                paddingY: clampComponentSpacing(e.target.value),
                              })
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
                            value={selectedComponent.styles.marginX}
                            onChange={(e) =>
                              updateComponentStyles(selectedComponent.id, {
                                marginX: clampComponentSpacing(e.target.value),
                              })
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
                            value={selectedComponent.styles.marginY}
                            onChange={(e) =>
                              updateComponentStyles(selectedComponent.id, {
                                marginY: clampComponentSpacing(e.target.value),
                              })
                            }
                          />
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
                            <span>{selectedComponent.styles.backgroundColor}</span>
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
                          <Label htmlFor="comp-border-color">Border Color</Label>
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

                    <Card className="p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold font-mono">
                          Component Preview
                        </h2>
                        {selectedComponent && (
                          <div className="flex items-center gap-2">
                            <Dialog
                              open={componentCodeDialogOpen}
                              onOpenChange={setComponentCodeDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button type="button" variant="outline">
                                  Code
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                                <DialogHeader className="shrink-0">
                                  <DialogTitle className="font-mono">
                                    {selectedComponent.label} JSX
                                  </DialogTitle>
                                </DialogHeader>
                                <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                                  {getComponentPreviewCode(selectedComponent)}
                                </pre>
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={componentJsonDialogOpen}
                              onOpenChange={setComponentJsonDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button type="button" variant="outline">
                                  JSON
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                                <DialogHeader className="shrink-0">
                                  <DialogTitle className="font-mono">
                                    {selectedComponent.label} JSON
                                  </DialogTitle>
                                </DialogHeader>
                                <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                                  {JSON.stringify(selectedComponent, null, 2)}
                                </pre>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                      {!selectedComponent ? (
                        <p className="text-sm text-muted-foreground">
                          No component selected for preview.
                        </p>
                      ) : (
                        <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 px-6">
                          <div className="w-full rounded-lg border border-border bg-secondary p-3">
                            <p className="mb-3 text-sm font-semibold">
                              {selectedComponent.label}
                            </p>
                            <div
                              className={`flex w-full flex-1 flex-row flex-wrap ${getFlexAlignItemsClass(selectedComponent.styles.alignItems)} ${getFlexJustifyClass(selectedComponent.styles.justifyContent)}`}
                              style={{
                                gap: `${selectedComponent.styles.gap}px`,
                                paddingLeft: `${selectedComponent.styles.paddingX}px`,
                                paddingRight: `${selectedComponent.styles.paddingX}px`,
                                paddingTop: `${selectedComponent.styles.paddingY}px`,
                                paddingBottom: `${selectedComponent.styles.paddingY}px`,
                                marginLeft: `${selectedComponent.styles.marginX}px`,
                                marginRight: `${selectedComponent.styles.marginX}px`,
                                marginTop: `${selectedComponent.styles.marginY}px`,
                                marginBottom: `${selectedComponent.styles.marginY}px`,
                                backgroundColor: selectedComponent.styles.backgroundColor,
                                borderColor: selectedComponent.styles.borderColor,
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
                                  className={`min-h-8 min-w-0 flex-1 ${element.elementTypeId === "element-vertical-container" ? "flex self-stretch" : ""}`}
                                >
                                  {renderComponentElementPreview(element)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
