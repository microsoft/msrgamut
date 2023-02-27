import axios, { AxiosResponse } from 'axios';
import { ascending, descending, max as d3max, mean as d3mean, min as d3min } from 'd3-array';
import { action, computed, observable, runInAction } from 'mobx';
import { CategoricalShape, Feature, FeatureType, IBin, PiecewiseConstant, PiecewiseLinear } from './featureStore';

export interface IShapeData {
    X: number;
    pdep_X: number;
    confi_u_X: number;
    confi_l_X: number;
}

interface IFeature {
    name: string;
    dtype: string;
    influence?: { min: number; max: number; diff: number };
    data?: IShapeData[];
    value?: number; // only available when name==='intercept'
    shape?: IBin[];
}

interface IGamJson {
    name: string;
    rms?: number;
    features: IFeature[];
}

interface IDescriptions {
    [key: string]: string;
}

export interface InstanceFieldData {
    name: string;
    X: number;
    pdep: number;
    confi_u_X: number;
    confi_l_X: number;
    // plus other fields based on feature names
}

export interface IDataReduction {
    pca: number[];
    mds: number[];
    isomap: number[];
    tsne: number[];
    umap: number[];
    pdep_pca: number[];
    pdep_mds: number[];
    pdep_isomap: number[];
    pdep_tsne: number[];
    pdep_umap: number[];
    [func: string]: number[];
}

export interface InstanceData {
    id: number;
    y: number;
    data: InstanceFieldData[];
    dr?: IDataReduction;
}

interface InstanceStats {
    min: number; max: number; mean: number;
}

export interface Neighbor extends InstanceData {
    distance?: number;
}

type url = string;

interface ModelDescription {
    name: string;
    type: 'pygam' | 'ga²m';
    descriptions: url;
    model: url;
    instances: url;
}

interface DatasetIndexResponse {
    default: string;
    datasets: ModelDescription[];
}

export class Model {
    public gam: IGamJson;
    public instanceData: InstanceData[];
    public instances: any[]; // for the data grid
    public attributes: string[];
    public features: Feature[];
    public globalMinY: number;
    public globalMaxY: number;

    private instanceStats: { [featureName: string]: InstanceStats } = {};

    constructor(
        gamJson: IGamJson,
        instanceData: InstanceData[],
        descriptions?: IDescriptions
    ) {
        this.gam = gamJson;
        const isGaam = this.gam.name.indexOf('gaam') >= 0;
        this.instanceData = instanceData || [];
        let features = this.gam.features;
        if (!features || features.length === 0) { return; }

        this.attributes = features.map(feature => feature.name);

        if (features[0].influence) {
            features = features.sort((x, y) => descending(x.influence.diff, y.influence.diff));
        }

        this.features = features
            .filter(f => f.name !== 'intercept')
            .map(feat => new Feature(
                feat.name,
                descriptions ? descriptions[feat.name] : undefined,
                isGaam ?
                    (feat.dtype === 'continuous' ?
                        new PiecewiseConstant(feat.shape) :
                        new CategoricalShape(feat.shape.map(b => ({ X: b.x, pdep_X: b.pdep, confi_l_X: b.pdep - b.sd, confi_u_X: b.pdep + b.sd })))) :
                    (feat.dtype === 'numerical' ?
                        new PiecewiseLinear(feat.data) :
                        new CategoricalShape(feat.data)),
                feat.dtype === 'numerical' || feat.dtype === 'continuous' ? FeatureType.Numerical : (feat.dtype === 'unused' ? FeatureType.Unused : FeatureType.Categorical)));


        this.globalMinY = d3min(this.features.map(f => f.minY));
        this.globalMaxY = d3max(this.features.map(f => f.maxY));

        this.instances = this.instanceData.map(inst => {
            const row: any = {
                id: inst.id,
                y: inst.y,
                prediction: this.getPrediction(inst)
            };
            inst.data.forEach(d => row[d.name] = d.X);
            return row;
        });

        this.calculateStats();
    }

    get name() { return this.gam.name; }

    get rms() { return this.gam.rms; }

    get intercept(): number {
        const intercept = this.gam.features.find(feature => feature.name === 'intercept');
        return intercept ? intercept.value : 0;
    }

    public getPrediction(instance: InstanceData) {
        return instance.data.reduce((sum, item) => sum + item.pdep, this.intercept);
    }

    public getNeighbors(instance: InstanceData, vectorSpaceString: 'feature' | 'gam', numOfNeighbors: number = 16): Neighbor[] {

        const normalize = (instance: InstanceData) =>
            instance.data.map(data => {
                const stats = this.instanceStats[data.name];
                if (!stats) return 0; // WHY DOES THIS HAPPEN? :angry:
                return (data.X - stats.mean) / stats.max
            });

        const pdep = (instance: InstanceData) =>
            instance.data.map(data => data.pdep);

        const euclidean = (vec1: number[], vec2: number[]) =>
            Math.sqrt(
                zip(vec1, vec2)
                    .reduce((sum, [x, y]) => sum + Math.pow(x - y, 2), 0));

        const measures = vectorSpaceString === 'feature' ? normalize : pdep;

        const selectedInstanceArray = measures(instance);

        return this.instanceData.slice()
            .filter(({ id }) => id !== instance.id)
            .map(inst => ({ ...inst, distance: euclidean(selectedInstanceArray, measures(inst)) }))
            .sort((x, y) => ascending(x.distance, y.distance))
            .slice(0, numOfNeighbors);
    }
    public gethistogram(featureName: string): { [key: string]: number } {
        return this.instances.map(d => d[featureName])
            .reduce<{ [val: string]: number; }>((map, val) => {
                if (!map[val])
                    map[val] = 1;
                else
                    map[val]++;
                return map;
            }, {});
    }

    private calculateStats() {
        const instances = this.instanceData;
        if (!instances || !instances.length || !instances[0].data) { return; }
        const features = this.gam.features;
        for (let f = 0; f < features.length - 1; f++) {
            this.instanceStats[features[f].name] = {
                max: d3max(instances, d => d.data[f].X),
                min: d3min(instances, d => d.data[f].X),
                mean: d3mean(instances, d => d.data[f].X)
            }
        }
    }

    public getType(featureName: string): FeatureType {
        const theFeature: Feature = this.features.find(afeat => (afeat.name == featureName));

        if (theFeature != null) {
            return (theFeature.valueType);
        }
        else return (null);
    }

}

export class AppStore {
    private dataDir: string;

    @observable private datasets: ModelDescription[] = [];
    @observable public datasetName: string | undefined = undefined;

    // dataset state
    public model: Model | undefined = undefined; // NOT OBSERVABLE: avoid wrapping the whole model in Mobx objects
    @observable ready: boolean = false; // use this lightweigh value to signal when model is ready

    // selection state
    @observable public selectedInstance: InstanceData;
    @observable public selectedInstance2: InstanceData;
    @observable public neighborsOfSelection: Neighbor[];

    // view state
    @observable public sidebarOpen = false;
    @observable public showHistograms = true;
    @observable public featureSpace: 'feature' | 'gam' = 'feature';
    @observable public featureVisible: { [featureName: string]: boolean } = {};
    @observable public hoverFeature: string | undefined = undefined;

    @observable public normalizeAxes = true;

    @observable public focusedFeature: string | undefined = undefined;
    @action
    public loadManifest(manifestUrl: url, dataDir: string, defaultDataset?: string) {
        this.dataDir = dataDir;
        axios.get(manifestUrl).then(resp => {
            const datasetResponse = resp.data as DatasetIndexResponse;
            this.datasets = datasetResponse.datasets;
            this.loadDataset(defaultDataset || datasetResponse.default);
        });
    }

    @computed public get datasetNames() {
        return this.datasets.map(ds => ds.name);
    }

    public isFeatureVisible(featureName: string) {
        return this.featureVisible[featureName];
    }

    public setFeatureVisibility(featureName: string, visible: boolean) {
        this.featureVisible[featureName] = visible;
    }

    public toggleFeatureVisibility(featureName: string) {
        this.featureVisible[featureName] = !this.featureVisible[featureName];
    }

    public toggleAllFeatureVisbility(onOff: boolean) {
        for (let fname in this.featureVisible) {
            this.featureVisible[fname] = onOff;
        }
    }

    @action
    public loadDataset(datasetName: string) {
        let dataset = this.datasets.find(ds => ds.name === datasetName);
        if (!dataset) {
            //console.log("BAD DATASET " + datasetName);
            dataset = this.datasets[0];
        }
        this.datasetName = dataset.name;
        this.ready = false;
        this.model = undefined;
        const fetches = [dataset.model, dataset.instances, dataset.descriptions]
            .map(url => {
                if (url) {
                    //look for parcel'ed data if local
                    const a = document.querySelector<HTMLAnchorElement>(`a.gamut-app-content-bundled#${url.replace(/\/|\./g, '_')}`) as HTMLAnchorElement;
                    if (a) {
                        url = a.href;
                    } else {
                        //look for location of data
                        url = `${this.dataDir}${url}`;
                    }
                    return axios.get(url);
                } else {
                    return Promise.resolve(undefined);
                }
            });
        axios.all(fetches)
            .then(responses => {
                runInAction(() => {
                    const gamJson = dataFrom<IGamJson>(responses[0]);
                    if (!gamJson) {
                        this.ready = true;
                        return;
                    }
                    this.createModel(gamJson, dataFrom<InstanceData[]>(responses[1]), dataFrom<IDescriptions>(responses[2]));
                });
            });
    }

    @action
    public createModel(gamJson: IGamJson, instanceData: InstanceData[], descriptions?: IDescriptions) {
        this.model = new Model(gamJson, instanceData, descriptions);

        if (this.model.instanceData.length) {
            this.updateSelection(this.model.instanceData[0].id);
        }
        // Show all features by default.
        this.model.features
            .filter(f => f.name !== 'intercept')
            .forEach(f => this.featureVisible[f.name] = true);

        this.ready = true;
    }

    @action
    public updateSelection(id: number) {
        const item = this.model.instanceData.find(d => d.id === id);
        if (item) {
            this.selectedInstance = item;
            this.neighborsOfSelection = this.model.getNeighbors(item, this.featureSpace);
            this.selectedInstance2 = null;
        }
    }

    @action
    public updateSelection2(id: number) {
        const item = this.model.instanceData.find(d => d.id === id);
        if (item) {
            this.selectedInstance2 = item;
        }
    }

    @action
    public setFeatureSpace(value: string) {
        if (value !== 'feature' && value !== 'gam') throw 'bad feature space';
        this.featureSpace = value;
        this.updateSelection(this.selectedInstance.id);
    }

    @action
    public setFocusedFeature(value: string) {
        this.focusedFeature = value;
    }

}

function zip<T>(vec1: T[], vec2: T[]): [T, T][] { return vec1.map((x, i) => [x, vec2[i]] as [T, T]); }

function dataFrom<T>(resp: AxiosResponse<T>) { return resp ? resp.data : undefined };

export const appStore = new AppStore();

if (location.search.substring(1) === 'embed') {
    window.addEventListener('message', e => {
        if (e && e.origin !== 'https://sanddance.js.org' && e.data) {
            const { gamJson, instanceData, descriptions } = e.data as { gamJson: IGamJson, instanceData: InstanceData[], descriptions?: IDescriptions };
            if (gamJson && instanceData) {
                appStore.createModel(gamJson, instanceData, descriptions);
            }
        }
    });
} else {
    const dataDirAnchor = (document.querySelector<HTMLAnchorElement>(`a.gamut-app-content#datadir`) as HTMLAnchorElement);
    const dataDir = dataDirAnchor ? dataDirAnchor.href : '';
    const manifestAnchor = document.querySelector<HTMLAnchorElement>('a.gamut-app-content-bundled#manifest') as HTMLAnchorElement;
    const manifestUrl = manifestAnchor ? manifestAnchor.href : `${dataDir}_manifest.json`;
    appStore.loadManifest(manifestUrl, dataDir);
}
