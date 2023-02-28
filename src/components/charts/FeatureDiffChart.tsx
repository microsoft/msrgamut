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

interface FeatureDiffChartProps {
    data: InstanceFieldData[];
    intercept: number;
}

interface CumulativeFieldData extends InstanceFieldData {
    start: number;
    end: number;
}

const TOTAL_FEATURE = 'TOTAL';

@observer
export class FeatureDiffChart extends React.Component<FeatureDiffChartProps> {
    public render() {
        const { data } = this.props;
        const model = appStore.model;
        const featureDiffSVGWidth = 600;
        const featureDiffSVGHeight = 250;

        const featureDiffMargin = { top: 0, right: 20, bottom: 50, left: 50 };
        const featureDiffWidth = featureDiffSVGWidth - featureDiffMargin.left - featureDiffMargin.right;
        const featureDiffHeight = featureDiffSVGHeight - featureDiffMargin.top - featureDiffMargin.bottom;

        const featureDiffX = scaleBand()
            .rangeRound([0, featureDiffWidth])
            .padding(0.1);
        const featureDiffY = scaleLinear().range([featureDiffHeight, 0]);

        const featureDiffXAxis = axisBottom(featureDiffX).ticks(5);
        const featureDiffYAxis = axisLeft(featureDiffY)
            .tickSize(0)
            .tickPadding(6);

        function makefeatureDiffData(data: InstanceFieldData[]): CumulativeFieldData[] {
            const featureDiffData: CumulativeFieldData[] = [];
            //let cumulative = 0;
            for (let i = 0; i < data.length; i++) {
                if (model.getType(data[i].name) != FeatureType.Unused) {
                    const pdep = data[i].pdep;
                    featureDiffData.push({ ...data[i], start: 0, end: pdep });
                    //  cumulative += pdep;
                }
            }
            featureDiffData.push({
                name: TOTAL_FEATURE,
                end: 0,
                start: 0,
                X: 0,
                pdep: 0,
                confi_u_X: 0,
                confi_l_X: 0,
            });
            return featureDiffData;
        }

        const featureDiffData = makefeatureDiffData(data);

        featureDiffX.domain(featureDiffData.map(d => d.name));
        const featureDiffExtent: [number, number] = extent(featureDiffData, d => d.end);
        featureDiffY.domain([min([0, featureDiffExtent[0]]), max([0, featureDiffExtent[1]])]);
        const formatComma = format(',.2f');

        const hoverData = appStore.hoverFeature
            ? featureDiffData.find(d => d.name === appStore.hoverFeature)
            : undefined;

        return (
            <Container style={{ padding: '10px' }}>
                <svg className="featureDiff-chart" width={featureDiffSVGWidth} height={featureDiffSVGHeight}>
                    <g transform={`translate(${featureDiffMargin.left},${featureDiffMargin.top})`}>
                        <line
                            className="zeroline"
                            x1={0}
                            y1={featureDiffY(0)}
                            x2={featureDiffX(TOTAL_FEATURE)}
                            y2={featureDiffY(0)}
                            style={{ visibility: min([0, featureDiffExtent[0]]) < 0 ? 'visible' : 'hidden' }}
                        />

                        {featureDiffData.map(d => (
                            <g
                                key={d.name}
                                className="featureDiff-bar"
                                transform={`translate(${featureDiffX(d.name)},0)`}>
                                <rect
                                    className={`featureDiff-bar-rect bar bar--${d.pdep < 0 ? 'negative' : 'positive'} ${d.name === appStore.hoverFeature ? 'hover' : ''
                                    }`}
                                    y={featureDiffY(Math.max(d.start, d.end))}
                                    height={
                                        d.name === 'intercept'
                                            ? 5
                                            : Math.abs(featureDiffY(d.start) - featureDiffY(d.end))
                                    }
                                    width={featureDiffX.bandwidth()}
                                    onMouseOver={_ => (appStore.hoverFeature = d.name)}
                                    onMouseLeave={_ => (appStore.hoverFeature = undefined)}
                                    onClick={_ => appStore.setFeatureVisibility(d.name, true)}
                                />
                            </g>
                        ))}

                        <g
                            id="featureDiff-x-axis"
                            transform={`translate(0,${featureDiffHeight})`}
                            ref={g =>
                                select(g)
                                    .call(featureDiffXAxis)
                                    .selectAll('text')
                                    .attr('y', 0)
                                    .attr('x', 9)
                                    .attr('dy', '.5em')
                                    .attr('transform', 'rotate(45)')
                                    .style('text-anchor', 'start')
                                    .style('font-size', '12px')
                            }
                        />

                        <g
                            id="featureDiff-y-axis"
                            transform="translate(0,0)"
                            ref={g => select(g).call(featureDiffYAxis)}
                        />

                        {hoverData ? (
                            <SvgTooltip
                                x={featureDiffX(hoverData.name)}
                                y={featureDiffY(Math.max(hoverData.start, hoverData.end)) - 60}
                                lines={[`${hoverData.name}: ${hoverData.X}`, `Contrib: ${formatComma(hoverData.pdep)}`]}
                            />
                        ) : null}
                    </g>
                </svg>
            </Container>
        );
    }
}
