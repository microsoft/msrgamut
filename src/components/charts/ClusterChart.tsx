import { extent } from 'd3-array';
import { axisBottom } from 'd3-axis';
import { scaleLinear, ScaleSequential } from 'd3-scale';
import { select } from 'd3-selection';
import { observer } from 'mobx-react';
import * as React from 'react';
import { appStore, InstanceData, Model } from '../../stores/appStore';
import { getStylist } from '../../utils/stylist';

const { styleDiv } = getStylist('SummaryArea');

const Container = styleDiv('Container', {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
});

export interface ClusterChartProps {
    model: Model;
    fillFunc: (d: InstanceData) => string;
    pointSize: number;
    clusterFunction: string;
    colorDRPrediction: ScaleSequential<string>;
}

@observer
export class ClusterChart extends React.Component<ClusterChartProps> {
    public render() {
        const { model } = this.props;
        const instances = model.instanceData;

        let drColorBarHeight = 25;
        const drSVGWidth = 375;
        const drSVGHeight = 375 + drColorBarHeight;

        const drMargin = { top: 20, right: 20, bottom: 20, left: 20 };
        const drWidth = drSVGWidth - drMargin.left - drMargin.right;
        const drHeight = drSVGHeight - drMargin.top - drMargin.bottom - drColorBarHeight;

        const drX = scaleLinear().range([0, drWidth]);
        const drY = scaleLinear().range([0, drHeight]);

        // const drXAxis = d3.axisBottom(drX).ticks(5);
        // const drYAxis = d3.axisLeft(drY).ticks(5);

        const clusterFunc = (d: InstanceData) => d.dr[this.props.clusterFunction];
        const drExtentx = extent(instances, d => clusterFunc(d)[0]);
        const drExtenty = extent(instances, d => clusterFunc(d)[1]);

        drX.domain(drExtentx);
        drY.domain(drExtenty);

        // let differences = instances.map(inst => inst.y - fredAppStore.getPrediction(inst));

        // let colorDRLabel = d3.scaleSequential(d3.interpolateCool)
        //     .domain(d3.extent(instances, d => +d.y));
        // let colorDRDifference = d3.scaleSequential(d3.interpolateCool)
        //     .domain(d3.extent(differences))
        const drColorBarMargin = { top: 0, right: 20, bottom: 20, left: 20 };
        const drColorBarWidth = drSVGWidth - drColorBarMargin.left - drColorBarMargin.right;
        drColorBarHeight = drColorBarHeight - drColorBarMargin.top - drColorBarMargin.bottom;

        function linspace(start: number, end: number, n: number) {
            const out = [];
            const delta = (end - start) / (n - 1);

            let i = 0;
            while (i < (n - 1)) {
                out.push(start + (i * delta));
                i++;
            }

            out.push(end);
            return out;
        }

        const { colorDRPrediction } = this.props;
        const drColorBarSamplePoints = linspace(colorDRPrediction.domain()[0], colorDRPrediction.domain()[1], 100);
        const tempScale = scaleLinear().domain(colorDRPrediction.domain()).range([0, drColorBarWidth]);
        const tempAxis = axisBottom(tempScale).ticks(5);

        return (
            <Container>
                <svg width={drSVGWidth} height={drSVGHeight}>
                    <defs>
                        <linearGradient id="svgGradient-drColorBar" x1="0%" x2="100%" y1="0%" y2="0%">
                            {
                                drColorBarSamplePoints.map((d, i) =>
                                    <stop key={i}
                                        offset={i / (drColorBarSamplePoints.length - 1)}
                                        stopColor={colorDRPrediction(d)} />)
                            }
                        </linearGradient>
                    </defs>
                    <g transform={`translate(${drMargin.left},${drMargin.top})`}>
                        {
                            instances.map(d =>
                                <circle key={d.id}
                                    className="dr-point dr-point-unvisited"
                                    r={this.props.pointSize}
                                    cx={drX(clusterFunc(d)[0])}
                                    cy={drY(clusterFunc(d)[1])}
                                    fill={this.props.fillFunc(d)}
                                    onClick={_ => appStore.updateSelection(d.id)}
                                />)
                        }
                    </g>
                    <g transform={`translate(${drColorBarMargin.left},${(drHeight + drMargin.top + drMargin.bottom / 2 + drColorBarMargin.top)})`}>
                        <rect width={drColorBarWidth} height={drColorBarHeight} fill="url(#svgGradient-drColorBar)" />
                        <g className="x axis"
                            transform={`translate(0,${drColorBarHeight})`}
                            ref={g => select(g).call(tempAxis)}
                        />
                    </g>
                </svg>
            </Container>
        );
    }
}
