// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IconButton } from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { extent, max, min } from 'd3-array';
import { scaleSequential } from 'd3-scale';
import { interpolateCool } from 'd3-scale-chromatic';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import SplitPane from 'react-split-pane';
import { ChartArea } from '../components/charts/ChartArea';
import { InstanceArea } from '../components/summary/InstanceArea';
import { Model } from '../stores/appStore';
//import { ClusterArea } from './summary/ClusterArea';
import { InstanceTable } from './table/InstanceTable';

export interface ContentProps {
    model: Model;
}

@observer
export class Content extends React.Component<ContentProps> {
    @observable instanceAreaSize = new SizeVariable(COLLAPSED);
    @observable shapeChartAreaSize = new SizeVariable();

    public render() {
        const { model } = this.props;
        if (!model) { return <div></div>; }
        const instances = model.instanceData;
        const actualExtent = extent(instances, d => d.y);
        const predictionExtent = extent(instances, d => +model.getPrediction(d));
        const colorDRPrediction = scaleSequential(interpolateCool)
            .domain([min([actualExtent[0], predictionExtent[0]]), max([actualExtent[1], predictionExtent[1]])]);

        return (
            <SplitPane split="vertical" defaultSize="50%" pane2Style={{ overflow: 'auto' }}  >
                <SplitPane split="horizontal"
                    size={this.shapeChartAreaSize.size}
                    onChange={size => this.shapeChartAreaSize.size = size}
                    pane2Style={{ overflowY: 'auto' }}
                >
                    <ChartArea colorDRPrediction={colorDRPrediction} />
                    <SplitPaneCollapser sizeVariable={this.shapeChartAreaSize} >
                        <InstanceTable colorDRPrediction={colorDRPrediction} instances={model.instances} attributes={model.attributes} />
                    </SplitPaneCollapser>
                </SplitPane>
                {/*
                <SplitPane split="horizontal"
                    size={this.instanceAreaSize.size}
                    onChange={size => this.instanceAreaSize.size = size}
                    pane2Style={{ overflowY: 'auto' }}
                >
                */}
                <InstanceArea colorDRPrediction={colorDRPrediction} model={model} />
                {/*
                    <SplitPaneCollapser sizeVariable={this.instanceAreaSize} >
                        <ClusterArea colorDRPrediction={colorDRPrediction} model={model} />
                    </SplitPaneCollapser>
                </SplitPane>
                */}
            </SplitPane >
        );
    }
}


class SizeVariable {
    @observable public size: number | string = EXPANDED;
    constructor(size: string = EXPANDED) { this.size = size; }
}


class CollapserProps {
    sizeVariable: SizeVariable;
}

const COLLAPSED = '97%';
const EXPANDED = '50%';

@observer
class SplitPaneCollapser extends React.Component<CollapserProps> {
    public render() {
        const collapsed = this.props.sizeVariable.size === COLLAPSED;
        return [
            <div className="collapser-icon" key="collapser">
                {collapsed ?
                    <IconButton onClick={_ => { this.props.sizeVariable.size = EXPANDED; }} title="Expand" ><ExpandLess fontSize="small" /></IconButton> :
                    <IconButton onClick={_ => { this.props.sizeVariable.size = COLLAPSED; }} title="Collapse" ><ExpandMore fontSize="small" /></IconButton>}
            </div>,
            collapsed ? null : this.props.children,
        ];
    }
}
