import React, { ChangeEvent } from 'react';
import { InlineField, Input, Select, SelectValue } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const onIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log('q:', query);
    onChange({ ...query, objId: event.target.value });
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
  console.log('obj:', objId);
  return (
    <div className="gf-form">
      <InlineField label="Type" labelWidth={6}>
        <Select options={options} onChange={onTypeChange} width={30} value={objType} />
      </InlineField>
      <InlineField disabled={objType === 'reports'} label={objType ? capitalize(objType.slice(0, -1)) + ' ID' : ''}>
        <Input onChange={onIdChange} value={objId} />
      </InlineField>
    </div>
  );
}

function capitalize(str: string): string {
  return [...str][0].toUpperCase() + str.slice(1);
}
