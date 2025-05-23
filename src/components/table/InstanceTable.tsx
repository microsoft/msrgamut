// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Button } from '@material-ui/core';
import { ColDef, GridApi, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'd3-format';
import { ScaleSequential } from 'd3-scale';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { FeatureType, Instance } from '../../stores';
import { appStore } from '../../stores/appStore';


export interface IInstanceTableProps {
    instances: ReadonlyArray<Instance>;
    attributes: ReadonlyArray<string>;
    colorDRPrediction: ScaleSequential<string>;
}

const numFormatter = (params: { value: number }) => format(',.2~f')(params.value);

const ColorCellRenderer: React.FC<ICellRendererParams> = (params) => {
    const backgroundColor = params.context.colorDRPrediction(params.value);
    const formattedText = numFormatter(params);

    return (
        <div>
            <div className="colorbox" style={{ backgroundColor }}></div>
            <span>{formattedText}</span>
        </div>
    );
};

@observer
export class InstanceTable extends React.Component<IInstanceTableProps> {
    // @observable private _orderBy: string;
    // @observable private _order: 'asc' | 'desc';
    @observable numDisplayed = 0;
    private api: GridApi;

    constructor(props: IInstanceTableProps) {
        super(props);
        this.numDisplayed = this.props.instances.length;
    }

    public render() {
        // const { instances, attributes } = this.props;

        //use variable declared in outer scope
        currentTableData = this.props.instances.slice();

        const common = { sortable: true, resizable: true };

        const columnDefs: ColDef[] = [
            { headerName: 'ID', field: 'id', sortable: true },
            { headerName: 'Actual', field: 'y', cellRenderer: ColorCellRenderer, type: 'numericColumn', valueFormatter: numFormatter, ...common },
            { headerName: 'Predicted', field: 'prediction', cellRenderer: ColorCellRenderer, type: 'numericColumn', valueFormatter: numFormatter, ...common },
            {
                headerName: 'Difference', type: 'numericColumn',
                valueGetter: (params: ValueGetterParams) => Math.abs(params.data.y - params.data.prediction),
                valueFormatter: numFormatter,
                ...common,
            },
            ...appStore.model.features
                .filter(f => f.name !== 'intercept')
                .map<ColDef>(f =>
                    ({
                        headerName: f.name, field: f.name,
                        filter: f.valueType === FeatureType.Numerical ? 'agNumberColumnFilter' : 'agTextColumnFilter',
                        type: f.valueType === FeatureType.Numerical ? 'numericColumn' : undefined,
                        ...common,
                    })),
        ];

        const defaultColDef = {
            width: 100,
            filter: 'agNumberColumnFilter',
        };
        return (
            <div className="instance-table-area">
                <div className="instance-table-options" key="options">
                    <span className="table-showing-count">
                        Showing <span id="table-selection-count">{this.numDisplayed}</span> of <span id="num-of-instances">{this.props.instances.length}</span>
                    </span>
                    <span style={{ paddingLeft: '20px' }}>
                        <Button size="small" variant="outlined"
                            onClick={_ => { if (this.api) { this.api.setFilterModel(null); } }}
                        >
                            Clear Filters
                        </Button>
                    </span>
                    <a href="#"
                        onClick={e => {
                            window.open('https://microsoft.github.io/SandDance/embed/v4/sanddance-embed.html', '_blank');
                            e.preventDefault();
                        }}
                        style={{ position: 'absolute', right: '0.5em', fontSize: '12px' }}>open in SandDance</a>
                </div>

                <div className="ag-theme-balham instance-table" key="table">
                    <AgGridReact
                        gridOptions={{
                            context: {
                                colorDRPrediction: this.props.colorDRPrediction,
                            },
                        }}
                        columnDefs={columnDefs}
                        rowData={currentTableData}
                        defaultColDef={defaultColDef}
                        rowSelection='multiple'
                        getRowId={r => r.data.id}
                        onRowSelected={e => {
                            if (e.node.isSelected()) {
                                if (e.api.getSelectedRows().length > 1) {
                                    const currentSelection = appStore.selectedInstance;
                                    const firstUnselected = e.api.getSelectedRows().find(r => r.id !== currentSelection.id);
                                    appStore.updateSelection2(firstUnselected.id);
                                } else {
                                    appStore.updateSelection(e.data.id);
                                }
                            }
                        }}
                        onGridReady={e => {
                            this.api = e.api;
                            e.api.autoSizeColumns(e.api.getColumns());

                            //remove elements which fail aria-required-children for .ag-root element
                            [
                                document.querySelector('.ag-body-horizontal-scroll'),
                                document.querySelector('.ag-overlay')
                            ].forEach(el => {
                                el.parentElement.removeChild(el);
                            });

                        }}
                        onFilterChanged={e => this.numDisplayed = e.api.getDisplayedRowCount()}
                    />
                </div>
            </div>
        );
    }

    // private _onSort = (column: string) => {
    //     let order: 'desc' | 'asc' = 'desc';
    //     if (this._orderBy === column && this._order === 'desc') {
    //         order = 'asc';
    //     }
    //     this._orderBy = column;
    //     this._order = order;
    // };

    // private _getSorting = (order: string, orderBy: string) => {
    //     return order === 'desc'
    //         ? (a: Instance, b: Instance) => (b[orderBy] < a[orderBy] ? -1 : 1)
    //         : (a: Instance, b: Instance) => (a[orderBy] < b[orderBy] ? -1 : 1);
    // };
}

let currentTableData: any[];

window.addEventListener('message', e => {
    if (e.origin === 'https://microsoft.github.io') {
        const { request } = e.data as { request: { action: string } };
        if (request) {
            switch (request.action) {
                case 'init': {
                    const data = currentTableData.map(d => {
                        return {
                            ...d,
                            Difference: Math.abs(d.y - d.prediction),
                        };
                    });
                    const message = {
                        data,
                        insight: {
                            chart: 'scatterplot',
                            columns: {
                                color: 'Difference',
                                x: 'prediction',
                                y: 'y',
                            },
                            scheme: 'redblue',
                        },
                    };
                    (e.source as Window).postMessage(message, '*');
                    break;
                }
            }
        }
    }
});
