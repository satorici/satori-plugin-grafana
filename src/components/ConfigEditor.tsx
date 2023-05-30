import React, { ChangeEvent } from 'react';
import { InlineField, Input } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const onPathChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      path: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (only sent to the backend)
  const onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        token: event.target.value,
      },
    });
  };


  const { jsonData } = options;

  return (
    <div className="gf-form-group">
      <InlineField label="Server" labelWidth={12}>
        <Input
          onChange={onPathChange}
          value={jsonData.path || ''}
          placeholder="https://api.satori-ci.com"
          width={40}
        />
      </InlineField>
      <InlineField label="API Key" labelWidth={12}>
        <Input
          value={jsonData.token || ''}
          placeholder="User token"
          width={40}
          onChange={onAPIKeyChange}
        />
      </InlineField>
    </div>
  );
}
