## Done

The change is done when every modified path works end to end, every rule in this file holds in every modified file, and `vp run ready` passes.

Before you report it, review the whole diff in a fresh context when your tools allow one: read the failure and cleanup paths, a second run against existing state, and every caller of what changed, and fix what you find.
