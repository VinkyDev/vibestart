import type { InferSchemaType, Types } from "mongoose";
import { Schema } from "mongoose";

export const todoSchema = new Schema(
  {
    completed: { default: false, required: true, type: Boolean },
    createdAt: { default: Date.now, required: true, type: Date },
    title: { maxlength: 200, minlength: 1, required: true, trim: true, type: String },
  },
  { versionKey: false }
);

type TodoDocument = InferSchemaType<typeof todoSchema> & { _id: Types.ObjectId };

/** A todo as the API returns it: the `ObjectId` as a hex string `id`, and no Mongoose types for a client to resolve. */
interface Todo {
  completed: boolean;
  createdAt: Date;
  id: string;
  title: string;
}

export const toTodo = ({ _id, ...todo }: TodoDocument): Todo => ({
  ...todo,
  id: _id.toHexString(),
});
