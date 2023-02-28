const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../docs/data');

fs.readdir(dataDir, (err, files) => {
    if (err) {
        console.log(err);
    } else {
        const getPrefix = (fname) => {
            const suffix = ['-gam', '-features', '-gaam'].find(suf => fname.indexOf(suf) >= 0);
            return suffix ? fname.substr(0, fname.indexOf(suffix)) : undefined;
        }
        const filesByPrefix = files
            .filter(fname => fname.endsWith('.json'))
            .reduce((dict, fname) => {
                const prefix = getPrefix(fname);
                if (prefix) {
                    if (!dict[prefix]) { dict[prefix] = [fname]; }
                    else { dict[prefix].push(fname); }
                }
                return dict;
            }, {});

        const datasets = Object.getOwnPropertyNames(filesByPrefix)
            .map(name => {
                const filenames = filesByPrefix[name];
                function makeUrl(suffix) {
                    const wholeName = `${name}-${suffix}.json`;
                    return filenames.indexOf(wholeName) >= 0 ? wholeName : '';
                }
                const isGaam = !!filenames.find(name => name.indexOf('-gaam') >= 0);
                return isGaam ?
                    {
                        name: name,
                        type: 'ga²m',
                        model: makeUrl('gaam'),
                        instances: makeUrl('gaam-instance-data')
                    } :
                    {
                        name: name,
                        type: 'pygam',
                        descriptions: makeUrl('features'),
                        model: makeUrl('gam'),
                        instances: makeUrl('gam-instance-data')
                    }
            });
        const output = { default: 'income', datasets: datasets };
        const fileName = path.join(dataDir, '_manifest.json');
        fs.writeFileSync(fileName, JSON.stringify(output, null, 2));
        console.log(`created ${fileName}`);

        const anchors = [`add this to index.html:\n<!--copied from scripts/manifest.js output-->`];
        datasets.forEach(dataset => {
            for (let key in dataset) {
                let val = dataset[key];
                if (val.indexOf('.json') > 0) {
                    anchors.push(`<a class="gamut-app-content-bundled" id="${val.replace(/\/|\./g, '_')}" href="../docs/data/${val}"></a>`);
                }
            }
        });
        anchors.push('<!-- end of copy -->');
        console.log(anchors.join('\n'));
    }
});
