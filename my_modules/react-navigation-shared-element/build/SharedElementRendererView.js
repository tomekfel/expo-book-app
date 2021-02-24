import * as React from "react";
import { View, StyleSheet } from "react-native";
import { SharedElementTransition } from "react-native-shared-element";
export default class SharedElementRendererView extends React.PureComponent {
    componentDidMount() {
        this.subscription = this.props.rendererData.addUpdateListener(() => {
            this.forceUpdate();
        });
    }
    componentWillUnmount() {
        if (this.subscription) {
            this.subscription();
            this.subscription = undefined;
        }
    }
    render() {
        const transitions = this.props.rendererData.getTransitions();
        // console.log('SharedElementRendererView.render: ', transitions);
        return (<View style={StyleSheet.absoluteFill} pointerEvents="none">
        {transitions.map((
        // @ts-ignore
        { key, ...props }, index) => (<SharedElementTransition key={`${key}:${index}`} {...props}/>))}
      </View>);
    }
}
//# sourceMappingURL=SharedElementRendererView.js.map