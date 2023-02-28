/**
 * Copyright (c) Microsoft. All rights reserved.
 */

import { IconButton } from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { observer } from 'mobx-react';
import * as React from 'react';
import { appStore } from '../../stores/appStore';
import { getStylist } from '../../utils/stylist';

const { styleDiv } = getStylist('FeatureArea');

const Container = styleDiv('Container', {
    flex: 0,
});

@observer
export class ChartOptions extends React.Component {
    public render() {
        return (
            <Container>
                <List subheader={<ListSubheader>Chart Options</ListSubheader>}>
                    <ListItem>
                        <ListItemText disableTypography={true}>
                            <Typography variant="subtitle1">
                                <label htmlFor="normalizeAxes">Normalize axes</label>
                            </Typography>
                        </ListItemText>
                        <ListItemSecondaryAction>
                            <Switch id="normalizeAxes" onChange={e => appStore.normalizeAxes = e.target.checked} checked={appStore.normalizeAxes} />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                        <ListItemText disableTypography={true}>
                            <Typography variant="subtitle1">
                                <label htmlFor="showHistograms">Show histograms</label>
                            </Typography>
                        </ListItemText>
                        <ListItemSecondaryAction>
                            <Switch id="showHistograms" onChange={e => appStore.showHistograms = e.target.checked} checked={appStore.showHistograms} />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem style={{ paddingTop: 5, paddingBottom: 5 }} >
                        <ListItemText primary="All Features" />
                        <ListItemSecondaryAction>
                            <IconButton onClick={() => appStore.toggleAllFeatureVisbility(true)} title="Show all features">
                                <VisibilityIcon />
                            </IconButton>
                            <IconButton onClick={() => appStore.toggleAllFeatureVisbility(false)} title="Hide all features">
                                <VisibilityOffIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </Container>
        );
    }
}
