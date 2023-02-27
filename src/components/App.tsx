import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { observer } from 'mobx-react';
import * as React from 'react';
import { appStore } from '../stores/appStore';
import { Chrome } from "./Chrome";
import { Content } from "./Content";
import { FeatureArea } from "./features/FeaturesArea";

const theme = createMuiTheme({
    typography: {
        // In Japanese the characters are usually larger.
        fontSize: 12,
        //useNextVariants: true
    },
});

@observer
export class App extends React.Component {
    public render() {
        const model = appStore.model;
        return (
            <MuiThemeProvider theme={theme}>
                <Chrome>
                    <CssBaseline />
                    {
                        appStore.ready ?
                            [
                                <FeatureArea key="fa" model={model} />,
                                <Content key="c" model={model} />
                            ] :
                            <div className="loading">Loading {appStore.datasetName}...</div>
                    }
                </Chrome>
            </MuiThemeProvider>
        );
    }
}
