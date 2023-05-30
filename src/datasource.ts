import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { getBackendSrv } from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  server: string;
  token: string;
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    console.log('instance:', instanceSettings);
    this.server = instanceSettings.jsonData.path || 'https://api.satori-ci.com';
    this.token = instanceSettings.jsonData.token || '';
  }

  async apiRequest(query: MyQuery) {
    console.log('apiRequest:', query);
    let myHeaders = new Headers({
      Authorization: this.token,
    });
    const result = await getBackendSrv().datasourceRequest({
      method: 'GET',
      url: this.server + '/monitors',
      params: query,
      headers: myHeaders,
    });

    return result;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    console.log('options:', options);
    const promises = options.targets.map((query) => {
      this.apiRequest(query).then((response) => {
        console.info(response.statusText);
        const frame = new MutableDataFrame({
          refId: query.refId,
          fields: [
            { name: 'Time', type: FieldType.time },
            { name: 'Value', type: FieldType.number },
          ],
        });

        response.data.forEach((point: any) => {
          frame.appendRow([point.time, point.value]);
        });

        return frame;
      });
    });
    return Promise.all(promises).then((data) => ({ data }));
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
