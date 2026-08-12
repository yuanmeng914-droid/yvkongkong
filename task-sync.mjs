export function markTaskPending(task) {
  task.syncPending = true;
  return task;
}

export function markTaskSynced(task, userId, revision) {
  if (Number(task.updatedAt) !== Number(revision)) return false;
  task.syncPending = false;
  task.syncedUserId = userId;
  return true;
}

export function needsTaskSync(task, userId) {
  return Boolean(task.syncPending || task.syncedUserId !== userId);
}

export function createTaskSyncQueue() {
  const queues = new Map();
  return {
    enqueue(taskId, operation) {
      const previous = queues.get(taskId) || Promise.resolve();
      const current = previous.catch(() => undefined).then(operation);
      queues.set(taskId, current);
      const cleanup = () => {
        if (queues.get(taskId) === current) queues.delete(taskId);
      };
      current.then(cleanup, cleanup);
      return current;
    },
  };
}

export function mergeTaskRecords(localTasks, cloudTasks, userId) {
  const localById = new Map(localTasks.map((task) => [task.id, task]));
  const cloudById = new Map(cloudTasks.map((task) => [task.id, task]));
  const merged = [];

  for (const cloud of cloudTasks) {
    const local = localById.get(cloud.id);
    const localIsNewer = local && Number(local.updatedAt) > Number(cloud.updatedAt);
    if (local && (needsTaskSync(local, userId) || localIsNewer)) {
      merged.push({ ...local, syncPending: true });
    } else {
      merged.push({ ...cloud, syncPending: false, syncedUserId: userId });
    }
  }

  for (const local of localTasks) {
    if (cloudById.has(local.id) || !needsTaskSync(local, userId)) continue;
    merged.push({ ...local, syncPending: true });
  }

  return merged;
}
