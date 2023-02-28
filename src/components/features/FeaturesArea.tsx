/**
 * Copyright (c) Microsoft. All rights reserved.
 */

import Divider from '@material-ui/core/Divider';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChartOptions } from '../../components/charts/ChartOptions';
import { FeatureList } from '../../components/features/FeatureList';
import { appStore, Model } from '../../stores/appStore';
import { getStylist } from '../../utils/stylist';

const { styleDiv } = getStylist('FeatureArea');

const Container = styleDiv('Container', {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative',
    overflowY: 'auto',
});

export interface FeatureAreaProps {
    model: Model;
}

@observer
export class FeatureArea extends React.Component<FeatureAreaProps> {
    public render() {
        const { model } = this.props;
        return (
            <Container className="sidenav" style={{ width: appStore.sidebarOpen ? 250 : 0 }} >
                <ChartOptions />
                <Divider />
                <FeatureList model={model} />
            </Container>
        );
    }
}
