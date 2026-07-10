import React from 'react';
const TaskItem = ({ task, onToggle }) => <div className="p-2 border rounded">{task.title}</div>;
export default TaskItem;
