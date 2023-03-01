// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { extent, histogram, max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { format } from 'd3-format';
import { scaleBand, scaleLinear, ScaleSequential } from 'd3-scale';
import { clientPoint, ContainerElement, select } from 'd3-selection';
import { curveLinear, curveStepAfter, line } from 'd3-shape';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import {
    BandScale,
    CategoricalShape,
    Feature,
    LinearScale,
    PiecewiseConstant,
    PiecewiseLinear,
    ShapePoint,
} from '../../stores';
import { appStore, InstanceData, InstanceFieldData } from '../../stores/appStore';
import { SvgTooltip } from '../common/svgtooltip';

const range = (n: number) => Array.from({ length: n }, (_, key) => key);

export interface ShapeChartProps {
    feature: Feature;
    commonYScale?: { min: number; max: number };
    colorDRPrediction: ScaleSequential<string>;
}

const HISTOGRAM_HEIGHT = 40;

interface Scale {
    (x: number): number;
    domain(): number[];
    bandwidth?(): number;
}

function invertBand(scale: BandScale, x: number): number {
    const rg = scale.range();
    if (x < rg[0] || x > rg[1]) return NaN;
    const index = Math.floor(((x - rg[0]) / (rg[1] - rg[0])) * scale.domain().length);
    return scale.domain()[index];
}

function fixupStepCurve(path: string): string {
    // example path: M1,77L74,77L74,77L147,77L147,77
    // this only works with rounded to integers which i problematic for scales with non rounding, perhaps either round AFTER scale or use better regular expression
    // like this: [-+]?[0-9]*\.?[0-9]+. instead of (\d+)

    // const match = /(\d+),(\d+)L(\d+),(\d+)L(\d+),(\d+)$/.exec(path);
    // const x = 2 * parseInt(match[5]) - parseInt(match[1]);

    const match = /([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)L([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)L([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)$/.exec(
        path,
    );
    const x = 2 * parseInt(match[5]) - parseInt(match[1]);
    return path + `L${x},${match[6]}`;
}

@observer
export class ShapeChart extends React.Component<ShapeChartProps> {
    @observable private showCrosshair = false;
    @observable private crosshairPosition: [number, number] = [0, 0];
    @observable private crosshairDomain: number;
    @observable private crosshairPrediction: number;
    @observable private showTooltip1 = false;
    @observable private showTooltip2 = false;

    @action
    public mouseMove(e: React.MouseEvent, feature: Feature, x: LinearScale | BandScale, y: LinearScale): void {
        const margin = { top: 0, right: 20, bottom: 0, left: 60 };
        const myContainer: ContainerElement = e.currentTarget as SVGSVGElement;
        const mouseX = clientPoint(myContainer, e)[0] - margin.left;

        this.crosshairDomain =
            feature.valueType === 'numerical' ? (x as LinearScale).invert(mouseX) : invertBand(x as BandScale, mouseX);

        this.crosshairPrediction = feature.getPrediction(this.crosshairDomain);
        if (!isNaN(this.crosshairPrediction)) {
            this.crosshairPosition = [mouseX, y(this.crosshairPrediction)];
        }
    }

    private getGradientId(feature: Feature) {
        return `svgGradient-${feature.name}`;
    }

    private defineColorGradient(feature: Feature, instance: InstanceData, instanceFieldData: InstanceFieldData) {
        const numOfColorSamplePoints = 10;
        const colorGradientScale = scaleLinear()
            .domain([0, numOfColorSamplePoints])
            .range([feature.minY, feature.maxY]);

        const predictionExtent = appStore.model.getPrediction(instance) - instanceFieldData.pdep;
        const samplePoints = range(numOfColorSamplePoints).map(i => predictionExtent + colorGradientScale(i));

        return (
            <linearGradient id={this.getGradientId(feature)} x1="0%" x2="100%" y1="0%" y2="0%">
                {samplePoints.map((d, i) => (
                    <stop key={i} offset={i / (samplePoints.length - 1)} stopColor={this.props.colorDRPrediction(d)} />
                ))}
            </linearGradient>
        );
    }

    public render() {
        const { feature } = this.props;
        if (!feature || !feature.shape) return null;

        const chartWidth = 300;
        let chartHeight = 150;
        const margin = { top: 0, right: 20, bottom: 0, left: 60 };

        const width = chartWidth - margin.left - margin.right;
        const height = chartHeight - margin.top - margin.bottom;

        const x = feature.shape.getScale(width);

        const yScale = this.props.commonYScale || { min: feature.minY, max: feature.maxY };
        const y = scaleLinear()
            .rangeRound([height, 0])
            .domain([yScale.min, yScale.max]);

        const instance = appStore.selectedInstance;
        const instanceFeatureData = instance ? instance.data.find(field => field.name === feature.name) : undefined;

        const instance2 = appStore.selectedInstance2;
        const instance2FeatureData = instance2 ? instance2.data.find(field => field.name === feature.name) : undefined;

        let histogram: JSX.Element = null;
        const shape = feature.shape;
        if (appStore.showHistograms) {
            histogram =
                shape instanceof PiecewiseConstant
                    ? this.renderNumericalHistogram(
                        appStore.model.instances.map(i => i[feature.name]),
                        chartWidth,
                        height,
                    )
                    : shape instanceof PiecewiseLinear
                        ? this.renderNumericalHistogram(
                            shape.pdep.map(p => p.x),
                            chartWidth,
                            height,
                        )
                        : shape instanceof CategoricalShape
                            ? // this.renderCategoricalHistogram(shape.histogram, chartWidth, height) :
                            this.renderCategoricalHistogram(appStore.model.gethistogram(feature.name), chartWidth, height)
                            : null;
            chartHeight += HISTOGRAM_HEIGHT;
        } else {
            chartHeight += 20;
        }

        const curve = !shape.isPiecewiseConstant ? curveLinear : curveStepAfter;
        const pdepLine = line<ShapePoint>()
            .x(d => x(d.x))
            .y(d => y(d.y))
            .curve(curve);
        const confiULine = line<ShapePoint>()
            .x(d => x(d.x))
            .y(d => y(d.y))
            .curve(curve);
        const confiLLine = line<ShapePoint>()
            .x(d => x(d.x))
            .y(d => y(d.y))
            .curve(curve);
        const fixup = !shape.isPiecewiseConstant ? (x: string) => x : fixupStepCurve;

        return (
            <svg
                className="shape-chart"
                width={chartWidth}
                height={chartHeight}
                onMouseEnter={_ => (this.showCrosshair = true)}
                onMouseLeave={_ => (this.showCrosshair = false)}
                onMouseMove={e => this.mouseMove(e, feature, x, y)}>
                <defs>
                    {instance && instanceFeatureData
                        ? this.defineColorGradient(feature, instance, instanceFeatureData)
                        : null}
                </defs>
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {histogram}

                    {/* <g className="axis shape-chart-axis" transform={`translate(0,${height})`} ref={g => select(g).call(axisBottom(x).ticks(5))} /> */}
                    <g
                        className="axis shape-chart-axis"
                        transform={`translate(0,${height})`}
                        ref={g =>
                            select(g)
                                .call(axisBottom(x).ticks(5))
                                .selectAll('text')
                                .attr('transform', 'rotate(45)')
                                .style('text-anchor', 'start')
                                .style('font-size', '10px')
                        }
                    />

                    <g className="axis" ref={g => select(g).call(axisLeft(y).ticks(5))} />
                    <line className="zeroline" x1={0} y1={y(0)} x2={width} y2={y(0)} />

                    <path className="confidence-line" d={fixup(confiULine(shape.upperConf))} />
                    <path className="confidence-line" d={fixup(confiLLine(shape.lowerConf))} />
                    <path
                        className="pdep"
                        d={fixup(pdepLine(shape.pdep))}
                        style={{ stroke: `url(#${this.getGradientId(feature)})` }}
                    />

                    {this.renderCrosshair(instanceFeatureData, x, y, height)}

                    {instance2FeatureData
                        ? this.renderInstancePoint(
                            feature,
                            instance2.id,
                            instance2FeatureData,
                            'square',
                            this.showTooltip2,
                            x,
                            y,
                        )
                        : null}
                    {instanceFeatureData
                        ? this.renderInstancePoint(
                            feature,
                            instance.id,
                            instanceFeatureData,
                            'circle',
                            this.showTooltip1,
                            x,
                            y,
                        )
                        : null}
                </g>
            </svg>
        );
    }

    private renderCrosshair(datum: InstanceFieldData, x: Scale, y: Scale, height: number) {
        if (!this.showCrosshair || isNaN(this.crosshairDomain) || isNaN(this.crosshairPrediction)) {
            return null;
        }

        const crosshairX = this.crosshairPosition[0];
        const crosshairY = this.crosshairPosition[1];
        const crosshairColor = this.props.colorDRPrediction(this.crosshairPrediction);
        const formatComma = format(',.2f');
        const formatDiff = format('+,.2f');

        return (
            <g>
                <line className="crosshair X" x1={crosshairX} y1={y(y.domain()[0])} x2={crosshairX} y2={crosshairY} />
                <line
                    className="crosshair Y"
                    x1={x(x.domain()[0])}
                    y1={crosshairY}
                    x2={crosshairX}
                    y2={crosshairY}
                    stroke={crosshairColor}
                />
                <circle
                    cx={crosshairX}
                    cy={crosshairY}
                    r="5"
                    fill={crosshairColor}
                    style={{ strokeWidth: '2px', stroke: '#ffffff' }}
                />
                <text className="crosshairX-text" x={crosshairX + 5} y={height - 3}>
                    {formatDiff(this.crosshairDomain - (datum ? datum.X : 0))}
                </text>
                <text className="crosshairY-text" x={crosshairX + 15} y={crosshairY} fill={crosshairColor}>
                    {`=${formatComma(this.crosshairPrediction)}`}
                </text>
            </g>
        );
    }

    private renderNumericalHistogram(xs: number[], chartWidth: number, height: number) {
        const histWidth = chartWidth;
        const histMargin = { top: 0, right: 20, bottom: 0, left: 60 };
        const histWidthInside = histWidth - histMargin.left - histMargin.right;
        const histHeightInside = HISTOGRAM_HEIGHT - histMargin.top - histMargin.bottom;

        const histx = scaleLinear()
            .rangeRound([0, histWidthInside])
            .domain(extent(xs));

        const bins = histogram()
            .domain(histx.domain() as [number, number])
            .thresholds(20)(xs);

        const histy = scaleLinear()
            .rangeRound([histHeightInside, 0])
            .domain([0, max(bins, d => d.length)]);

        return (
            <g transform={`translate(0,${height})`}>
                {bins.map((bin, b) => (
                    <rect
                        key={b}
                        className="hist-bar"
                        x={histx(bin.x0) + 1}
                        y={histy(histy.domain()[1])}
                        width={Math.max(0, histx(bin.x1) - histx(bin.x0) - 1)}
                        height={histy(0) - histy(bin.length)}
                    />
                ))}
            </g>
        );
    }

    private renderCategoricalHistogram(valCounts: { [key: string]: number }, chartWidth: number, height: number) {
        const histWidth = chartWidth;
        const histMargin = { top: 0, right: 20, bottom: 0, left: 60 };
        const histWidthInside = histWidth - histMargin.left - histMargin.right;
        const histHeightInside = HISTOGRAM_HEIGHT - histMargin.top - histMargin.bottom;

        const values = Object.getOwnPropertyNames(valCounts).sort();
        const counts = values.map(v => valCounts[v]);

        const { feature } = this.props;
        if (!feature || !feature.shape) return null;

        const histx = scaleBand()
            .domain(values)
            .range([0, histWidthInside])
            .padding(0.1)
            .align(0.5);

        const histy = scaleLinear()
            .rangeRound([histHeightInside, 0])
            .domain([0, max(counts)]);

        //const width = histWidthInside / values.length;
        return (
            <g transform={`translate(0,${height})`}>
                {values.map(v => (
                    <rect
                        key={v}
                        className="hist-bar"
                        x={histx(v)}
                        y={histy(histy.domain()[1])}
                        width={histx.bandwidth()}
                        height={histy(0) - histy(valCounts[v])}
                    />
                ))}
            </g>
        );
    }

    private renderInstancePoint(
        feature: Feature,
        id: number,
        datum: InstanceFieldData,
        shape: 'circle' | 'square',
        showTooltip: boolean,
        x: Scale,
        y: Scale,
    ): React.ReactNode {
        const adjust = x.bandwidth ? 0.5 * x.bandwidth() : 0;
        return [
            appStore.hoverFeature === feature.name ? (
                <line
                    className="instance-hover-line"
                    key="line"
                    x1={x(datum.X) + adjust}
                    y1={y(datum.pdep)}
                    x2={x(datum.X) + adjust}
                    y2={y(0)}
                />
            ) : null,

            shape === 'square' ? (
                <rect
                    className="instancePoint-fixed"
                    key="spot"
                    x={x(datum.X) + adjust - 4.5}
                    y={y(datum.pdep) - 4.5}
                    width={9}
                    height={9}
                    onMouseOver={() => (this.showTooltip2 = true)}
                    onMouseLeave={() => (this.showTooltip2 = false)}
                />
            ) : (
                <circle
                    className="instancePoint-fixed"
                    key="spot"
                    cx={x(datum.X) + adjust}
                    cy={y(datum.pdep)}
                    r="5"
                    onMouseOver={() => (this.showTooltip1 = true)}
                    onMouseLeave={() => (this.showTooltip1 = false)}
                />
            ),

            showTooltip ? (
                <SvgTooltip
                    key="tip"
                    x={x(datum.X)}
                    y={y(datum.pdep) - 70}
                    lines={[`Instance: ${id}`, `X: ${datum.X + adjust}`, `pdep: ${datum.pdep.toFixed(2)}`]}
                />
            ) : null,
        ];
    }
}
