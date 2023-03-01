// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import MenuIcon from '@material-ui/icons/Menu';
import { format } from 'd3-format';
import { observer } from 'mobx-react';
import * as React from 'react';
import { appStore } from '../stores/appStore';
import { getStylist } from '../utils/stylist';

const { styleComponent, styleDiv, styleMain } = getStylist('Chrome');

const STypography = styleComponent(Typography)('STypography', {
    flexGrow: 1,
});

const Container = styleDiv('Container', {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
});

const Content = styleMain('Content', {
    flex: '1',
    display: 'flex',
    height: '100%',
    padding: '0px',
    position: 'relative',
});

const Header = styleComponent(AppBar)('Header', {
    flex: '0 0 auto',
    padding: '0 14px',
    fontSize: '12px',
});


@observer
export class Chrome extends React.Component {
    public render() {
        const formatComma = format(',.2f');
        return (
            <Container>
                <Header position="static">
                    <Toolbar>
                        <MenuIcon fontSize="large" className="feature-icon" onClick={_ => appStore.sidebarOpen = !appStore.sidebarOpen} />
                        <STypography variant="h5" color="inherit">
                            Gamut
                        </STypography>

                        {
                            appStore.ready ?
                                <div className="header-grouping">
                                    <div className="header-content">
                                        <label htmlFor="datasets" className="smalltext-header">model</label>
                                        <select
                                            id="datasets"
                                            className="dataset header-value" required
                                            value={appStore.datasetName}
                                            onChange={e => appStore.loadDataset(e.target.value)}>
                                            {
                                                appStore.datasetNames.map(name =>
                                                    <option key={name} value={name}>{name}</option>)
                                            }
                                        </select>
                                    </div>

                                    <div className="header-content">
                                        <label className="smalltext-header">RMSE</label>
                                        <div className="header-value">{formatComma(appStore.model.rms)}</div>
                                    </div>

                                    <div className="header-content">
                                        <label className="smalltext-header">intercept</label>
                                        <div className="header-value">{formatComma(appStore.model.intercept)}</div>
                                    </div>
                                </div>
                                : null
                        }

                    </Toolbar>
                </Header>
                <Content>{this.props.children}</Content>
            </Container>
        );
    }
}
