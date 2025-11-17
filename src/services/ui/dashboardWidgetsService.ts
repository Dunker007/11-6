/**
 * dashboardWidgetsService.ts
 * Customizable dashboard widgets for data visualization.
 */

import { logger } from '../logging/loggerService';

export interface Widget {
  id: string;
  type: 'revenue' | 'content' | 'audience' | 'chart' | 'stats' | 'activity' | 'custom';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  data?: any;
  refreshRate?: number; // milliseconds
  visible: boolean;
}

export interface WidgetLayout {
  id: string;
  name: string;
  widgets: Widget[];
  default: boolean;
}

export interface WidgetTemplate {
  type: string;
  name: string;
  description: string;
  defaultSize: { width: number; height: number };
  configOptions: string[];
}

class DashboardWidgetsService {
  private layouts: WidgetLayout[] = [];
  private activeLayoutId?: string;
  private widgetTemplates: WidgetTemplate[] = [];

  createWidget(
    type: Widget['type'],
    title: string,
    position: { x: number; y: number },
    size: { width: number; height: number },
    config: Record<string, any> = {}
  ): Widget {
    const widget: Widget = {
      id: crypto.randomUUID(),
      type,
      title,
      position,
      size,
      config,
      visible: true,
      refreshRate: 60000, // 1 minute default
    };

    logger.info('Widget created', { id: widget.id, type, title });

    return widget;
  }

  createLayout(name: string, widgets: Widget[] = [], isDefault: boolean = false): WidgetLayout {
    const layout: WidgetLayout = {
      id: crypto.randomUUID(),
      name,
      widgets,
      default: isDefault,
    };

    this.layouts.push(layout);

    if (isDefault || !this.activeLayoutId) {
      this.activeLayoutId = layout.id;
    }

    logger.info('Layout created', { id: layout.id, name, widgetCount: widgets.length });

    return layout;
  }

  addWidgetToLayout(layoutId: string, widget: Widget): boolean {
    const layout = this.layouts.find(l => l.id === layoutId);

    if (!layout) {
      logger.error('Layout not found', { layoutId });
      return false;
    }

    layout.widgets.push(widget);
    logger.info('Widget added to layout', { layoutId, widgetId: widget.id });

    return true;
  }

  removeWidget(layoutId: string, widgetId: string): boolean {
    const layout = this.layouts.find(l => l.id === layoutId);

    if (!layout) {
      return false;
    }

    layout.widgets = layout.widgets.filter(w => w.id !== widgetId);
    logger.info('Widget removed', { layoutId, widgetId });

    return true;
  }

  updateWidget(layoutId: string, widgetId: string, updates: Partial<Widget>): boolean {
    const layout = this.layouts.find(l => l.id === layoutId);

    if (!layout) {
      return false;
    }

    const widget = layout.widgets.find(w => w.id === widgetId);

    if (!widget) {
      return false;
    }

    Object.assign(widget, updates);
    logger.info('Widget updated', { layoutId, widgetId });

    return true;
  }

  moveWidget(layoutId: string, widgetId: string, newPosition: { x: number; y: number }): boolean {
    return this.updateWidget(layoutId, widgetId, { position: newPosition });
  }

  resizeWidget(layoutId: string, widgetId: string, newSize: { width: number; height: number }): boolean {
    return this.updateWidget(layoutId, widgetId, { size: newSize });
  }

  getLayout(layoutId: string): WidgetLayout | undefined {
    return this.layouts.find(l => l.id === layoutId);
  }

  getActiveLayout(): WidgetLayout | undefined {
    return this.layouts.find(l => l.id === this.activeLayoutId);
  }

  switchLayout(layoutId: string): boolean {
    const layout = this.layouts.find(l => l.id === layoutId);

    if (!layout) {
      return false;
    }

    this.activeLayoutId = layoutId;
    logger.info('Switched to layout', { layoutId, name: layout.name });

    return true;
  }

  getAllLayouts(): WidgetLayout[] {
    return this.layouts;
  }

  duplicateLayout(layoutId: string, newName: string): WidgetLayout | null {
    const original = this.layouts.find(l => l.id === layoutId);

    if (!original) {
      return null;
    }

    const duplicatedWidgets = original.widgets.map(w => ({
      ...w,
      id: crypto.randomUUID(),
    }));

    return this.createLayout(newName, duplicatedWidgets);
  }

  refreshWidgetData(layoutId: string, widgetId: string): void {
    const layout = this.layouts.find(l => l.id === layoutId);
    const widget = layout?.widgets.find(w => w.id === widgetId);

    if (!widget) {
      return;
    }

    // Mock data refresh based on widget type
    switch (widget.type) {
      case 'revenue':
        widget.data = {
          total: Math.random() * 10000,
          mrr: Math.random() * 2000,
          growth: Math.random() * 20,
        };
        break;
      case 'content':
        widget.data = {
          published: Math.floor(Math.random() * 100),
          draft: Math.floor(Math.random() * 20),
          scheduled: Math.floor(Math.random() * 10),
        };
        break;
      case 'audience':
        widget.data = {
          total: Math.floor(Math.random() * 50000),
          growth: Math.floor(Math.random() * 500),
          engagement: Math.random() * 5,
        };
        break;
      default:
        widget.data = { value: Math.random() * 100 };
    }

    logger.info('Widget data refreshed', { widgetId, type: widget.type });
  }

  initializeDefaultLayout(): WidgetLayout {
    const widgets: Widget[] = [
      this.createWidget('revenue', 'Revenue Overview', { x: 0, y: 0 }, { width: 2, height: 1 }),
      this.createWidget('content', 'Content Stats', { x: 2, y: 0 }, { width: 2, height: 1 }),
      this.createWidget('audience', 'Audience Growth', { x: 0, y: 1 }, { width: 2, height: 1 }),
      this.createWidget('activity', 'Recent Activity', { x: 2, y: 1 }, { width: 2, height: 2 }),
      this.createWidget('chart', 'Revenue Trend', { x: 0, y: 2 }, { width: 2, height: 1 }),
    ];

    // Refresh data for all widgets
    const layout = this.createLayout('Default Dashboard', widgets, true);

    widgets.forEach(w => this.refreshWidgetData(layout.id, w.id));

    return layout;
  }

  quickTest() {
    const defaultLayout = this.initializeDefaultLayout();

    const customWidget = this.createWidget('stats', 'Custom Metric', { x: 0, y: 3 }, { width: 1, height: 1 });
    this.addWidgetToLayout(defaultLayout.id, customWidget);

    const duplicatedLayout = this.duplicateLayout(defaultLayout.id, 'Custom Dashboard');

    return {
      layouts: this.getAllLayouts().map(l => ({
        id: l.id,
        name: l.name,
        widgetCount: l.widgets.length,
        default: l.default,
      })),
      activeLayout: this.getActiveLayout(),
      widgetTypes: ['revenue', 'content', 'audience', 'chart', 'stats', 'activity'],
    };
  }
}

export const dashboardWidgetsService = new DashboardWidgetsService();
if (typeof window !== 'undefined') (window as any).testDashboardWidgets = () => dashboardWidgetsService.quickTest();
