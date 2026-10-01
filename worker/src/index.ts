import { handleFetch, handleScheduled } from "./app";
import type { ExecutionContextLike, WorkerEnv } from "./domain";

export default {
  fetch(request: Request, env: WorkerEnv, context: ExecutionContextLike) {
    return handleFetch(request, env, context);
  },
  scheduled(_controller: unknown, env: WorkerEnv, context: ExecutionContextLike) {
    context.waitUntil(handleScheduled(env));
  },
};
