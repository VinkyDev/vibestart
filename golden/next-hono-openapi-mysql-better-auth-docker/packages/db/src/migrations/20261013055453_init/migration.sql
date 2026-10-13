CREATE TABLE `account` (
	`access_token` text,
	`access_token_expires_at` timestamp(3),
	`account_id` text NOT NULL,
	`id` varchar(36) PRIMARY KEY,
	`id_token` text,
	`password` text,
	`provider_id` text NOT NULL,
	`refresh_token` text,
	`refresh_token_expires_at` timestamp(3),
	`scope` text,
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `session` (
	`expires_at` timestamp(3) NOT NULL,
	`id` varchar(36) PRIMARY KEY,
	`ip_address` text,
	`token` varchar(255) NOT NULL,
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `token_unique` UNIQUE INDEX(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`id` varchar(36) PRIMARY KEY,
	`image` text,
	`name` text NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `email_unique` UNIQUE INDEX(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`expires_at` timestamp(3) NOT NULL,
	`id` varchar(36) PRIMARY KEY,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`completed` boolean NOT NULL DEFAULT false,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`title` varchar(200) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `todos_title_length` CHECK(char_length(trim(`todos`.`title`)) between 1 and 200)
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `todos_user_id_idx` ON `todos` (`user_id`);--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `todos` ADD CONSTRAINT `todos_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE;