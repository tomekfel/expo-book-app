import hoistNonReactStatics from "hoist-non-react-statics";
import * as React from "react";
import { createStackNavigator, CardAnimationContext, } from "@react-navigation/stack";
import SharedElementRendererContext from "../SharedElementRendererContext";
import SharedElementRendererData from "../SharedElementRendererData";
import { SharedElementRendererProxy } from "../SharedElementRendererProxy";
import SharedElementRendererView from "../SharedElementRendererView";
import createSharedElementScene from "./createSharedElementScene";
let _navigatorId = 1;
function createSharedElementStackSceneNavigator(routeConfigs, stackConfig, rendererData, navigatorId, debug) {
    //console.log('createSharedElementStackSceneNavigator...', navigatorId);
    const wrappedRouteConfigs = {
        ...routeConfigs,
    };
    for (const key in routeConfigs) {
        let routeConfig = wrappedRouteConfigs[key];
        const component = typeof routeConfig === "object" && routeConfig.screen
            ? routeConfig.screen
            : routeConfig;
        const wrappedComponent = createSharedElementScene(component, rendererData, CardAnimationContext, navigatorId, debug);
        if (component === routeConfig) {
            wrappedRouteConfigs[key] = wrappedComponent;
        }
        else {
            wrappedRouteConfigs[key] = {
                ...routeConfig,
                screen: wrappedComponent,
            };
        }
    }
    // Override `onTransitionStart` and `onTransitionEnd` and
    // hook in into the transition lifecycle events.
    const defaultNavigationOptions = stackConfig?.defaultNavigationOptions;
    function defaultNavigationOptionsFn(props) {
        let defaultNavigationOptionsResult = typeof defaultNavigationOptions === "function"
            ? defaultNavigationOptions(props)
            : defaultNavigationOptions;
        return {
            ...defaultNavigationOptionsResult,
            onTransitionStart: (transitionProps) => {
                rendererData.startTransition(transitionProps.closing, navigatorId, rendererData.nestingDepth);
                if (defaultNavigationOptionsResult &&
                    defaultNavigationOptionsResult.onTransitionStart) {
                    defaultNavigationOptionsResult.onTransitionStart(transitionProps);
                }
            },
            onTransitionEnd: (transitionProps) => {
                rendererData.endTransition(transitionProps.closing, navigatorId, rendererData.nestingDepth);
                if (defaultNavigationOptionsResult &&
                    defaultNavigationOptionsResult.onTransitionEnd) {
                    defaultNavigationOptionsResult.onTransitionEnd(transitionProps);
                }
            },
        };
    }
    return createStackNavigator(wrappedRouteConfigs, {
        ...stackConfig,
        defaultNavigationOptions: typeof defaultNavigationOptions === "function"
            ? defaultNavigationOptionsFn
            : defaultNavigationOptionsFn({}),
    });
}
function createSharedElementStackNavigator(routeConfigs, stackConfig, options) {
    const navigatorId = options && options.name ? options.name : `stack${_navigatorId}`;
    _navigatorId++;
    const debug = options?.debug || false;
    // Create a proxy which is later updated to link
    // to the renderer
    const rendererDataProxy = new SharedElementRendererProxy();
    const SharedElementNavigator = createSharedElementStackSceneNavigator(routeConfigs, stackConfig, rendererDataProxy, navigatorId, debug);
    class SharedElementRenderer extends React.Component {
        componentDidMount() {
            if (debug) {
                rendererDataProxy.addDebugRef();
            }
        }
        componentWillUnmount() {
            if (debug) {
                rendererDataProxy.releaseDebugRef();
            }
        }
        render() {
            return (<SharedElementRendererContext.Consumer>
          {(rendererData) => {
                // In case a renderer is already present higher up in the chain
                // then don't bother creating a renderer here, but use that one instead
                if (!rendererData) {
                    this.rendererData =
                        this.rendererData || new SharedElementRendererData();
                    rendererDataProxy.source = this.rendererData;
                }
                else {
                    rendererDataProxy.source = rendererData;
                }
                return (<SharedElementRendererContext.Provider value={rendererDataProxy}>
                <SharedElementNavigator {...this.props}/>
                {this.rendererData ? (<SharedElementRendererView rendererData={this.rendererData}/>) : undefined}
              </SharedElementRendererContext.Provider>);
            }}
        </SharedElementRendererContext.Consumer>);
        }
    }
    hoistNonReactStatics(SharedElementRenderer, SharedElementNavigator);
    // @ts-ignore
    return SharedElementRenderer;
}
export default createSharedElementStackNavigator;
//# sourceMappingURL=createSharedElementStackNavigator.js.map