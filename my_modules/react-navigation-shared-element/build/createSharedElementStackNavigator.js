import { useNavigationBuilder, createNavigatorFactory, StackRouter, } from "@react-navigation/native";
import { CardAnimationContext, StackView, } from "@react-navigation/stack";
import * as React from "react";
import { Platform } from "react-native";
import { useSharedElementFocusEvents } from "./SharedElementFocusEvents";
import SharedElementRendererContext from "./SharedElementRendererContext";
import SharedElementRendererData from "./SharedElementRendererData";
import { SharedElementRendererProxy } from "./SharedElementRendererProxy";
import SharedElementRendererView from "./SharedElementRendererView";
import createSharedElementScene from "./createSharedElementScene";
import { EventEmitter } from "./utils/EventEmitter";
let _navigatorId = 1;
export default function createSharedElementStackNavigator(options) {
    // Verify that no other options than 'name' or 'debug' are provided.
    // This might indicate that the user is still using navigation 4 but
    // didn't rename to `createSharedElementStackNavigator4`.
    if (options &&
        Object.keys(options).filter((key) => key !== "name" && key !== "debug")
            .length > 0) {
        throw new Error(`Invalid options specified to 'createSharedElementStackNavigator'. If you are using react-navigation 4, please use 'createSharedElementStackNavigator4'`);
    }
    const navigatorId = options && options.name ? options.name : `stack${_navigatorId}`;
    _navigatorId++;
    const debug = options?.debug || false;
    const rendererDataProxy = new SharedElementRendererProxy();
    const emitter = new EventEmitter();
    function SharedElementStackNavigator({ initialRouteName, children, screenOptions, ...rest }) {
        const defaultOptions = {
            gestureEnabled: Platform.OS === "ios",
            animationEnabled: Platform.OS !== "web",
        };
        const { state, descriptors, navigation } = useNavigationBuilder(StackRouter, {
            initialRouteName,
            children,
            screenOptions: typeof screenOptions === "function"
                ? (...args) => ({
                    ...defaultOptions,
                    ...screenOptions(...args),
                })
                : {
                    ...defaultOptions,
                    ...screenOptions,
                },
        });
        const rendererDataRef = React.useRef(null);
        if (debug) {
            React.useLayoutEffect(() => {
                rendererDataProxy.addDebugRef();
                return function cleanup() {
                    rendererDataProxy.releaseDebugRef();
                };
            }, []);
        }
        useSharedElementFocusEvents({ state, emitter });
        return (<SharedElementRendererContext.Consumer>
        {(rendererData) => {
            // In case a renderer is already present higher up in the chain
            // then don't bother creating a renderer here, but use that one instead
            if (!rendererData) {
                rendererDataRef.current =
                    rendererDataRef.current || new SharedElementRendererData();
                rendererDataProxy.source = rendererDataRef.current;
            }
            else {
                rendererDataProxy.source = rendererData;
            }
            return (<SharedElementRendererContext.Provider value={rendererDataProxy}>
              <StackView {...rest} state={state} descriptors={descriptors} navigation={navigation}/>
              {rendererDataRef.current ? (<SharedElementRendererView rendererData={rendererDataRef.current}/>) : undefined}
            </SharedElementRendererContext.Provider>);
        }}
      </SharedElementRendererContext.Consumer>);
    }
    const navigatorFactory = createNavigatorFactory(SharedElementStackNavigator);
    const { Navigator, Screen } = navigatorFactory();
    // Wrapping Screen to explicitly statically type a "Shared Element" Screen.
    function wrapScreen(_) {
        return null;
    }
    function getSharedElementsChildrenProps(children) {
        return React.Children.toArray(children).reduce((acc, child) => {
            if (React.isValidElement(child)) {
                if (child.type === wrapScreen) {
                    acc.push(child.props);
                }
                if (child.type === React.Fragment) {
                    acc.push(...getSharedElementsChildrenProps(child.props.children));
                }
            }
            return acc;
        }, []);
    }
    // react-navigation only allows the Screen component as direct children
    // of Navigator, this is why we need to wrap the Navigator
    function WrapNavigator(props) {
        const { children, ...restProps } = props;
        const wrappedComponentsCache = React.useRef(new Map());
        const screenChildrenProps = getSharedElementsChildrenProps(children);
        return (<Navigator {...restProps}>
        {screenChildrenProps.map(({ component, name, sharedElements, sharedElementsConfig, ...restChildrenProps }) => {
            sharedElements = sharedElements || sharedElementsConfig;
            // Show warning when deprecated `sharedElementsConfig` prop was used
            if (sharedElementsConfig) {
                console.warn("The `sharedElementsConfig` prop has been renamed, use `sharedElements` instead.");
            }
            // Check whether this component was previously already wrapped
            let wrappedComponent = wrappedComponentsCache.current.get(name);
            if (!wrappedComponent ||
                wrappedComponent.config.Component !== component) {
                // Wrap the component
                wrappedComponent = createSharedElementScene(component, sharedElements, rendererDataProxy, emitter, CardAnimationContext, navigatorId, debug);
                wrappedComponentsCache.current.set(name, wrappedComponent);
            }
            else {
                // Shared elements function might have been changed, so update it
                wrappedComponent.config.sharedElements = sharedElements;
            }
            return (<Screen key={name} name={name} component={wrappedComponent} {...restChildrenProps}/>);
        })}
      </Navigator>);
    }
    return {
        Navigator: WrapNavigator,
        Screen: wrapScreen,
    };
}
//# sourceMappingURL=createSharedElementStackNavigator.js.map