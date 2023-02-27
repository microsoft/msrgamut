/**
 * Copyright (c) Microsoft. All rights reserved.
 */

import { observer } from 'mobx-react';
import * as React from 'react';
import { keyframes, style, types } from 'typestyle';
import { endsWith } from '../utils/base';

export type CSSProperties = types.CSSProperties;
type NestedCssProps = types.NestedCSSProperties;
type KeyFrames = types.KeyFrames;
type ReactComponent<P> = React.StatelessComponent<P> | React.ComponentClass<P>;
type StylableComponent<T> = keyof React.ReactHTML | ReactComponent<T> | keyof React.ReactSVG;
type DynamicCss<TProps> = (props: Readonly<TProps>) => NestedCssProps | ReadonlyArray<NestedCssProps>;
type StaticCss = NestedCssProps | ReadonlyArray<NestedCssProps>;
type GetClassName = (debugName: string, ...cssProps: StaticCss[]) => string;
type StyledComponentProps<TProps, TCustomProps> = TProps & { customProps?: TCustomProps };

const staticCssField = '__sc_static_css';
const dynamicCssField = '__sc_dynamic_css';
const cssSetFlag = '__sc_css_set';

const classNameFactory = (scope: string) => (debugName: string, ...cssProps: StaticCss[]) => {
    const cssProperties = cssProps.filter(css => !!css).reduce<NestedCssProps[]>((r, c) => r.concat(c), []);
    const isEmpty = cssProperties.every(css => !Object.keys(css).length);
    const debugProps: NestedCssProps = { $debugName: `${scope}-${debugName}` };
    return isEmpty ? '' : style(...cssProperties, debugProps);
};

const animationNameFactory = () => (timeline: KeyFrames): string => {
    return keyframes(timeline);
};

// tslint:disable-next-line:no-any
const getStaticCssArrayCopy = (Component: any): StaticCss[] => (Component[staticCssField] || []).slice();

// tslint:disable-next-line:no-any
const getDynamicCssArrayCopy = (Component: any): DynamicCss<{}>[] => (Component[dynamicCssField] || []).slice();

// tslint:disable-next-line:no-any
const isStyledComponent = (Component: any) => !!Component[dynamicCssField];

const styledComponentFactory = (getClassName: GetClassName) => <TProps extends { className?: string }>(
    Component: StylableComponent<TProps>
) => <TCustomProps>(
    styledComponentName: string,
    css: StaticCss,
    getCss?: DynamicCss<StyledComponentProps<TProps, TCustomProps>>
) => {
        const staticCssArray = getStaticCssArrayCopy(Component).concat(css);

        const dynamicCssArray = getDynamicCssArrayCopy(Component)
            .concat(getCss)
            .filter(fn => !!fn);

        const staticCssClassName = getClassName(styledComponentName, ...staticCssArray);

        const isTargetStyledComponent = isStyledComponent(Component);

        const StyledComponent = class extends React.Component<StyledComponentProps<TProps, TCustomProps>> {
            public static [staticCssField] = staticCssArray;
            public static [dynamicCssField] = dynamicCssArray;

            public render() {
                // tslint:disable-next-line:no-any
                const { customProps = <TCustomProps>{}, ...props } = <any>this.props;

                const cssSet = props[cssSetFlag];
                props[cssSetFlag] = undefined;

                const classNames: string[] = [];

                if (!cssSet) {
                    const dynamicCss = StyledComponent[dynamicCssField].map(cssFn =>
                        cssFn({ ...props, ...{ customProps } })
                    );

                    const dynamicCssClassName = getClassName(styledComponentName, ...dynamicCss);

                    classNames.push(staticCssClassName, dynamicCssClassName);
                }

                return React.createElement(Component, {
                    ...props,
                    className: joinClassNames(...classNames, this.props.className),
                    [cssSetFlag]: isTargetStyledComponent ? true : undefined
                });
            }
        };

        return observer(StyledComponent);
    };

export function appendImportant(cssProps: CSSProperties): CSSProperties {
    const important = '!important';

    Object.keys(cssProps).forEach((prop: keyof CSSProperties) => {
        const val = cssProps[prop] as any;

        if (!endsWith(val, important)) {
            //cssProps[prop] = `${val} ${important}`;
        }
    });

    return cssProps;
}

export const joinClassNames = (...classNames: string[]): string => classNames.filter(c => c).join(' ');

interface HTMLMainElement extends HTMLElement { }

export const getStylist = <TScope extends string>(scope: TScope) => {
    const getClassName = classNameFactory(scope);
    const getAnimationName = animationNameFactory();
    const styleComponent = styledComponentFactory(getClassName);

    return {
        getClassName,
        getAnimationName,
        styleComponent,
        //HTML stylers
        styleDiv: styleComponent<React.HTMLAttributes<HTMLDivElement>>('div'),
        styleSpan: styleComponent<React.HTMLAttributes<HTMLSpanElement>>('span'),
        styleHeader: styleComponent<React.HTMLAttributes<HTMLElement>>('header'),
        styleFooter: styleComponent<React.HTMLAttributes<HTMLElement>>('footer'),
        styleButton: styleComponent<React.ButtonHTMLAttributes<HTMLButtonElement>>('button'),
        styleUlist: styleComponent<React.HTMLAttributes<HTMLUListElement>>('ul'),
        styleLi: styleComponent<React.LiHTMLAttributes<HTMLLIElement>>('li'),
        styleAnchor: styleComponent<React.AnchorHTMLAttributes<HTMLAnchorElement>>('a'),
        styleInput: styleComponent<React.InputHTMLAttributes<HTMLInputElement>>('input'),
        styleTextArea: styleComponent<React.TextareaHTMLAttributes<HTMLTextAreaElement>>('textarea'),
        styleParagraph: styleComponent<React.HTMLAttributes<HTMLParagraphElement>>('p'),
        styleLabel: styleComponent<React.LabelHTMLAttributes<HTMLLabelElement>>('label'),
        styleMain: styleComponent<React.HTMLAttributes<HTMLMainElement>>('main'),
        styleIFrame: styleComponent<React.IframeHTMLAttributes<HTMLIFrameElement>>('iframe'),
        //SVG stylers
        styleSvg: styleComponent<React.SVGAttributes<SVGSVGElement>>('svg'),
        styleG: styleComponent<React.SVGAttributes<SVGGElement>>('g'),
        styleRect: styleComponent<React.SVGAttributes<SVGRectElement>>('rect'),
        styleCircle: styleComponent<React.SVGAttributes<SVGCircleElement>>('circle'),
        styleLine: styleComponent<React.SVGAttributes<SVGLineElement>>('line'),
        stylePath: styleComponent<React.SVGAttributes<SVGPathElement>>('path')
    };
};
