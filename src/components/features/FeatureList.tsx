/**
 * Copyright (c) Microsoft. All rights reserved.
 */

import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { observer } from 'mobx-react';
import * as React from 'react';
import { appStore, Model } from '../../stores/appStore';
// import { appStore } from '../../stores/store';
import { getStylist } from '../../utils/stylist';

const { styleDiv } = getStylist('FeatureArea');

const Container = styleDiv('Container', {
    flex: 1,
});

export interface FeatureListProps {
    model: Model;
}

@observer
export class FeatureList extends React.Component<FeatureListProps> {
    public render() {
        const { model } = this.props;
        return (
            <Container>
                <List subheader={<ListSubheader>Features</ListSubheader>}>
                    {model ? model.features
                        .filter(f => f.name !== 'intercept')
                        .map(feature => (
                            <ListItem key={feature.name} style={{ paddingTop: 5, paddingBottom: 5 }} >
                                <ListItemText
                                    primary={feature.name}
                                    secondary={feature.description}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton onClick={() => appStore.toggleFeatureVisibility(feature.name)} title="Toggle feature visibility">
                                        {appStore.isFeatureVisible(feature.name) ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        )) : null}
                </List>
            </Container>
        );
    }
}
