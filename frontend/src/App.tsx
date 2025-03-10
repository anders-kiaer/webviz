import React from "react";

import { LayoutElement, Workbench } from "@framework/Workbench";
import { Content } from "@framework/components/Content";
import { Settings } from "@framework/components/Settings";
import { TopNavBar } from "@framework/components/TopNavBar";
import { AuthProvider } from "@framework/providers/AuthProvider";
import { CustomQueryClientProvider } from "@framework/providers/QueryClientProvider";
import { ResizablePanels } from "@lib/components/ResizablePanels";

import "./modules/registerAllModules.ts";

const layout: LayoutElement[] = [];

function App() {
    const workbench = new Workbench();

    React.useEffect(() => {
        if (!workbench.loadLayoutFromLocalStorage()) {
            workbench.makeLayout(layout);
        }
    }, []);

    return (
        <AuthProvider>
            <CustomQueryClientProvider>
                <div className="h-screen flex flex-row">
                    <ResizablePanels
                        id="settings-content"
                        direction="horizontal"
                        minSizes={[300, 0]}
                        initialSizesPercent={[25, 75]}
                    >
                        <Settings workbench={workbench} />
                        <div className="flex flex-col flex-grow h-full">
                            <TopNavBar workbench={workbench} />
                            <Content workbench={workbench} />
                        </div>
                    </ResizablePanels>
                </div>
            </CustomQueryClientProvider>
        </AuthProvider>
    );
}

export default App;
