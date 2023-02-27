import { interpolateHcl } from 'd3-interpolate';
import { scaleLinear } from 'd3-scale';

export const riskScoreColorScale = scaleLinear<string, string>()
    .range(['#0b8793', '#360033'])
    .interpolate(interpolateHcl);


