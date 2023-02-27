/**
 * Copyright (c) Microsoft. All rights reserved.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { debounce } from '../../utils/debounce';
import { watchResize } from '../../utils/windowResize';

interface IContainerAwareState {
    width: number;
    height: number;
}

interface IContainerAwareProps {
    onRenderContent: (width: number, height: number) => JSX.Element;
    debounceWait?: number;
}

const containerStyle: React.CSSProperties = { width: '100%', height: '100%', position: 'relative' };

export class ContainerAware extends React.Component<IContainerAwareProps, IContainerAwareState> {
    public state: IContainerAwareState = { width: 0, height: 0 };

    public render() {
        const { onRenderContent } = this.props;
        const { width, height } = this.state;

        return <div style={containerStyle}>{onRenderContent(width, height)}</div>;
    }

    public componentDidMount() {
        this._isMounted = true;

        const element = ReactDOM.findDOMNode(this) as Element;

        const onResize = (width: number, height: number) => {
            if (this._isMounted) {
                this.setState({ width, height });
            }
        };

        const debouncedOnResize = debounce(onResize, { immediate: true });

        watchResize(element, ({ width, height }) => {
            debouncedOnResize(width, height);
        });

        const boundingRect = element.getBoundingClientRect();
        this.setState({ width: boundingRect.width, height: boundingRect.height });
    }

    public componentWillUnmount() {
        this._isMounted = false;
    }

    private _isMounted = false;
}
