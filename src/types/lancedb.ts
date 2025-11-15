export interface LanceDB {
  connect(uri: string): Promise<LanceDBConnection>;
}

export interface LanceDBConnection {
  openTable(name: string, schema?: unknown): Promise<LanceDBTable>;
  tableNames(): Promise<string[]>;
  createTable(name: string, schema: unknown): Promise<LanceDBTable>;
}

export interface LanceDBTable {
  add(data: unknown[]): Promise<void>;
  search(query: number[]): LanceDBSearch;
  delete(filter: string): Promise<void>;
}

export interface LanceDBSearch {
  limit(n: number): LanceDBSearch;
  execute(): Promise<unknown[]>;
}
