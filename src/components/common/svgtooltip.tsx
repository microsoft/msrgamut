import { observable } from 'mobx';
import { observer } from 'mobx-react';
import React = require('react');


export interface SvgTooltipProps {
    x: number;
    y: number;
    lines: string[];
}

@observer
export class SvgTooltip extends React.Component<SvgTooltipProps> {
    @observable private width = 0;
    @observable private height = 0;

    public render() {
        return (
            <g transform={`translate(${-0.5 * this.width},0)`}>
                <rect
                    x={this.props.x - 10} y={this.props.y}
                    rx={2} ry={2}
                    width={this.width + 20} height={this.height + 10}
                    className="tooltip-background"
                />
                <text y={this.props.y} ref={e => {
                    if (e) {
                        const r = e.getBoundingClientRect();
                        this.width = r.width;
                        this.height = r.height;
                    }
                }}>
                    {
                        this.props.lines.map((line, i) =>
                            <tspan key={i} className="tip-text" x={this.props.x} dy="12pt">{line}</tspan>)
                    }
                </text>
            </g >
        );
    }
}
