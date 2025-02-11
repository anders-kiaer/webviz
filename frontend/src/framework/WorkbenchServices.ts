import React from "react";

import { Ensemble } from "@shared-types/ensemble";

import { isEqual } from "lodash";

import { Workbench } from "./Workbench";

export type NavigatorTopicDefinitions = {
    "navigator.ensembles": Ensemble[];
};

export type GlobalTopicDefinitions = {
    "global.infoMessage": string;
    "global.hoverRealization": { realization: number };
    "global.hoverTimestamp": { timestamp: number };

    "global.syncValue.ensembles": Ensemble[];
    "global.syncValue.date": { timeOrInterval: string };
    "global.syncValue.timeSeries": { vectorName: string };
    "global.syncValue.surface": { name: string; attribute: string };
};

export type AllTopicDefinitions = NavigatorTopicDefinitions & GlobalTopicDefinitions;

export type TopicDefinitionsType<T extends keyof AllTopicDefinitions> = T extends keyof GlobalTopicDefinitions
    ? GlobalTopicDefinitions[T]
    : T extends keyof NavigatorTopicDefinitions
    ? NavigatorTopicDefinitions[T]
    : never;

export type CallbackFunction<T extends keyof AllTopicDefinitions> = (value: AllTopicDefinitions[T]) => void;

export class WorkbenchServices {
    protected _workbench: Workbench;
    protected _subscribersMap: Map<string, Set<CallbackFunction<any>>>;
    protected _topicValueCache: Map<string, any>;

    protected constructor(workbench: Workbench) {
        this._workbench = workbench;
        this._subscribersMap = new Map();
        this._topicValueCache = new Map();
    }

    subscribe<T extends keyof AllTopicDefinitions>(topic: T, callbackFn: CallbackFunction<T>) {
        const subscribersSet = this._subscribersMap.get(topic) || new Set();
        subscribersSet.add(callbackFn);
        this._subscribersMap.set(topic, subscribersSet);

        // If we already have a value for this topic, trigger the callback immediately
        // May have to revise this and make it an op-in behavior, but for now it's fine
        if (this._topicValueCache.has(topic)) {
            callbackFn(this._topicValueCache.get(topic));
        }

        return () => {
            subscribersSet.delete(callbackFn);
        };
    }

    publishGlobalData<T extends keyof GlobalTopicDefinitions>(topic: T, value: TopicDefinitionsType<T>) {
        this.internalPublishAnyTopic(topic, value);
    }

    protected internalPublishAnyTopic<T extends keyof AllTopicDefinitions>(topic: T, value: TopicDefinitionsType<T>) {
        // Always do compression so that if the value is the same as the last value, don't publish
        // Serves as a sensible default behavior until we see a need for more complex behavior
        if (this._topicValueCache.has(topic)) {
            const cachedValue = this._topicValueCache.get(topic);
            if (isEqual(value, cachedValue)) {
                return;
            }
        }

        this._topicValueCache.set(topic, value);

        const subscribersSet = this._subscribersMap.get(topic);
        if (!subscribersSet) {
            return;
        }
        for (const callbackFn of subscribersSet) {
            callbackFn(value);
        }
    }
}

export function useSubscribedValue<T extends keyof AllTopicDefinitions>(
    topic: T,
    workbenchServices: WorkbenchServices
): AllTopicDefinitions[T] | null {
    const [latestValue, setLatestValue] = React.useState<AllTopicDefinitions[T] | null>(null);

    React.useEffect(
        function subscribeToServiceTopic() {
            function handleNewValue(newValue: AllTopicDefinitions[T]) {
                setLatestValue(newValue);
            }
            const unsubscribeFunc = workbenchServices.subscribe(topic, handleNewValue);
            return unsubscribeFunc;
        },
        [topic, workbenchServices]
    );

    return latestValue;
}

export function useSubscribedValueConditionally<T extends keyof AllTopicDefinitions>(
    topic: T,
    enable: boolean,
    workbenchServices: WorkbenchServices
): AllTopicDefinitions[T] | null {
    const [latestValue, setLatestValue] = React.useState<AllTopicDefinitions[T] | null>(null);

    React.useEffect(
        function subscribeToServiceTopic() {
            if (!enable) {
                setLatestValue(null);
                return;
            }

            function handleNewValue(newValue: AllTopicDefinitions[T]) {
                setLatestValue(newValue);
            }

            const unsubscribeFunc = workbenchServices.subscribe(topic, handleNewValue);
            return () => {
                unsubscribeFunc();
            };
        },
        [topic, enable, workbenchServices]
    );

    return latestValue;
}
