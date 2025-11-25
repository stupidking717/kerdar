import React, { memo, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Props for NodeIcon component
 */
export interface NodeIconProps {
  /** Icon name (Lucide icon name) or SVG string */
  icon?: string;

  /** Icon color */
  color?: string;

  /** Additional CSS classes */
  className?: string;

  /** Icon size (width/height) */
  size?: number;

  /** Style object */
  style?: React.CSSProperties;
}

/**
 * Default icon when no icon is specified
 */
const DefaultIcon = LucideIcons.Box;

/**
 * Map of common icon aliases to Lucide icons
 */
const iconAliases: Record<string, keyof typeof LucideIcons> = {
  // Triggers
  webhook: 'Webhook',
  schedule: 'Clock',
  manual: 'PlayCircle',
  email: 'Mail',
  cron: 'Timer',

  // Actions
  http: 'Globe',
  'http-request': 'Globe',
  code: 'Code',
  function: 'Code2',
  set: 'Variable',
  execute: 'Terminal',

  // Logic
  if: 'GitBranch',
  switch: 'GitMerge',
  merge: 'Merge',
  split: 'Split',
  loop: 'Repeat',
  filter: 'Filter',

  // Data
  transform: 'ArrowRightLeft',
  sort: 'ArrowUpDown',
  limit: 'ListFilter',
  aggregate: 'Calculator',
  json: 'Braces',

  // Database
  database: 'Database',
  postgres: 'Database',
  mysql: 'Database',
  mongodb: 'Database',
  redis: 'Database',

  // Communication
  slack: 'MessageSquare',
  discord: 'MessageCircle',
  telegram: 'Send',
  sms: 'Smartphone',

  // Files
  file: 'File',
  csv: 'FileSpreadsheet',
  pdf: 'FileText',
  image: 'Image',

  // Cloud
  aws: 'Cloud',
  gcp: 'Cloud',
  azure: 'Cloud',
  s3: 'HardDrive',

  // AI
  ai: 'Brain',
  openai: 'Brain',
  langchain: 'Link',

  // Misc
  wait: 'Clock',
  error: 'AlertCircle',
  start: 'Play',
  end: 'Square',
  note: 'StickyNote',
};

/**
 * Check if string is an SVG
 */
function isSvgString(str: string): boolean {
  return str.trim().startsWith('<svg') || str.trim().startsWith('<?xml');
}

/**
 * Get Lucide icon component by name
 */
function getLucideIcon(name: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null {
  // Check aliases first
  const aliasedName = iconAliases[name.toLowerCase()];
  if (aliasedName && aliasedName in LucideIcons) {
    return (LucideIcons as any)[aliasedName];
  }

  // Try exact match
  if (name in LucideIcons) {
    return (LucideIcons as any)[name];
  }

  // Try PascalCase conversion
  const pascalCase = name
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  if (pascalCase in LucideIcons) {
    return (LucideIcons as any)[pascalCase];
  }

  return null;
}

/**
 * NodeIcon component - renders node icons from Lucide icons or custom SVG
 */
export const NodeIcon = memo<NodeIconProps>(({
  icon,
  color,
  className,
  size = 20,
  style,
}) => {
  const iconElement = useMemo(() => {
    if (!icon) {
      return (
        <DefaultIcon
          className={cn('flex-shrink-0', className)}
          style={{ color, width: size, height: size, ...style }}
        />
      );
    }

    // Handle SVG string
    if (isSvgString(icon)) {
      return (
        <div
          className={cn('flex-shrink-0', className)}
          style={{ color, width: size, height: size, ...style }}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      );
    }

    // Handle URL
    if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/')) {
      return (
        <img
          src={icon}
          alt="Node icon"
          className={cn('flex-shrink-0 object-contain', className)}
          style={{ width: size, height: size, ...style }}
        />
      );
    }

    // Handle emoji
    if (/\p{Emoji}/u.test(icon) && icon.length <= 4) {
      return (
        <span
          className={cn('flex-shrink-0 leading-none', className)}
          style={{ fontSize: size, ...style }}
        >
          {icon}
        </span>
      );
    }

    // Try to get Lucide icon
    const LucideIcon = getLucideIcon(icon);
    if (LucideIcon) {
      return (
        <LucideIcon
          className={cn('flex-shrink-0', className)}
          style={{ color, width: size, height: size, ...style }}
        />
      );
    }

    // Fallback to default
    return (
      <DefaultIcon
        className={cn('flex-shrink-0', className)}
        style={{ color, width: size, height: size, ...style }}
      />
    );
  }, [icon, color, className, size, style]);

  return iconElement;
});

NodeIcon.displayName = 'NodeIcon';

/**
 * Get all available icon names
 */
export function getAvailableIcons(): string[] {
  const lucideNames = Object.keys(LucideIcons).filter(
    (key) => key !== 'default' && key !== 'createLucideIcon' && key !== 'icons'
  );
  const aliasNames = Object.keys(iconAliases);
  return [...new Set([...aliasNames, ...lucideNames])].sort();
}

/**
 * Icon picker data
 */
export interface IconPickerItem {
  name: string;
  displayName: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Get icons for icon picker
 */
export function getIconPickerItems(): IconPickerItem[] {
  const categories: Record<string, string[]> = {
    common: ['Play', 'Pause', 'Stop', 'RefreshCw', 'Settings', 'Search', 'Plus', 'Minus', 'X', 'Check'],
    triggers: ['Webhook', 'Clock', 'Timer', 'Bell', 'Mail', 'Calendar'],
    actions: ['Globe', 'Code', 'Terminal', 'Send', 'Download', 'Upload'],
    logic: ['GitBranch', 'GitMerge', 'Merge', 'Split', 'Repeat', 'Filter'],
    data: ['Database', 'Table', 'FileJson', 'Braces', 'Calculator'],
    communication: ['MessageSquare', 'Mail', 'Phone', 'Video', 'Share2'],
    files: ['File', 'Folder', 'FileText', 'Image', 'FileCode'],
    misc: ['Zap', 'Cloud', 'Lock', 'Unlock', 'Link', 'ExternalLink'],
  };

  const items: IconPickerItem[] = [];

  Object.entries(categories).forEach(([category, iconNames]) => {
    iconNames.forEach((name) => {
      const Icon = (LucideIcons as any)[name];
      if (Icon) {
        items.push({
          name,
          displayName: name.replace(/([A-Z])/g, ' $1').trim(),
          category,
          icon: Icon,
        });
      }
    });
  });

  return items;
}

export default NodeIcon;
