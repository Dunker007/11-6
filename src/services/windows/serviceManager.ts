// Windows Service Management Service
// Provides utilities for managing Windows services

export interface WindowsService {
  Name: string;
  DisplayName: string;
  Status: string;
  StartType: string;
}

export interface ServiceOperationResult {
  success: boolean;
  error?: string;
}

export class ServiceManager {
  private static instance: ServiceManager;
  private serviceCache: WindowsService[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  async getAllServices(): Promise<WindowsService[]> {
    // Check cache
    const now = Date.now();
    if (this.serviceCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.serviceCache;
    }

    try {
      const result = await window.windows?.listServices();
      if (result?.success && result.services) {
        this.serviceCache = result.services;
        this.cacheTimestamp = now;
        return result.services;
      }
      throw new Error(result?.error || 'Failed to list services');
    } catch (error) {
      console.error('Failed to get services:', error);
      return [];
    }
  }

  async getUnusedServices(): Promise<WindowsService[]> {
    const allServices = await this.getAllServices();
    
    // Common unused services that can be safely disabled
    const unusedServiceNames = [
      'Skype',
      'Xbox',
      'XblAuthManager',
      'XblGameSave',
      'XboxGipSvc',
      'XboxNetApiSvc',
      'WSearch', // Windows Search (can be disabled if not needed)
      'SysMain', // Superfetch (can be disabled)
      'Themes', // Themes service (can be disabled if using classic theme)
      'TabletInputService', // Tablet PC Input Service
      'RemoteRegistry', // Remote Registry (security risk if not needed)
      'RemoteAccess', // Routing and Remote Access
      'RasMan', // Remote Access Connection Manager
      'WMPNetworkSvc', // Windows Media Player Network Sharing Service
      'p2pimsvc', // Peer Networking Identity Manager
      'p2psvc', // Peer Networking Grouping
      'PNRPsvc', // Peer Name Resolution Protocol
      'WbioSrvc', // Windows Biometric Service
      'WerSvc', // Windows Error Reporting Service (can be disabled)
      'wisvc', // Windows Insider Service
    ];

    return allServices.filter(service => {
      const nameLower = service.Name.toLowerCase();
      const displayNameLower = service.DisplayName.toLowerCase();
      
      return unusedServiceNames.some(unused => {
        const unusedLower = unused.toLowerCase();
        return nameLower.includes(unusedLower) || displayNameLower.includes(unusedLower);
      });
    });
  }

  canDisableService(serviceName: string): boolean {
    // Critical services that should never be disabled
    const criticalServices = [
      'RpcSs', // Remote Procedure Call
      'DcomLaunch', // DCOM Server Process Launcher
      'PlugPlay', // Plug and Play
      'AudioSrv', // Windows Audio
      'AudioEndpointBuilder', // Windows Audio Endpoint Builder
      'Themes', // Themes (needed for UI)
      'Dhcp', // DHCP Client
      'Dnscache', // DNS Client
      'NlaSvc', // Network Location Awareness
      'Netman', // Network Connections
      'Netlogon', // Netlogon
      'Nla', // Network Location Awareness
      'Winmgmt', // Windows Management Instrumentation
      'EventLog', // Windows Event Log
      'Schedule', // Task Scheduler
      'Spooler', // Print Spooler
      'Themes', // Themes
      'UxSms', // Desktop Window Manager Session Manager
      'WSearch', // Windows Search (can be disabled but check first)
    ];

    const nameLower = serviceName.toLowerCase();
    return !criticalServices.some(critical => nameLower.includes(critical.toLowerCase()));
  }

  async disableService(serviceName: string): Promise<ServiceOperationResult> {
    if (!this.canDisableService(serviceName)) {
      return {
        success: false,
        error: `Service ${serviceName} is critical and should not be disabled`,
      };
    }

    try {
      const result = await window.windows?.disableService(serviceName);
      if (result?.success) {
        // Invalidate cache
        this.serviceCache = null;
        return { success: true };
      }
      return {
        success: false,
        error: result?.error || 'Failed to disable service',
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async enableService(serviceName: string): Promise<ServiceOperationResult> {
    try {
      const result = await window.windows?.enableService(serviceName);
      if (result?.success) {
        // Invalidate cache
        this.serviceCache = null;
        return { success: true };
      }
      return {
        success: false,
        error: result?.error || 'Failed to enable service',
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async getServiceStatus(serviceName: string): Promise<WindowsService | null> {
    try {
      const result = await window.windows?.getServiceStatus(serviceName);
      if (result?.success && result.service) {
        return result.service;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get status for ${serviceName}:`, error);
      return null;
    }
  }

  clearCache(): void {
    this.serviceCache = null;
    this.cacheTimestamp = 0;
  }
}

export const serviceManager = ServiceManager.getInstance();

