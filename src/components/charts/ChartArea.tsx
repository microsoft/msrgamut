// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Card, CardContent, CardHeader, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/close';
import InfoIcon from '@material-ui/icons/info';
import { ScaleSequential } from 'd3-scale';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { appStore } from '../../stores/appStore';
import { FeatureType } from '../../stores/featureStore';
import { getStylist } from '../../utils/stylist';
import { ShapeChart } from './ShapeChart';

const { styleDiv } = getStylist('ChartArea');

const Container = styleDiv('Container', {
    display: 'flex',
    width: '100%',
    height: '100%',
    position: 'relative',
    overflowY: 'auto',
    flexWrap: 'wrap',
});

const ChartContainer = styleDiv('ChartContainer', {
    margin: 8,
});

const fredData = true;

const { styleComponent } = getStylist('FeatureChart');

const DenseCardContent = styleComponent(CardContent)('DenseCardContent', {
    padding: 0,
});

export interface ChartAreaProps {
    colorDRPrediction: ScaleSequential<string>;
}

@observer
export class ChartArea extends React.Component<ChartAreaProps> {
    // save refs to cards for scrolling
    cardrefs: any = [];

    public render() {
        // const chartWidth = 400;
        const chartHeight = 300;
        reaction(
            () => appStore.focusedFeature,
            (val, _) => {
                const myref = this.cardrefs[val];
                // should abstract this out into a function, but for now, do the calculations here:
                const element: HTMLElement = ReactDOM.findDOMNode(myref) as HTMLElement;
                const topPos: number = element.offsetTop;
                const parentElement: HTMLElement = element.parentElement;
                parentElement.scrollTop = topPos;

                //console.log("updateded focused feature to " + val + "reaction" + reaction)
            },
        );
        if (fredData) {
            const model = appStore.model;
            const commonYScale = appStore.normalizeAxes ?
                { min: model.globalMinY, max: model.globalMaxY } :
                undefined;

            return (
                <Container>
                    {model.features
                        .filter(fs => appStore.isFeatureVisible(fs.name))
                        .filter(fs => fs.valueType != FeatureType.Unused)
                        .map(fs => (
                            <ChartContainer key={fs.name} ref={(card) => { this.cardrefs[fs.name] = card; }}>
                                <Card>
                                    <CardHeader title={fs.name} action={
                                        <span>
                                            {fs.description && (
                                                <IconButton title={fs.description}><InfoIcon fontSize="small" /></IconButton>
                                            )}
                                            <IconButton onClick={_ => appStore.toggleFeatureVisibility(fs.name)} title="Hide this feature">
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    } />
                                    <DenseCardContent>
                                        <Container customProps={{ height: chartHeight }}>
                                            <ShapeChart
                                                feature={fs}
                                                colorDRPrediction={this.props.colorDRPrediction}
                                                commonYScale={commonYScale}
                                            />
                                        </Container>
                                    </DenseCardContent>
                                </Card>
                            </ChartContainer>
                        ))}
                </Container>
            );
        } else {
            // const { features, normalizeAxes, scoreExtent, selectedFeatureBin, selectedFeatureName } = appStore;
            // const { selectFeatureBin } = appAction;

            // // const getColor = riskScoreColorScale.domain(scoreExtent);
            // const getColor = riskScoreColorScale.domain([0, 1]);

            // return (
            //     <Container>
            //         {features.filter(fs => fs.visible).map(fs => (
            //             <ChartContainer key={fs.name}>
            //                 <FeatureChart
            //                     bins={fs.bins}
            //                     name={fs.name}
            //                     getColor={getColor}
            //                     width={chartWidth}
            //                     height={chartHeight}
            //                     scoreExtent={normalizeAxes && scoreExtent}
            //                     onSelectFeatureBin={bin => selectFeatureBin(fs, bin)}
            //                     selectedBin={selectedFeatureName === fs.name ? selectedFeatureBin : null}
            //                     items={fs.items}
            //                 />
            //             </ChartContainer>
            //         ))}
            //     </Container>
            // );
        }
    }
}
