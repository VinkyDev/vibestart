import { defineRelations } from "drizzle-orm";

import { todos } from "#src/schema/todos.ts";

export const relations = defineRelations({ todos });
