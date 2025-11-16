/**
 * Centralized Lucide Icon Exports
 * Single source of truth for all icons used in the application
 * Tree-shaking optimization: Only exports icons we actually use (~100 icons instead of 1000+)
 *
 * IMPORTANT: When adding new icons to the app, add them here first!
 * Updated: 2025-11-14 - Consolidated all 116 icon imports
 */

// Re-export only the icons we use
export {
  // Type
  type LucideIcon,

  // Core Actions
  Plus,
  X,
  Check,
  CheckCircle2,
  Save,
  Download,
  Upload,
  Copy,
  Clipboard,
  Scissors,
  Edit2,
  Trash2,
  Dot,
  Minus,

  // Navigation & UI
  Search,
  Settings,
  Sliders,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Eye,
  EyeOff,
  ExternalLink,
  Play,
  Pause,
  Square,
  Zap,
  Send,
  Menu,
  MoreVertical,
  MoreHorizontal,

  // Files & Folders
  FileText,
  FilePlus,
  Filter,
  Folder,
  FolderOpen,
  FolderPlus,
  FileCode,
  File,

  // Development & Code
  Code,
  Code2,
  Terminal,
  Package,
  GitBranch,
  Github,
  Cpu,
  Database,
  Bug,
  Puzzle,
  Wrench,

  // AI & Intelligence
  Brain,
  BrainCircuit,
  Bot,
  BotMessageSquare,
  Sparkles,
  MessageCircle,
  MessageSquare,
  Network,
  Orbit,
  Command,

  // Status & Alerts
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Bell,
  Loader,
  Loader2,
  Clock,

  // Data & Analytics
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart,
  BarChart2,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  Tag,
  Users,
  User,

  // Crypto & Finance
  Bitcoin,
  Coins,
  Wallet,
  CreditCard,
  TrendingDown as ArrowDown,

  // Infrastructure
  Server,
  Cloud,
  Lock,
  Unlock,
  Key,
  MonitorDot,
  Monitor,
  Rocket,
  Target,
  History,
  RefreshCw,
  RefreshCcw,
  Wifi,
  WifiOff,

  // Creation & Design
  PenTool,
  Palette,
  Layout,
  LayoutGrid,
  LayoutDashboard,
  Layers,
  Image,
  Paintbrush,

  // Content
  Book,
  Library,
  BookOpen,
  Newspaper,

  // Social & Communication
  Heart,
  Share,
  Share2,
  Mail,
  Phone,
  Video,

  // Utility
  ScanEye,
  Lightbulb,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  Home,
  Archive,
  Shield,
  Star,
  Flag,
  Bookmark,
  Calendar,
  MapPin,
  Keyboard,
  ListChecks,
  List,
  Grid,
  Columns,
  Link,
  Link2,
  HelpCircle,
  Move,
  Grip,
} from 'lucide-react';
