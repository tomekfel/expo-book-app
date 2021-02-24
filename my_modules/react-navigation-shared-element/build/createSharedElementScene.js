import hoistNonReactStatics from "hoist-non-react-statics";
import * as React from "react";
import { View, StyleSheet, InteractionManager } from "react-native";
import { nodeFromRef } from "react-native-shared-element";
import SharedElementSceneContext from "./SharedElementSceneContext";
import SharedElementSceneData from "./SharedElementSceneData";
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
function isValidNavigationState(state) {
    return "index" in state && "routes" in state;
}
// Gets the current screen from navigation state
function getActiveRoute(state) {
    const route = state.routes[state.index];
    return route.state && isValidNavigationState(route.state)
        ? getActiveRoute(route.state) // Dive into nested navigators
        : route;
}
function isActiveRoute(navigation, route) {
    const state = navigation.dangerouslyGetState();
    const activeRoute = getActiveRoute(state);
    return route.name === activeRoute.name;
}
function createSharedElementScene(Component, sharedElements, rendererData, emitter, AnimationContext, navigatorId, verbose) {
    const config = {
        Component,
        sharedElements,
        rendererData,
        AnimationContext,
        navigatorId,
        verbose,
    };
    class SharedElementSceneView extends React.PureComponent {
        constructor() {
            super(...arguments);
            this.subscriptions = {};
            this.sceneData = new SharedElementSceneData(Component, () => config.sharedElements || Component.sharedElements, this.props.route, navigatorId, rendererData.nestingDepth, verbose);
            this.onTransitionStart = (event) => {
                const closing = event.data.closing;
                //console.log("onTransitionStart: ", event.data);
                rendererData.startTransition(closing, navigatorId, rendererData.nestingDepth);
                //console.log("onTransitionStart: ", this.sceneData);
                //rendererData.updateSceneState(this.sceneData, "willFocus");
            };
            this.onTransitionEnd = ({ data: { closing } }) => {
                rendererData.endTransition(closing, navigatorId, rendererData.nestingDepth);
            };
            this.onRenderAnimationContext = (value) => {
                this.sceneData.setAnimimationContextValue(value);
                return null;
            };
            this.onSetRef = (ref) => {
                this.sceneData.setAncestor(nodeFromRef(ref));
            };
            this.onWillFocus = () => {
                const { navigation, route } = this.props;
                //console.log("onWillFocus: ", route);
                if (isActiveRoute(navigation, route)) {
                    this.sceneData.updateRoute(route);
                    rendererData.updateSceneState(this.sceneData, "willFocus");
                    InteractionManager.runAfterInteractions(() => {
                        //console.log("onDidFocus: ", this.props.route);
                        this.sceneData.updateRoute(this.props.route);
                        rendererData.updateSceneState(this.sceneData, "didFocus");
                    });
                }
            };
            this.onWillBlur = () => {
                const { route } = this.props;
                //console.log("onWillBlur: ", route);
                this.sceneData.updateRoute(route);
                //rendererData.updateSceneState(this.sceneData, "willBlur");
            };
        }
        componentDidMount() {
            const { navigation } = this.props;
            this.subscriptions = {
                willFocus: emitter.addListener("focus", this.onWillFocus),
                willBlur: emitter.addListener("blur", this.onWillBlur),
                transitionStart: navigation.addListener("transitionStart", this.onTransitionStart),
                transitionEnd: navigation.addListener("transitionEnd", this.onTransitionEnd),
            };
        }
        componentWillUnmount() {
            Object.values(this.subscriptions).forEach((unsubscribe) => unsubscribe());
        }
        render() {
            // console.log('SharedElementSceneView.render');
            return (<SharedElementSceneContext.Provider value={this.sceneData}>
          <View style={styles.container} collapsable={false} ref={this.onSetRef}>
            <AnimationContext.Consumer>
              {this.onRenderAnimationContext}
            </AnimationContext.Consumer>
            <Component {...this.props}/>
          </View>
        </SharedElementSceneContext.Provider>);
        }
        componentDidUpdate() {
            this.sceneData.updateRoute(this.props.route);
        }
    }
    SharedElementSceneView.config = config;
    hoistNonReactStatics(SharedElementSceneView, Component);
    return SharedElementSceneView;
}
export default createSharedElementScene;
//# sourceMappingURL=createSharedElementScene.js.map