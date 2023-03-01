// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { extent, max as d3max, min as d3min } from 'd3-array';
import { scaleBand, ScaleBand, ScaleLinear, scaleLinear } from 'd3-scale';
import { IShapeData } from './appStore';

export const enum FeatureType {
    Numerical = 'numerical',
    Categorical = 'categorical',
    Unused = 'unused',
}

export interface IItem {
    id: string;
    x: number;
    score: number;
    label: number;
    prediction: number;
}

export interface IFeature {
    readonly name: string;
    readonly valueType: FeatureType;
    readonly shape: FeatureShape;
}

export interface IBin {
    pdep: number;
    x: number;
    sd: number;
}

export type LinearScale = ScaleLinear<number, number>;
export type BandScale = ScaleBand<number>;
export type XScale = LinearScale | BandScale;

export interface ShapePoint {
    x: number;
    y: number;
}

export interface FeatureShape {
    isPiecewiseConstant: boolean;
    getScale(width: number): XScale;
    getPrediction(x: number): number;
    pdep: ShapePoint[];
    lowerConf: ShapePoint[];
    upperConf: ShapePoint[];
}

export class PiecewiseConstant implements FeatureShape {
    public isPiecewiseConstant = true;

    constructor(private bins: IBin[]) { }

    getScale(width: number) {
        return scaleLinear<number>()
            .rangeRound([0, width])
            .domain(extent(this.bins.map(d => d.x)));
    }

    public getPrediction(x: number): number {
        for (let b = 0; b < this.bins.length - 1; b++) {
            if (this.bins[b].x <= x && x < this.bins[b + 1].x) {
                return this.bins[b].pdep;
            }
        }
        return NaN;
    }

    public get pdep() {
        return this.bins.map(b => ({ x: b.x, y: b.pdep }));
    }
    public get lowerConf() {
        return this.bins.map(b => ({ x: b.x, y: b.pdep - b.sd }));
    }
    public get upperConf() {
        return this.bins.map(b => ({ x: b.x, y: b.pdep + b.sd }));
    }
}

export class PiecewiseLinear implements FeatureShape {
    public isPiecewiseConstant = false;
    private segments: LineSegment[];

    constructor(private data: IShapeData[]) {
        this.segments = data.slice(1).map((d, i) => new LineSegment(data[i].X, data[i].pdep_X, d.X, d.pdep_X));
    }

    public get pdep() {
        return this.data.map(d => ({ x: d.X, y: d.pdep_X }));
    }
    public get lowerConf() {
        return this.data.map(d => ({ x: d.X, y: d.confi_l_X }));
    }
    public get upperConf() {
        return this.data.map(d => ({ x: d.X, y: d.confi_u_X }));
    }

    public getScale(width: number) {
        return scaleLinear()
            .clamp(true)
            .rangeRound([0, width])
            .domain(extent(this.data.map(d => d.X)));
    }

    public getPrediction(x: number): number {
        const segs = this.segments;
        let left = 0,
            right = segs.length - 1;
        if (segs[left].tooSmall(x) || segs[right].tooBig(x)) {
            return NaN;
        }

        do {
            const middle = Math.floor(0.5 * (left + right));
            const seg = segs[middle];
            if (seg.containsX(x)) {
                return segs[middle].y(x);
            } else if (seg.tooSmall(x)) {
                right = middle - 1;
            } else {
                left = middle + 1;
            }
        } while (left <= right && left >= 0 && right < segs.length);
        return NaN;
    }
}

export class CategoricalShape implements FeatureShape {
    public isPiecewiseConstant = true;
    private valueMap: { [val: string]: IShapeData };
    public cleanedData: IShapeData[];

    constructor(private data: IShapeData[]) {
        this.valueMap = data.reduce<{ [val: string]: IShapeData }>((map, val) => {
            if (!map[val.X]) map[val.X.toString()] = val;
            return map;
        }, {});
        this.cleanedData = Object.getOwnPropertyNames(this.valueMap)
            .sort()
            .map((n: string) => this.valueMap[n]);
    }

    public get pdep() {
        return this.cleanedData.map(d => ({ x: d.X, y: d.pdep_X }));
    }
    public get lowerConf() {
        return this.cleanedData.map(d => ({ x: d.X, y: d.confi_l_X }));
    }
    public get upperConf() {
        return this.cleanedData.map(d => ({ x: d.X, y: d.confi_u_X }));
    }

    public getScale(width: number) {
        return scaleBand<number>()
            .range([0, width])
            .domain(this.cleanedData.map(d => d.X))
            .padding(0.1)
            .align(0.5);
    }

    public getPrediction(x: number): number {
        return this.valueMap[x] ? this.valueMap[x].pdep_X : NaN;
    }

    public get histogram(): { [key: string]: number } {
        return this.data
            .map(d => d.X.toString())
            .reduce<{ [val: string]: number }>((map, val) => {
                if (!map[val]) map[val] = 1;
                else map[val]++;
                return map;
            }, {});
    }
}

export class Feature implements IFeature {
    public minY: number;
    public maxY: number;

    constructor(
        public name: string,
        public description: string | undefined,
        public shape: FeatureShape,
        public valueType: FeatureType,
    ) {
        const ys = shape.pdep
            .map(d => d.y)
            .concat(shape.lowerConf.map(d => d.y))
            .concat(shape.upperConf.map(d => d.y));
        this.minY = d3min(ys);
        this.maxY = d3max(ys);
    }

    // get the model's predicted value for an arbitrary value in the feature's domain
    public getPrediction(x: number): number {
        if (isNaN(x)) return NaN;
        return this.shape.getPrediction(x);
    }
}

class LineSegment {
    constructor(private x0: number, private y0: number, private x1: number, private y1: number) { }
    public tooSmall(x: number) {
        return x < this.x0;
    }
    public tooBig(x: number) {
        return x > this.x1;
    }
    public containsX(x: number) {
        return this.x0 <= x && x <= this.x1;
    }
    public y(x: number) {
        const frac = (x - this.x0) / (this.x1 - this.x0);
        return this.y0 + frac * (this.y1 - this.y0);
    }
}
