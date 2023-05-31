import React from 'react';
import { InlineField, AsyncSelect, Select, SelectValue } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';
import { getBackendSrv } from '@grafana/runtime';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const proxy = datasource.proxy_url;

  const loadAsyncOptions = () => {
    // Load monitors list
    return new Promise<Array<SelectableValue<string>>>((resolve) => {
      getBackendSrv()
        .datasourceRequest({
          method: 'GET',
          url: `${proxy}/monitors`,
        })
        .then((res) => {
          const monitor_list = res.data.list.map((e: any) => ({ label: e.id, value: e.id, description: e.name }));
          resolve(monitor_list);
        });
    });
  };

  const onIdChange = (value: SelectValue<any>) => {
    onChange({ ...query, objId: value.value });
    onRunQuery();
  };

  const onTypeChange = (value: SelectValue<any>) => {
    onChange({ ...query, objType: value.value });
    onRunQuery();
  };

  const { objType, objId } = query;
  const options = [
    { label: 'Monitors', value: 'monitors' },
    { label: 'Reports', value: 'reports', description: 'list all reports' },
  ];
  return (
    <div className="gf-form">
      <InlineField label="Type" labelWidth={6}>
        <Select options={options} onChange={onTypeChange} width={30} value={objType} />
      </InlineField>
      <InlineField disabled={objType !== 'monitors'} label="Monitor ID">
        <AsyncSelect loadOptions={loadAsyncOptions} defaultOptions onChange={onIdChange} width={30} value={objId} />
      </InlineField>
    </div>
  );
}
