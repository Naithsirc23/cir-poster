CREATE TABLE `content_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`idea` text NOT NULL,
	`channel` varchar(40) NOT NULL DEFAULT 'linkedin',
	`format` varchar(40) NOT NULL DEFAULT 'post',
	`objective` varchar(120) NOT NULL,
	`audience` varchar(180) NOT NULL,
	`tone` varchar(80) NOT NULL,
	`coreMessage` text NOT NULL,
	`callToAction` varchar(220) NOT NULL,
	`content` text NOT NULL,
	`status` enum('draft','ready','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_drafts_id` PRIMARY KEY(`id`)
);
