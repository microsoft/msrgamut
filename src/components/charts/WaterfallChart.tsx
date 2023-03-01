// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { extent, max, min } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { format } from 'd3-format';
import { scaleBand, scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { observer } from 'mobx-react';
import * as React from 'react';
import { appStore, InstanceFieldData } from '../../stores/appStore';
import { FeatureType } from '../../stores/featureStore';
import { getStylist } from '../../utils/stylist';
import { SvgTooltip } from '../common/svgtooltip';

const { styleDiv } = getStylist('SummaryArea');

const Container = styleDiv('Container', {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
});

const TOTAL_FEATURE = 'TOTAL';

export class WaterFallModel {
    data: InstanceFieldData[];
    intercept: number;
    waterfallData: CumulativeFieldData[] = [];

    constructor(data: InstanceFieldData[], intercept: number) {
        this.data = data;
        this.intercept = intercept;
        this.makeWaterfallData();
    }

    makeWaterfallData() {
        let cumulative = this.intercept;
        const model = appStore.model;
        for (let i = 0; i < this.data.length; i++) {
            if (model.getType(this.data[i].name) != FeatureType.Unused) {
                const pdep = this.data[i].pdep;
                this.waterfallData.push({ ...this.data[i], start: cumulative, end: cumulative + pdep });
                cumulative += pdep;
            }
        }
        this.waterfallData.push({
            name: TOTAL_FEATURE,
            end: cumulative,
            start: cumulative,
            X: 0, pdep: 0, confi_u_X: 0, confi_l_X: 0,
        });
    }

    getExtents(): [number, number] {
        const waterfallExtent: [number, number] = extent(this.waterfallData, d => d.end);
        return waterfallExtent;
    }
}

interface WaterfallChartProps {
    model: WaterFallModel;
    intercept: number;
    forceExtents: [number, number];
}

interface CumulativeFieldData extends InstanceFieldData {
    start: number;
    end: number;
}


@observer
export class WaterfallChart extends React.Component<WaterfallChartProps> {

    public render() {
        const { model, intercept, forceExtents } = this.props;
        const waterfallSVGWidth = 600;
        const waterfallSVGHeight = 250;

        const waterfallMargin = { top: 0, right: 20, bottom: 30, left: 50 };
        const waterfallWidth = waterfallSVGWidth - waterfallMargin.left - waterfallMargin.right;
        const waterfallHeight = waterfallSVGHeight - waterfallMargin.top - waterfallMargin.bottom;

        const waterfallX = scaleBand().rangeRound([0, waterfallWidth]).padding(0.1);
        const waterfallY = scaleLinear().range([waterfallHeight, 0]);

        const waterfallXAxis = axisBottom(waterfallX).ticks(5);
        const waterfallYAxis = axisLeft(waterfallY).tickSize(0).tickPadding(6);

        waterfallX.domain(model.waterfallData.map(d => d.name));
        //let waterfallExtent: [number, number] = model.getExtents();
        const waterfallExtent: [number, number] = forceExtents;
        // go to 10% below and above intercept or min,max values
        const domainpad: number = (forceExtents[1] - forceExtents[0]) * 0.1;
        waterfallY.domain([min([intercept - domainpad, forceExtents[0] - domainpad]), max([intercept + domainpad, forceExtents[1] + domainpad])]);
        //waterfallY.domain([min([intercept, forceExtents[0]]), max([intercept, forceExtents[1]])]);
        //waterfallY.domain([min([0, forceExtents[0]]), max([intercept, forceExtents[1]])]);
        ////waterfallY.domain([min([0, waterfallExtent[0]]), max([intercept, waterfallExtent[1]])]);
        const formatComma = format(',.2f');

        const hoverData = appStore.hoverFeature ? model.waterfallData.find(d => d.name === appStore.hoverFeature) : undefined;

        return (
            <Container style={{ padding: '10px' }}>
                <svg className="waterfall-chart" width={waterfallSVGWidth} height={waterfallSVGHeight}>

                    <g transform={`translate(${waterfallMargin.left},${waterfallMargin.top})`}>

                        <line className="zeroline"
                            x1={0} y1={waterfallY(0)}
                            x2={waterfallX(TOTAL_FEATURE)} y2={waterfallY(0)}
                            style={{ visibility: min([0, waterfallExtent[0]]) < 0 ? 'visible' : 'hidden' }} />

                        <line className="intercept-line"
                            x1={0} y1={waterfallY(intercept)}
                            x2={waterfallX(TOTAL_FEATURE)} y2={waterfallY(intercept)} />

                        <text x={waterfallX(TOTAL_FEATURE) - 5} y={waterfallY(intercept)} dy="-0.25em" textAnchor="end">Intercept</text>

                        {
                            model.waterfallData.map(d =>
                                <g key={d.name} className="waterfall-bar" transform={`translate(${waterfallX(d.name)},0)`}>
                                    <rect
                                        className={`waterfall-bar-rect bar bar--${d.pdep < 0 ? 'negative' : 'positive'} ${d.name === appStore.hoverFeature ? 'hover' : ''}`}
                                        y={waterfallY(Math.max(d.start, d.end))}
                                        height={d.name === 'intercept' ? 5 : Math.abs(waterfallY(d.start) - waterfallY(d.end))}
                                        width={waterfallX.bandwidth()}
                                        onMouseOver={_ => appStore.hoverFeature = d.name}
                                        onMouseLeave={_ => appStore.hoverFeature = undefined}
                                        onClick={_ => {
                                            appStore.setFeatureVisibility(d.name, true);
                                            appStore.setFocusedFeature(d.name);

                                        }
                                        }
                                    />
                                </g>)
                        }

                        <g id="waterfall-x-axis"
                            transform={`translate(0,${waterfallHeight})`}
                            ref={g => select(g)
                                .call(waterfallXAxis)
                                .selectAll('text')
                                .attr('y', 0)
                                .attr('x', 9)
                                .attr('dy', '1em')
                                .attr('transform', 'rotate(45)')
                                .style('text-anchor', 'start')
                                .style('font-size', '12px')}
                        />

                        <g id="waterfall-y-axis"
                            transform="translate(0,0)"
                            ref={g => select(g).call(waterfallYAxis)}
                        />

                        {
                            hoverData ?
                                <SvgTooltip
                                    x={waterfallX(hoverData.name)}
                                    y={waterfallY(Math.max(hoverData.start, hoverData.end)) - 60}
                                    lines={[
                                        `${hoverData.name}: ${hoverData.X}`,
                                        `Contrib: ${formatComma(hoverData.pdep)}`,
                                    ]}
                                />
                                : null
                        }
                    </g>
                </svg>
            </Container>
        );
    }
}


