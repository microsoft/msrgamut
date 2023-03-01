// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Axis as d3Axis } from 'd3-axis';
import { select } from 'd3-selection';
import * as React from 'react';
import { getStylist } from '../../utils/stylist';

const { getClassName } = getStylist('Axis');

const getContainerClassName = (color: string) =>
    getClassName('container', {
        $nest: {
            '& path': { stroke: color },
            '& line': { stroke: color },
            '& text': { fill: color },
        },
    });

export interface IAxisProps {
    axis: d3Axis<any>;
    translateX?: number;
    translateY?: number;
    color?: string;
}

export class Axis extends React.PureComponent<IAxisProps> {
    private _elm: SVGElement;

    public render() {
        let { translateX, translateY } = this.props;
        translateX = translateX !== undefined && translateX !== null ? translateX : 0;
        translateY = translateY !== undefined && translateY !== null ? translateY : 0;

        return (
            <g
                ref={this._setElement}
                className={getContainerClassName(this.props.color)}
                transform={`translate(${translateX}, ${translateY})`}
            />
        );
    }

    public componentDidMount() {
        this._renderAxis();
    }

    public componentDidUpdate() {
        this._renderAxis();
    }

    private _renderAxis() {
        select(this._elm).call(this.props.axis);
    }

    private _setElement = (elm: SVGElement) => {
        this._elm = elm;
    };
}
