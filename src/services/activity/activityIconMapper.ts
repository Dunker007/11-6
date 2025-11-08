import {
  FileText,
  FolderPlus,
  Trash2,
  Save,
  Code,
  MessageCircle,
  CheckCircle,
  XCircle,
  Upload,
  AlertCircle,
  Settings,
  Download,
  GitBranch,
  type LucideIcon,
} from 'lucide-react';

// Hammer and GitCommit not in our icons barrel yet
import { Hammer, GitCommit } from 'lucide-react';
import { ActivityType, ActivityColor } from '../../types/activity';

/**
 * Central mapping for activity icons and colors
 * Single source of truth for all activity visualization
 */

export function getActivityIcon(type: ActivityType, action: string): LucideIcon {
  switch (type) {
    case 'file':
      if (action === 'created') return FileText;
      if (action === 'edited' || action === 'modified') return Code;
      if (action === 'deleted') return Trash2;
      if (action === 'saved') return Save;
      return FileText;

    case 'project':
      if (action === 'created') return FolderPlus;
      if (action === 'opened') return FolderPlus;
      if (action === 'deleted') return Trash2;
      if (action === 'status_changed') return GitBranch;
      return FolderPlus;

    case 'ai':
      return MessageCircle;

    case 'build':
      if (action === 'started') return Hammer;
      if (action === 'completed') return CheckCircle;
      if (action === 'failed') return XCircle;
      return Hammer;

    case 'deploy':
    case 'deployment':
      if (action === 'started') return Upload;
      if (action === 'completed') return CheckCircle;
      if (action === 'failed') return XCircle;
      return Upload;

    case 'code':
      if (action === 'generated') return Code;
      return Code;

    case 'git':
      if (action === 'commit') return GitCommit;
      if (action === 'push') return Upload;
      if (action === 'pull') return Download;
      return GitCommit;

    case 'error':
      return AlertCircle;

    case 'system':
      return Settings;

    default:
      return Settings;
  }
}

export function getActivityColor(type: ActivityType, action: string): ActivityColor {
  switch (type) {
    case 'file':
      if (action === 'created') return 'green';
      if (action === 'edited' || action === 'modified') return 'cyan';
      if (action === 'deleted') return 'red';
      if (action === 'saved') return 'green';
      return 'cyan';

    case 'project':
      if (action === 'created') return 'green';
      if (action === 'opened') return 'cyan';
      if (action === 'deleted') return 'red';
      if (action === 'status_changed') return 'violet';
      return 'cyan';

    case 'ai':
      if (action === 'query') return 'violet';
      if (action === 'response') return 'cyan';
      return 'violet';

    case 'build':
      if (action === 'started') return 'yellow';
      if (action === 'completed') return 'green';
      if (action === 'failed') return 'red';
      return 'cyan';

    case 'deploy':
    case 'deployment':
      if (action === 'started') return 'yellow';
      if (action === 'completed') return 'green';
      if (action === 'failed') return 'red';
      return 'cyan';

    case 'code':
      if (action === 'generated') return 'violet';
      return 'cyan';

    case 'git':
      if (action === 'commit') return 'cyan';
      if (action === 'push') return 'green';
      if (action === 'pull') return 'cyan';
      return 'cyan';

    case 'error':
      return 'red';

    case 'system':
      return 'cyan';

    default:
      return 'cyan';
  }
}

/**
 * Get both icon and color in one call for convenience
 */
export function getActivityIconAndColor(
  type: ActivityType,
  action: string
): { icon: LucideIcon; color: ActivityColor } {
  return {
    icon: getActivityIcon(type, action),
    color: getActivityColor(type, action),
  };
}

