import { DataQuery, DataSourceJsonData } from '@grafana/data';

// Query editor Configuration
export interface MyQuery extends DataQuery {
  objType: string;
  objId: string;
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  objType: 'monitors',
  objId: '',
};

// Data Source Configuration
export interface MyDataSourceOptions extends DataSourceJsonData {
  path?: string;
}

export interface MySecureJsonData {
  apiKey?: string;
}
