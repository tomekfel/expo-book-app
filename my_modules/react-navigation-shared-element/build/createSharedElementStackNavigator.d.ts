import { RouteConfig, StackNavigationState } from "@react-navigation/native";
import { StackNavigationOptions } from "@react-navigation/stack";
import { StackNavigationConfig, StackNavigationEventMap } from "@react-navigation/stack/lib/typescript/src/types";
import * as React from "react";
import { SharedElementSceneComponent, SharedElementsComponentConfig } from "./types";
export default function createSharedElementStackNavigator<ParamList extends Record<string, object | undefined>>(options?: {
    name?: string;
    debug?: boolean;
}): {
    Navigator: (props: (Pick<import("@react-navigation/native").DefaultRouterOptions & {
        children: React.ReactNode;
        screenOptions?: StackNavigationOptions | ((props: {
            route: import("@react-navigation/native").RouteProp<Record<string, object | undefined>, string>;
            navigation: any;
        }) => StackNavigationOptions) | undefined;
    } & StackNavigationConfig, "children" | "mode" | "headerMode" | "keyboardHandlingEnabled"> & {
        initialRouteName?: keyof ParamList | undefined;
        screenOptions?: StackNavigationOptions | ((props: {
            route: import("@react-navigation/native").RouteProp<ParamList, keyof ParamList>;
            navigation: any;
        }) => StackNavigationOptions) | undefined;
    }) | React.PropsWithChildren<Pick<import("@react-navigation/native").DefaultRouterOptions & {
        children: React.ReactNode;
        screenOptions?: StackNavigationOptions | ((props: {
            route: import("@react-navigation/native").RouteProp<Record<string, object | undefined>, string>;
            navigation: any;
        }) => StackNavigationOptions) | undefined;
    } & StackNavigationConfig, "children" | "mode" | "headerMode" | "keyboardHandlingEnabled"> & {
        initialRouteName?: keyof ParamList | undefined;
        screenOptions?: StackNavigationOptions | ((props: {
            route: import("@react-navigation/native").RouteProp<ParamList, keyof ParamList>;
            navigation: any;
        }) => StackNavigationOptions) | undefined;
    }>) => JSX.Element;
    Screen: <RouteName extends keyof ParamList>(_: Pick<RouteConfig<ParamList, RouteName, StackNavigationState, StackNavigationOptions, StackNavigationEventMap>, "name" | "options" | "listeners" | "initialParams"> & {
        component: SharedElementSceneComponent;
        sharedElements?: SharedElementsComponentConfig | undefined;
        /**
         * @deprecated
         * The `sharedElementsConfig` prop has been renamed, use `sharedElements` instead.
         */
        sharedElementsConfig?: SharedElementsComponentConfig | undefined;
    }) => null;
};
