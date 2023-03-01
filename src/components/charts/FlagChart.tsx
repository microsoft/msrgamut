// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { extent } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleBand, scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { observer } from 'mobx-react';
import * as React from 'react';
import { InstanceFieldData } from '../../stores/appStore';
import { getStylist } from '../../utils/stylist';

const { styleDiv } = getStylist('SummaryArea');

const Container = styleDiv('Container', {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
});

interface FlagChartProps {
    data: InstanceFieldData[];
}

@observer
export class FlagChart extends React.Component<FlagChartProps> {
    public render() {
        const flagSVGWidth = 600;
        const flagSVGHeight = 400;
        const flagMargin = { top: 0, right: 20, bottom: 20, left: 20 };
        const flagWidth = flagSVGWidth - flagMargin.left - flagMargin.right;
        const flagHeight = flagSVGHeight - flagMargin.top - flagMargin.bottom;

        const flagX = scaleLinear()
            .range([0, flagWidth]);

        const flagY = scaleBand()
            .rangeRound([0, flagHeight])
            .padding(0.1);

        const flagXAxis = axisBottom(flagX).ticks(5);
        const flagYAxis = axisLeft(flagY).tickSize(0).tickPadding(6);

        const data = this.props.data;
        const pdepExtent: [number, number] = extent(data, d => d.pdep);
        const maxPdep = Math.max.apply(null, pdepExtent.map(Math.abs));

        flagX.domain([-1 * maxPdep, maxPdep]).nice();
        flagY.domain(data.map(d => d.name));

        return (
            <Container>
                <svg className="flag-chart" width={flagSVGWidth} height={flagSVGHeight}>
                    <g transform={`translate(${flagMargin.left},${flagMargin.top})`}>

                        {
                            data.map(d =>
                                <rect key={d.name}
                                    className={`flag bar bar--${d.pdep < 0 ? 'negative' : 'positive'}`}
                                    x={flagX(Math.min(0, d.pdep))}
                                    y={flagY(d.name)}
                                    width={Math.abs(flagX(d.pdep) - flagX(0))}
                                    height={flagY.bandwidth()}
                                />)
                        }

                        <g id="flag-x-axis"
                            className="x axis"
                            transform={`translate(0,${flagHeight})`}
                            ref={g => select(g).call(flagXAxis)}
                        />

                        <g id="flag-y-axis"
                            className="y axis"
                            transform={`translate(${flagX(0)},0)`}
                            ref={g => select(g).call(flagYAxis)}
                        />
                    </g>
                </svg>
            </Container>
        );
    }
}
