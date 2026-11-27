CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	CONSTRAINT "post_content_length" CHECK(length(trim("posts"."content")) BETWEEN 1 AND 3000)
);
--> statement-breakpoint
CREATE INDEX `posts_created_index` ON `posts` (`created_at`,`id`);