import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAutomatonStore } from "../../lib/automatonStore";
import { State } from '../../lib/automatonTypes';

interface Partition {
  states: State[];
  label: string;
}

export function MinimizationDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const { automaton, dispatch } = useAutomatonStore();

  // Initialize and calculate partitions
  useEffect(() => {
    if (isOpen) {
      const calculatePartitions = () => {
        const partitionsList: Partition[] = [];
        const { states, transitions, alphabet } = automaton;

        // Initial partition: accepting and non-accepting states
        const acceptingStates = states.filter(s => s.isAccepting);
        const nonAcceptingStates = states.filter(s => !s.isAccepting);
        partitionsList.push(
          { states: acceptingStates, label: '受理状態' },
          { states: nonAcceptingStates, label: '非受理状態' }
        );

        // Iteratively refine partitions
        let changed = true;
        while (changed) {
          changed = false;
          const currentPartitions = [...partitionsList[partitionsList.length - 1].states];
          const newGroups = new Map<string, State[]>();

          for (const state of currentPartitions) {
            // Create signature based on transitions
            const signature = Array.from(alphabet)
              .map(input => {
                const transition = transitions.find(t => t.from === state.id && t.input === input);
                if (!transition) return 'none';
                // Find which partition contains the target state
                const targetPartitionIndex = partitionsList[partitionsList.length - 1].states
                  .findIndex(s => s.id === transition.to);
                return targetPartitionIndex.toString();
              })
              .join(',');

            if (!newGroups.has(signature)) {
              newGroups.set(signature, []);
            }
            newGroups.get(signature)!.push(state);
          }

          // If we got new groups, add them as a new partition
          if (newGroups.size > 1) {
            changed = true;
            const newPartition = Array.from(newGroups.values()).map((states, i) => ({
              states,
              label: `グループ ${i + 1}`
            }));
            partitionsList.push(...newPartition);
          }
        }

        setPartitions(partitionsList);
        setStep(0);
      };

      calculatePartitions();
    }
  }, [isOpen, automaton]);

  const handleNextStep = () => {
    if (step === partitions.length - 1) {
      // 最終ステップ：最小化を実行
      dispatch({ type: 'MINIMIZE_DFA' });
      onClose();
    } else {
      setStep(prev => prev + 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>DFA最小化プロセス</DialogTitle>
          <DialogDescription>
            DFAを最小化するプロセスを段階的に表示します。
            各ステップで状態の分割が行われ、同値な状態がグループ化されます。
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="text-sm">
            ステップ {step + 1}: {
              step === 0 ? "初期分割" :
              step === partitions.length - 1 ? "最終分割" :
              `分割 ${step + 1}`
            }
          </div>
          
          <div className="space-y-2">
            {partitions.map((partition, index) => (
              <div
                key={index}
                className={`p-2 rounded border ${
                  index <= step ? 'border-primary' : 'border-muted'
                }`}
              >
                <div className="font-medium mb-1">{partition.label}</div>
                <div className="text-sm">
                  状態: {partition.states.map(s => s.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleNextStep}>
            {step === partitions.length - 1 ? '最小化を実行' : '次へ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
