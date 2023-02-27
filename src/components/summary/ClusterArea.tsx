import React = require('react');
import MyLocationIcon from '@material-ui/icons/MyLocation';
import { ScaleSequential } from 'd3-scale';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { appStore, InstanceData, Model } from '../../stores/appStore';
import { ClusterChart } from '../charts/ClusterChart';



export interface ClusterAreaProps {
    model: Model;
    colorDRPrediction: ScaleSequential<string>;
}

const DEFAULT_POINT_SIZE = 2;

type ColorFunctions = 'label' | 'prediction' | 'difference' | 'neighbors';

@observer
export class ClusterArea extends React.Component<ClusterAreaProps> {
    @observable private pointSize = DEFAULT_POINT_SIZE;
    @observable private clusterFunction = 'tsne';
    @observable private fillFunction: ColorFunctions = 'prediction';

    public render() {
        const { model, colorDRPrediction } = this.props;
        let fillFunc: (d: InstanceData) => string;
        const isNeighbor = (id: number) => !!appStore.neighborsOfSelection.find(n => n.id === id);
        switch (this.fillFunction) {
            case 'label': fillFunc = d => colorDRPrediction(d.y); break;
            case 'prediction': fillFunc = d => colorDRPrediction(model.getPrediction(d)); break;
            case 'difference': fillFunc = d => colorDRPrediction(d.y - model.getPrediction(d)); break;
            case 'neighbors': fillFunc = d => isNeighbor(d.id) ? colorDRPrediction(d.y) : "#cccccc";
        }

        return (
            <div className="bottom-right-wrapper">

                <ClusterChart {...this.props}
                    pointSize={this.pointSize}
                    clusterFunction={this.clusterFunction}
                    fillFunc={fillFunc}
                />

                <div className="bottom-right-dr-options">
                    <div className="right-wrapper-content" id="right-wrapper-header">
                        <div className="select">
                            <select
                                className="select-text select-text-dr" required
                                value={this.clusterFunction}
                                onChange={e => this.clusterFunction = e.target.value}
                            >
                                <option value="pca">PCA</option>
                                <option value="mds">MDS</option>
                                <option value="isomap">Isomap</option>
                                <option value="tsne">t-SNE</option>
                                <option value="umap">UMAP</option>
                                <option value="pdep_pca">PCA (GAM)</option>
                                <option value="pdep_mds">MDS (GAM)</option>
                                <option value="pdep_isomap">Isomap (GAM)</option>
                                <option value="pdep_tsne">t-SNE (GAM)</option>
                                <option value="pdep_umap">UMAP (GAM)</option>
                            </select>
                            <span className="select-highlight"></span>
                            <span className="select-bar select-bar-dr"></span>
                            <label className="select-label">Reduce by</label>
                        </div>
                        <div className="select">
                            <select
                                className="select-text select-text-dr" required
                                value={this.fillFunction}
                                onChange={e => this.fillFunction = e.target.value as ColorFunctions}
                            >
                                <option value="label">Actual</option>
                                <option value="prediction">Prediction</option>
                                <option value="difference">Difference</option>
                                <option value="neighbors">Neighbors</option>
                            </select>
                            <span className="select-highlight"></span>
                            <span className="select-bar select-bar-dr"></span>
                            <label className="select-label">Color by</label>
                        </div>
                        <div style={{ display: "flex" }}>
                            <div style={{ flex: 1, paddingRight: "20px" }}>
                                <button className="dr-home" onClick={_ => { this.pointSize = DEFAULT_POINT_SIZE; }}>
                                    <MyLocationIcon />
                                </button>
                            </div>
                            <div style={{ flex: 5, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <input type="range" min="0.5" max="10" step="0.1" value={this.pointSize} className="slider" id="dr-point-size-slider"
                                    onChange={e => { this.pointSize = e.target.valueAsNumber }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
