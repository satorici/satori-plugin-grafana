import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  ThresholdsMode,
  MappingType,
  SpecialValueMatch,
  TimeRange,
} from '@grafana/data';

import { getBackendSrv } from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  proxy_url?: string;
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.proxy_url = instanceSettings.url;
  }

  async apiRequest(query: MyQuery, range: TimeRange) {
    //Convert to mysql compatible dates
    const format_date = 'YYYY-MM-DD HH:mm:ss';
    const from = range.from.format(format_date);
    const to = range.to.format(format_date);

    if (query.objId === undefined || query.objType === 'reports') {
      query.objId = '';
    }
    const url = `${this.proxy_url}/${query.objType}/${query.objId}`;
    const result = await getBackendSrv().datasourceRequest({
      method: 'GET',
      url: url,
      params: { limit: 100, from: from, to: to },
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
        user: c.report.user,
      }));
    }
    return reports;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const promises = options.targets.map((query) => {
      return this.apiRequest(query, options.range).then((reports) => {
        const frame = new MutableDataFrame({
          refId: query.refId,
          meta: { preferredVisualisationType: 'graph' },
          fields: [
            { name: 'Time', type: FieldType.time },
            {
              name: 'Fails',
              type: FieldType.number,
              config: {
                decimals: 0,
                thresholds: {
                  mode: ThresholdsMode.Absolute,
                  steps: [
                    { color: 'green', value: -Infinity },
                    { color: 'red', value: 1 },
                  ],
                },
                color: { mode: 'thresholds', seriesBy: 'last' },
                min: 0,
                mappings: [
                  {
                    type: MappingType.SpecialValue,
                    options: {
                      match: SpecialValueMatch.Null,
                      result: {
                        color: 'yellow',
                        index: 0,
                      },
                    },
                  },
                  {
                    type: MappingType.ValueToText,
                    options: {
                      '0': {
                        color: 'green',
                        index: 1,
                      },
                    },
                  },
                  {
                    type: MappingType.RangeToText,
                    options: {
                      from: 1,
                      to: Infinity,
                      result: {
                        color: 'red',
                        index: 2,
                      },
                    },
                  },
                ],
              },
            },
            {
              name: 'ID',
              type: FieldType.string,
              config: {
                links: [
                  {
                    url: 'https://www.satori-ci.com/report_details/?n=${__value.text}',
                    title: 'View Report',
                    targetBlank: true,
                  },
                ],
              },
            },
            {
              name: 'Result',
              type: FieldType.string,
              config: {
                mappings: [
                  {
                    type: MappingType.RegexToText,
                    options: {
                      pattern: '^Pass.+',
                      result: {
                        color: 'green',
                        index: 0,
                      },
                    },
                  },
                  {
                    type: MappingType.RegexToText,
                    options: {
                      pattern: '^Fail.+',
                      result: {
                        color: 'red',
                        index: 1,
                      },
                    },
                  },
                ],
              },
            },
            { name: 'Status', type: FieldType.string },
            { name: 'Errors', type: FieldType.string },
          ],
        });
        if (query.objType === 'reports') {
          frame.addField({ name: 'User', type: FieldType.string });
        }

        reports.forEach((report: any) => {
          const row = [
            Date.parse(report.created),
            report.fails,
            report.uuid,
            report.result,
            report.status,
            report.comments,
          ];
          if (query.objType === 'reports') {
            row.push(report.user);
          }
          frame.appendRow(row);
        });
        return frame;
      });
    });
    return Promise.all(promises).then((data) => ({ data }));
  }

  async testDatasource() {
    // !Dont catch errors manually
    return getBackendSrv()
      .datasourceRequest({
        method: 'GET',
        url: `${this.proxy_url}`,
      })
      .then((result) => {
        if (result.ok) {
          return {
            status: 'success',
            message: 'Success',
          };
        } else {
          throw new Error('Failed to access to API');
        }
      });
  }
}
