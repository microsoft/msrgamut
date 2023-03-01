// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { descending } from 'd3-array';
import { format } from 'd3-format';
import { ScaleSequential } from 'd3-scale';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { appStore, InstanceData, InstanceFieldData, Model } from '../../stores/appStore';
import { FeatureDiffChart } from '../charts/FeatureDiffChart';
import { WaterfallChart, WaterFallModel } from '../charts/WaterfallChart';


export interface InstanceAreaProps {
    colorDRPrediction: ScaleSequential<string>;
    model: Model;
}

const headerStyle: React.CSSProperties = { padding: '0px 10px' };

@observer
export class InstanceArea extends React.Component<InstanceAreaProps> {
    @observable sortOrder: string = 'Absolute Contribution';
    sortOrders = ['Contribution', 'Absolute Contribution', 'Differences'];


    public instanceArea(anInstance: InstanceData, watModel: WaterFallModel, extent: [number, number]) {
        const formatComma = format(',.2f');
        const { model } = this.props;
        const prediction = model.getPrediction(anInstance);
        const instanceHeader = (anInstance === null) ? <div style={headerStyle}>Differences: </div> :
            <div style={headerStyle}>
                <div style={{ display: 'flex', float: 'left', paddingTop: '5px' }}>
                    Instance <span style={{ paddingLeft: '5px', paddingRight: '50px' }} >{anInstance.id}</span>
                </div>

                <div style={{ display: 'flex', padding: '0px', flexDirection: 'row' }}>
                    <div style={{ display: 'flex', paddingBottom: '5px' }}>
                        <div className="label" >Actual:</div>
                        <div className="value-label">
                            {formatComma(anInstance.y)}
                            <div className="colorbox" style={{ backgroundColor: this.props.colorDRPrediction(anInstance.y) }}></div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', paddingBottom: '5px' }}>
                        <div className="label" style={{ padding: '5px' }}>Prediction:</div>
                        <div className="value-label">
                            {formatComma(prediction)}
                            <div className="colorbox" style={{ backgroundColor: this.props.colorDRPrediction(prediction) }}></div>
                        </div>
                    </div>
                </div>
            </div>;
        const instanceBody = (anInstance === null) ?
            <FeatureDiffChart data={watModel.data} intercept={model.intercept} /> :
            <WaterfallChart model={watModel} intercept={model.intercept} forceExtents={extent} />;


        return (
            <div style={{ paddingBottom: '30px' }}>
                {instanceHeader}
                {instanceBody}
            </div>);
    }

    public differenceArea(theData: InstanceFieldData[]) {
        const { model } = this.props;
        const instanceHeader = <div style={headerStyle}>Differences: </div>;
        const instanceBody = <FeatureDiffChart data={theData} intercept={model.intercept} />;

        return (
            <div style={{ paddingBottom: '30px' }}>
                {instanceHeader}
                {instanceBody}
            </div>);
    }

    simpleOutArea(anInstance: InstanceData): JSX.Element {
        const { model } = this.props;
        const instanceData = anInstance.data.slice();

        if (this.sortOrder === 'Contribution') {
            instanceData.sort((x, y) => descending(x.pdep, y.pdep));
        } else if (this.sortOrder === 'Absolute Contribution') {
            instanceData.sort((x, y) => descending(Math.abs(x.pdep), Math.abs(y.pdep)));
        }
        const myWat1 = new WaterFallModel(instanceData, model.intercept);
        const [minx, maxx] = myWat1.getExtents();

        return (this.instanceArea(anInstance, myWat1, [minx, maxx]));
    }

    compoundOutArea(instance1: InstanceData, instance2: InstanceData): JSX.Element {
        const { model } = this.props;
        const instanceData1: InstanceFieldData[] = instance1.data.slice();
        const instanceData2: InstanceFieldData[] = instance2.data.slice();
        const differenceData: InstanceFieldData[] = instanceData1.map(obj => {
            const ele = instanceData2.find(d => d.name === obj.name);
            const newele = { ...ele };
            newele.pdep = obj.pdep - newele.pdep;
            return (newele);
        });

        // if sorting by either Contribution or Absolute Contribution, then sort the primary results first by that order
        if (this.sortOrder === 'Contribution') {
            instanceData1.sort((x, y) => descending(x.pdep, y.pdep));
        } else if (this.sortOrder === 'Absolute Contribution') {
            instanceData1.sort((x, y) => descending(Math.abs(x.pdep), Math.abs(y.pdep)));
        }
        // if NOT sorting by Differences, sort the secondary results AND difference by the primary order
        if (this.sortOrder !== 'Differences') {
            if (instanceData2) {
                instanceData2.sort((x, y) => instanceData1.findIndex(e => e.name === x.name) - instanceData1.findIndex(e => e.name === y.name));
                differenceData.sort((x, y) => instanceData1.findIndex(e => e.name === x.name) - instanceData1.findIndex(e => e.name === y.name));
            }
        } else {
            // else sort all three by magnitude of differences
            differenceData.sort((x, y) => descending(Math.abs(x.pdep), Math.abs(y.pdep)));
            instanceData1.sort((x, y) => differenceData.findIndex(e => e.name === x.name) - differenceData.findIndex(e => e.name === y.name));
            instanceData2.sort((x, y) => differenceData.findIndex(e => e.name === x.name) - differenceData.findIndex(e => e.name === y.name));
        }

        const myWat1 = new WaterFallModel(instanceData1, model.intercept);
        const [minx1, maxx1] = myWat1.getExtents();

        const myWat2 = new WaterFallModel(instanceData2, model.intercept);
        const [minx2, maxx2] = myWat2.getExtents();

        const minx = Math.min(minx1, minx2);
        const maxx = Math.max(maxx1, maxx2);

        const instanceArea1: JSX.Element = this.instanceArea(appStore.selectedInstance, myWat1, [minx, maxx]);
        const instanceArea2: JSX.Element = (instance2 != null) ? this.instanceArea(appStore.selectedInstance2, myWat2, [minx, maxx]) : <div> </div>;

        const instanceAreaDiff = (instance2 != null) ? this.differenceArea(differenceData) : <div> </div>;

        return (<div>
            {instanceArea1}
            {instanceArea2}
            {instanceAreaDiff}
        </div>);
    }

    public render() {
        const instance = appStore.selectedInstance;
        const instance2 = appStore.selectedInstance2;
        if (!instance) { return null; }
        let outputArea: JSX.Element = null;
        if (instance2 == null) {
            outputArea = this.simpleOutArea(instance);
        } else {
            outputArea = this.compoundOutArea(instance, instance2);
        }


        return (
            <div className="instance-area">
                <div className="right-wrapper-content">
                    <label htmlFor="sortOrder">Sort Features By:</label>
                    <select
                        id="sortOrder"
                        value={this.sortOrder}
                        onChange={e => this.sortOrder = e.target.value}>
                        {
                            this.sortOrders.map(name =>
                                <option key={name} value={name}>{name}</option>)
                        }
                    </select>
                </div>
                {outputArea}
            </div>
        );
    }
}


// <FlagChart data={data}
// <NeighborList colorDRPrediction={this.props.colorDRPrediction} />
// interface NeighborListProps {
//     colorDRPrediction: ScaleSequential<string>;
// }

// @observer
// class NeighborList extends React.Component<NeighborListProps> {
//     public render() {
//         const neighbors = fredAppStore.neighborsOfSelection;
//         const instanceDistanceScale = scaleLinear().domain([0, 1]).range([100, 0]).clamp(true);
//         return [
//             <div id="neighbors-title" className="right-wrapper-content">
//                 <div className="select">
//                     <select id='nearest-neighbors' className="select-text" required
//                         value={fredAppStore.featureSpace}
//                         onChange={e => fredAppStore.setFeatureSpace(e.target.value)}>
//                         <option value="feature">Feature space</option>
//                         <option value="gam">GAM space</option>
//                     </select>
//                     <span className="select-highlight"></span>
//                     <span className="select-bar"></span>
//                     <label className="select-label">Nearest neighbors in</label>
//                 </div>
//             </div>,
//             <div id="instance-list-wrapper">
//                 {
//                     neighbors.map(neighbor =>
//                         <div key={neighbor.id}
//                             className="instance"
//                             onClick={_ => fredAppStore.updateSelection(neighbor.id)}
//                         >
//                             <div style={{ display: "flex", justifyContent: "space-between" }}>
//                                 <div className="neighbor-id"
//                                     style={{ display: "flex", justifyContent: "space-between" }}>
//                                     {neighbor.id}
//                                 </div>
//                                 <div className="neighbor-label"
//                                     style={{ backgroundColor: this.props.colorDRPrediction(fredAppStore.getPrediction(neighbor)) }}>
//                                     {neighbor.y.toFixed(2)}
//                                 </div>
//                             </div>
//                             <div className="instance-distance-bar"
//                                 style={{
//                                     width: instanceDistanceScale(neighbor.distance) + "%",
//                                     backgroundColor: this.props.colorDRPrediction(fredAppStore.getPrediction(neighbor))
//                                 }}>{"\u00A0"}</div>
//                         </div>)
//                 }
//             </div>
//         ];
//     }
//}
