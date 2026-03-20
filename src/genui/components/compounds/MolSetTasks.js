import React from "react";
import { TaskAwareComponent, TaskBadgeGroup, TaskProgressBar } from '../../index';

const MolSetTasks = (props) =>{

    return (
      <TaskAwareComponent
        handleResponseErrors={props.handleResponseErrors}
        tasksURL={new URL(`${props.molset.id}/tasks/all/`, props.apiUrls.compoundSetsRoot)}
        onTaskUpdate={props.onTaskUpdate}
        render={
          taskInfo => {
            const taskBadgeProps = {
                tasks: taskInfo.tasks,
                resultComponent : props.taskResultComponent,
                errorClassToComponent : props.taskErrorClassToComponent,
                errorsGroupFunction: props.taskErrorsGroupFunction,
            };
            return taskInfo.tasksExist ? (
              <React.Fragment>
                <span style={{fontSize: "large"}}>Tasks <TaskBadgeGroup {...taskBadgeProps}/></span> <br/>
                <TaskProgressBar
                  progressURL={props.progressURL}
                  tasks={taskInfo.tasks.running}
                />
              </React.Fragment>
            ) : null
          }
        }
      />
    )
}

export default MolSetTasks;