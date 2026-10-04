CREATE TABLE `todos` (
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`title` text NOT NULL,
	CONSTRAINT "todos_title_length" CHECK(length(trim("title")) between 1 and 200)
);
