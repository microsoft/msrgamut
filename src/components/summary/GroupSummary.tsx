// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Instance } from '../../stores';
import { getStylist } from '../../utils/stylist';

const { styleDiv } = getStylist('GroupSummary');

const Container = styleDiv('Container', {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
});

export interface IGroupSummaryProps {
    instances: ReadonlyArray<Instance>;
}

@observer
export class GroupSummary extends React.Component<IGroupSummaryProps> {
    public render() {
        return (
            <Container>
                <List subheader={<ListSubheader>Distribution</ListSubheader>} />
            </Container>
        );
    }
}
