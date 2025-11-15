import type { ErrorCategory, CapturedError } from '@/types/error';

export interface ErrorMessageTemplate {
  title: string;
  message: string;
  recoverySteps: string[];
  docLinks?: Array<{ label: string; href: string }>;
}

const CATEGORY_TEMPLATES: Record<ErrorCategory, ErrorMessageTemplate> = {
  react: {
    title: 'UI Component Issue',
    message:
      'Something went wrong while rendering this part of the interface. The component crashed, but the rest of the app is still running.',
    recoverySteps: [
      'Try the action again or refresh the section',
      'Check the component logs for stack traces',
      'Review recent code changes around this component',
    ],
  },
  console: {
    title: 'Runtime Console Warning',
    message:
      'A console warning/error was detected. These often point to developer tools or non-blocking issues that still deserve attention.',
    recoverySteps: [
      'Open DevTools and inspect the full console output',
      'Verify the message is not triggered repeatedly',
      'Capture the stack trace if the warning continues',
    ],
  },
  network: {
    title: 'Network Connectivity Issue',
    message:
      'The app was unable to reach a required service. This could be a connectivity hiccup or a remote outage.',
    recoverySteps: [
      'Check your internet connection or VPN status',
      'Retry the action you were performing',
      'Confirm the remote service or API is online',
    ],
    docLinks: [{ label: 'Troubleshoot Connectivity', href: 'https://router.help/network-troubleshooting' }],
  },
  runtime: {
    title: 'Application Error',
    message:
      'A runtime error occurred while executing application logic. The operation didn’t finish successfully.',
    recoverySteps: [
      'Retry the action that triggered the error',
      'Check logs for the full stack trace and context',
      'Validate recent configuration or data changes',
    ],
  },
  build: {
    title: 'Build/Compilation Failure',
    message:
      'The build pipeline reported an error. This usually indicates a TypeScript or bundler issue.',
    recoverySteps: [
      'Run the build locally (`npm run build`) to reproduce',
      'Inspect TypeScript diagnostics for the failing file',
      'Fix the offending code and rerun the build',
    ],
    docLinks: [{ label: 'TypeScript Troubleshooting', href: 'https://www.typescriptlang.org/docs/' }],
  },
  unknown: {
    title: 'Unexpected Error',
    message:
      'An unexpected error occurred. We could not match it to a known category, but we captured the details for review.',
    recoverySteps: [
      'Retry the action to see if the error persists',
      'Open the error console for detailed logs',
      'Report the issue with steps to reproduce',
    ],
  },
};

const KEYWORD_TEMPLATES: Array<{ pattern: RegExp; template: ErrorMessageTemplate }> = [
  {
    pattern: /timeout|timed out/i,
    template: {
      title: 'Request Timed Out',
      message:
        'The request took too long to respond. This usually points to a slow network or a busy service.',
      recoverySteps: [
        'Retry the request',
        'Check your connection speed',
        'Verify the remote service is available',
      ],
    },
  },
  {
    pattern: /unauthorized|401|forbidden|403/i,
    template: {
      title: 'Authentication Required',
      message:
        'We could not authenticate the request. This typically means credentials are missing or expired.',
      recoverySteps: [
        'Verify your API keys or login status',
        'Re-authenticate and try again',
        'Check permissions for this action',
      ],
    },
  },
  {
    pattern: /failed to fetch|networkerror/i,
    template: {
      title: 'Unable to Reach Service',
      message:
        'The app could not reach the remote service. This may be due to being offline or a CORS/network policy issue.',
      recoverySteps: [
        'Confirm you have network access',
        'Retry the request in a few seconds',
        'Check if a proxy or firewall is blocking the request',
      ],
    },
  },
  {
    pattern: /syntaxerror|unexpected token/i,
    template: {
      title: 'Syntax Error Detected',
      message:
        'JavaScript/TypeScript reported a syntax error. This must be fixed before the code can run.',
      recoverySteps: [
        'Inspect the referenced file and line number',
        'Fix the syntax issue (missing brackets, commas, etc.)',
        'Re-run the build or reload the page',
      ],
    },
  },
];

const FALLBACK_TEMPLATE: ErrorMessageTemplate = {
  title: 'Something Went Wrong',
  message:
    'An error occurred and we captured the details. Review the logs for specifics and follow the recommended recovery steps.',
  recoverySteps: [
    'Retry the previous action',
    'Open the error console for more context',
    'Report the issue if it keeps happening',
  ],
};

export function getErrorTemplate(error: Pick<CapturedError, 'type' | 'message'>): ErrorMessageTemplate {
  const keywordTemplate = KEYWORD_TEMPLATES.find(({ pattern }) => pattern.test(error.message));
  if (keywordTemplate) {
    return keywordTemplate.template;
  }

  return CATEGORY_TEMPLATES[error.type] ?? FALLBACK_TEMPLATE;
}

export function getUserFacingMessage(error: Pick<CapturedError, 'type' | 'message'>): string {
  return getErrorTemplate(error).message;
}

export function getRecoveryChecklist(error: Pick<CapturedError, 'type' | 'message'>): string[] {
  return getErrorTemplate(error).recoverySteps;
}





