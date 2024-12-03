import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Canvas } from "../components/automaton/Canvas";
import { Controls } from "../components/automaton/Controls";
import { Simulator } from "../components/automaton/Simulator";
import { useAutomatonStore } from "../lib/automatonStore";
import { AutomatonState } from '../lib/automatonTypes';

export default function AutomatonEditor() {
  const mode = useAutomatonStore((state: AutomatonState) => state.mode);
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={20}>
          <div className="h-full p-4 border-r">
            <Controls />
            <div className="mt-4">
              <Simulator />
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={75}>
          <div className="h-full relative" style={{ cursor: mode === 'state' ? 'crosshair' : 'default' }}>
            <Canvas />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
