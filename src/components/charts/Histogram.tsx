/**
 * Copyright (c) Microsoft. All rights reserved.
 */

import { extent, max } from 'd3-array';
import { axisBottom } from 'd3-axis';
import { scaleBand, scaleLinear } from 'd3-scale';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Axis } from '../../components/charts/Axis';
import { IItem } from '../../stores';
import { riskScoreColorScale } from '../../utils/palette';
import { getStylist } from '../../utils/stylist';

const { styleRect } = getStylist('Chart');

const SliceRect = styleRect<{ selected: boolean }>(
    'SliceRect',
    {},
    ({ customProps }) =>
        customProps.selected
            ? {
                stroke: customProps.selected ? 'yellow' : 'transparent',
                strokeWidth: customProps.selected ? 2 : 0,
                cursor: 'pointer',
                $nest: {
                    '&:hover': {
                        stroke: 'red',
                        strokeWidth: 2,
                    },
                },
            }
            : null,
);

const chartPadding = { top: 10, right: 20, bottom: 20, left: 40 };

export interface IHistogramProps {
    items: ReadonlyArray<IItem>;
    featureExtent?: number[];
    binCount?: number;
    width?: number;
    height?: number;
    onSelectItem?: (item: IItem) => void;
    selectedItem?: IItem;
}

interface IBin {
    slices: IItem[][];
    total: number;
}
@observer
export class Histogram extends React.Component<IHistogramProps> {
    public render() {
        const { width = 200, height = 75, items, binCount = 20, featureExtent } = this.props;

        const innerWidth = width - chartPadding.left - chartPadding.right;
        const innerHeight = height - chartPadding.top - chartPadding.bottom;

        const xExtent = featureExtent || extent(items, i => i.x);
        const binMin = xExtent[0];
        const binMax = xExtent[1];
        const binSize = (binMax - binMin) / binCount;
        const sliceCount = 10;
        const sliceMin = 0;
        const sliceMax = 1;
        const sliceSize = (sliceMax - sliceMin) / sliceCount;

        const bins: IBin[] = [...Array(binCount)].map(_ => {
            return { slices: [...Array(sliceCount)].map(_ => []), total: 0 };
        });

        const getBinId = (x: number) => Math.min(Math.max(0, Math.floor((x - binMin) / binSize)), binCount - 1);

        const getSliceId = (x: number) => Math.min(Math.max(0, Math.floor((x - sliceMin) / sliceSize)), sliceCount - 1);

        items.forEach(item => {
            const binId = getBinId(item.x);
            const sliceId = getSliceId(item.prediction);
            bins[binId].slices[sliceId].push(item);
            bins[binId].total++;
        });

        const binScale = scaleBand<number>()
            .rangeRound([0, innerWidth])
            .paddingInner(0.05)
            .paddingOuter(0)
            .domain([...Array(binCount)].map((_, i) => i));

        const xScale = scaleLinear<number>()
            .rangeRound([0, innerWidth])
            .domain(xExtent);

        const yScale = scaleLinear()
            .rangeRound([innerHeight, 0])
            .domain([0, max(bins, bin => bin.total)]);

        const xAxis = axisBottom(xScale);
        const binWidth = binScale.bandwidth();

        const rects = bins.map((bin, iBin) => {
            let y = yScale(0);
            const x = binScale(iBin);
            return bin.slices.map((slice, iSlice) => {
                const sliceHeight = Math.max(0, y - yScale(slice.length));
                y = y - sliceHeight;
                return (
                    <SliceRect
                        key={`${iBin}-${iSlice}`}
                        x={x}
                        y={y}
                        width={binWidth}
                        height={sliceHeight}
                        fill={riskScoreColorScale(iSlice * sliceSize + sliceMin)}
                    />
                );
            });
        });

        return (
            <svg width={width} height={height}>
                <g transform={`translate(${chartPadding.left}, ${chartPadding.top})`}>
                    {rects}
                    <Axis axis={xAxis} translateY={innerHeight} />
                </g>
            </svg>
        );
    }
}
