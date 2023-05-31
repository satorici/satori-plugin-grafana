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
  proxy_url?: string;
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.proxy_url = instanceSettings.url;
  }

  async apiRequest(query: MyQuery) {
    if (query.objId === undefined || query.objType === 'reports') {
      query.objId = '';
    }
    const url = `${this.proxy_url}/${query.objType}/${query.objId}`;
    const result = await getBackendSrv().datasourceRequest({
      method: 'GET',
      url: url,
    });
    let reports = [];
    if (query.objType === 'monitors') {
      reports = result.data.reports;
    } else {
      reports = result.data.map((c: any) => ({
        created: c.report.date,
        fails: c.report.fails,
        uuid: c.report.uuid,
        result: c.report.result,
        status: c.status,
        comments: c.report.errors,
      }));
    }
    return reports;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const promises = options.targets.map((query) => {
      return this.apiRequest(query).then((reports) => {
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
          frame.appendRow([
            Date.parse(report.created),
            report.fails,
            report.uuid,
            report.result,
            report.status,
            report.comments,
          ]);
        });
        return frame;
      });
    });
    return Promise.all(promises).then((data) => ({ data }));
  }

  async testDatasource() {
    // TODO: Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
