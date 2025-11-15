import {
  Zap,
  Code2,
  Rocket,
  Activity,
  TrendingUp,
  Network,
  ScanEye,
  Cpu,
  FileCode,
  Key,
  Wrench,
  Github,
  MonitorDot,
  BotMessageSquare,
  Database,
  LayoutGrid,
  Terminal,
  Sparkles,
  Orbit,
  Command,
  Plus,
  FolderPlus,
  FileText,
  Search,
  Settings,
  Layers,
  Play,
  Package,
  GitBranch,
  Eye,
  Brain,
  MessageCircle,
  Palette,
  Code,
  Upload,
  BarChart3,
  DollarSign,
  Bot,
  PenTool,
  Layout,
  Bell, // Import Bell
  Shield, // Import Shield
  Target,
  AlertTriangle,
  Hand,
  GaugeCircle,
  LucideIcon,
} from 'lucide-react';

// Icon type definitions for export
export type IconName =
  | 'create'
  | 'build'
  | 'deploy'
  | 'monitor'
  | 'monetize'
  | 'mindmap'
  | 'codereview'
  | 'agentforge'
  | 'creator'
  | 'apikeys'
  | 'devtools'
  | 'github'
  | 'monitors'
  | 'bytebot'
  | 'backoffice'
  | 'layoutPlayground'
  | 'programRunner'
  | 'vibedEd'
  | 'osMode'
  | 'commandPalette'
  | 'plus'
  | 'search'
  | 'settings'
  | 'layers'
  | 'play'
  | 'package'
  | 'gitbranch'
  | 'eye'
  | 'file'
  | 'folder'
  | 'bell'
  | 'shield'
  | 'target'
  | 'alert'
  | 'hand'
  | 'optimizer';

// Complete icon mapping for the command center
export const ICON_MAP: Record<IconName, LucideIcon> = {
  // Main Workflows
  create: Zap,
  build: Code2,
  deploy: Rocket,
  monitor: Activity,
  monetize: TrendingUp,

  // Quick Labs
  mindmap: Network,
  codereview: ScanEye,
  agentforge: Cpu,
  creator: FileCode,

  // Settings & Tools
  apikeys: Key,
  devtools: Wrench,
  github: Github,
  monitors: MonitorDot,
  bytebot: BotMessageSquare,
  backoffice: Database,
  layoutPlayground: LayoutGrid,
  programRunner: Terminal,

  // Special
  vibedEd: Sparkles,
  osMode: Orbit,
  commandPalette: Command,

  // Utility
  plus: Plus,
  search: Search,
  settings: Settings,
  layers: Layers,
  play: Play,
  package: Package,
  gitbranch: GitBranch,
  eye: Eye,
  file: FileText,
  folder: FolderPlus,
  bell: Bell, // Add bell mapping
  shield: Shield, // Add shield mapping
  target: Target,
  alert: AlertTriangle,
  hand: Hand,
  optimizer: GaugeCircle,
};

// Alternate icons for variety
export const ALT_ICONS = {
  create: Plus,
  build: Code,
  deploy: Upload,
  monitor: BarChart3,
  monetize: DollarSign,
  mindmap: Brain,
  agentforge: Bot,
  creator: PenTool,
  devtools: Settings,
  layoutPlayground: Palette,
  programRunner: Play,
  vibedEd: MessageCircle,
};

// Export individual icon components for direct import
export {
  Zap,
  Code2,
  Rocket,
  Activity,
  TrendingUp,
  Network,
  ScanEye,
  Cpu,
  FileCode,
  Key,
  Wrench,
  Github,
  MonitorDot,
  BotMessageSquare,
  Database,
  LayoutGrid,
  Terminal,
  Sparkles,
  Orbit,
  Command,
  Plus,
  FolderPlus,
  FileText,
  Search,
  Settings,
  Layers,
  Play,
  Package,
  GitBranch,
  Eye,
  Brain,
  MessageCircle,
  Palette,
  Code,
  Upload,
  BarChart3,
  DollarSign,
  Bot,
  PenTool,
  Layout,
  Bell, // Export Bell
  Shield, // Export Shield
  Target,
  AlertTriangle,
  Hand,
};

// Helper function to get icon by name
export function getIcon(name: IconName): LucideIcon {
  return ICON_MAP[name];
}
