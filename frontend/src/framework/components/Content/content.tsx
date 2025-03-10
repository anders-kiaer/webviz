import React from "react";

import { Workbench } from "@framework/Workbench";
import { useActiveModuleId } from "@framework/hooks/workbenchHooks";

import { Layout } from "./private-components/layout";

type ContentProps = {
    workbench: Workbench;
};

export const Content: React.FC<ContentProps> = (props) => {
    const activeModuleId = useActiveModuleId(props.workbench);
    return (
        <div className="bg-slate-200 flex-grow">
            <Layout workbench={props.workbench} activeModuleId={activeModuleId} />
        </div>
    );
};
