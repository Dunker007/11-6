/**
 * prettierService
 *
 * Browser-first formatting service. Tries to load Prettier on-demand.
 * If unavailable, falls back to a lightweight whitespace/indent normalizer.
 */

export type SupportedParser = 'babel' | 'babel-ts' | 'typescript' | 'json' | 'markdown';

class PrettierService {
  private loaded = false;
  private prettier: any = null;
  private plugins: Record<string, any> = {};

  private async ensureLoaded(): Promise<boolean> {
    if (this.loaded) return true;
    try {
      // Attempt dynamic imports (will work if deps are present)
      // @ts-ignore
      const prettier = await import('prettier/standalone');
      // @ts-ignore
      const babel = await import('prettier/plugins/babel');
      // @ts-ignore
      const estree = await import('prettier/plugins/estree');
      // @ts-ignore
      const typescript = await import('prettier/plugins/typescript');
      // @ts-ignore
      const markdown = await import('prettier/plugins/markdown');
      this.prettier = (prettier as any).format ? (prettier as any) : prettier;
      this.plugins = { babel, estree, typescript, markdown };
      this.loaded = true;
      return true;
    } catch {
      // Prettier not installed in this environment; fallback to no-op formatter
      this.loaded = false;
      return false;
    }
  }

  async format(code: string, filePath?: string): Promise<string> {
    const ok = await this.ensureLoaded();
    if (!ok) {
      // Fallback: trim trailing spaces and ensure LF endings
      return code
        .split('\n')
        .map((l) => l.replace(/[ \t]+$/g, ''))
        .join('\n')
        .replace(/\r\n/g, '\n');
    }
    let parser: SupportedParser = 'babel';
    if (filePath?.endsWith('.ts') || filePath?.endsWith('.tsx')) parser = 'typescript';
    if (filePath?.endsWith('.json')) parser = 'json';
    if (filePath?.endsWith('.md') || filePath?.endsWith('.mdx')) parser = 'markdown';

    try {
      const result = await this.prettify(code, parser);
      return result;
    } catch {
      return code;
    }
  }

  private async prettify(code: string, parser: SupportedParser): Promise<string> {
    return await this.prettier.format(code, {
      parser,
      plugins: Object.values(this.plugins),
      singleQuote: true,
      semi: true,
      trailingComma: 'es5',
      printWidth: 100,
    });
  }
}

export const prettierService = new PrettierService();


