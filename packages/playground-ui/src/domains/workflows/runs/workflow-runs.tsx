import { Skeleton } from '@/components/ui/skeleton';
import { Txt } from '@/ds/components/Txt';
import { formatDate } from 'date-fns';
import clsx from 'clsx';
import { WorkflowRun } from '@mastra/core/storage';

export interface WorkflowRunsProps {
  workflowId: string;
  runId?: string;
  isLoading: boolean;
  runs: WorkflowRun[];
  onPressRun: ({ workflowId, runId }: { workflowId: string; runId: string }) => void;
}

export const WorkflowRuns = ({ workflowId, runId, isLoading, runs, onPressRun }: WorkflowRunsProps) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="p-4">
        <Txt variant="ui-md" className="text-icon6 text-center">
          No previous run
        </Txt>
      </div>
    );
  }

  return (
    <ol className="pb-10">
      {runs.map(run => (
        <li key={run.runId}>
          <button
            onClick={() => onPressRun({ workflowId, runId: run.runId })}
            className={clsx('px-3 py-2 border-b-sm border-border1 block w-full hover:bg-surface4 text-left', {
              'bg-surface4': run.runId === runId,
            })}
          >
            <Txt variant="ui-lg" className="font-medium text-icon6 truncate" as="p">
              {run.runId}
            </Txt>

            <Txt variant="ui-sm" className="font-medium text-icon3 truncate" as="p">
              {typeof run?.snapshot === 'string'
                ? ''
                : run?.snapshot?.timestamp
                  ? formatDate(run?.snapshot?.timestamp, 'MMM d, yyyy h:mm a')
                  : ''}
            </Txt>
          </button>
        </li>
      ))}
    </ol>
  );
};
