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
    this.server = instanceSettings.jsonData.path || 'https://api.satori-ci.com';
    this.token = instanceSettings.jsonData.token || '';
  }

  async apiRequest(query: MyQuery) {
    console.log('apiRequest:', query);
    let headers = new Headers({
      Authorization: this.token,
    });
    if (query.objId === undefined || query.objType === 'reports') {
      query.objId = '';
    }
    const result = await getBackendSrv().datasourceRequest({
      method: 'GET',
      url: `${this.server}/${query.objType}/${query.objId}`,
      params: query,
      headers: headers,
    });
    console.log('result:', result);
    let reports = [];
    if (query.objType === 'monitors') {
      reports = result.data.reports;
    } else {
      reports = [];
    }
    return reports;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    console.log('options:', options);
    const promises = options.targets.map((query) => {
      return this.apiRequest(query).then((reports) => {
        console.info('res:', reports);
        const frame = new MutableDataFrame({
          refId: query.refId,
          meta: {
            preferredVisualisationType: 'graph',
          },
          fields: [
            { name: 'Time', type: FieldType.time },
            { name: 'Fails', type: FieldType.number },
            { name: 'ID', type: FieldType.string },
            { name: 'Result', type: FieldType.string },
            { name: 'Status', type: FieldType.string },
            { name: 'Errors', type: FieldType.string },
          ],
        });

        reports.forEach((report: any) => {
          console.log('report', report);
          frame.appendRow([
            Date.parse(report.created),
            report.fails,
            report.uuid,
            report.result,
            report.status,
            report.comments,
          ]);
        });
        console.log('frame:', frame);
        return frame;
      });
    });
    console.log('promises:', promises);
    return Promise.all(promises).then((data) => {
      console.log('data:', data);
      return { data };
    });
  }

  async testDatasource() {
    // TODO: Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
