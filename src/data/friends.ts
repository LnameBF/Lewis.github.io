export type FriendLink = {
	name: string;
	url: string;
	avatar: string;
	description: string;
	owner?: string;
	tags?: string[];
	rss?: string;
};

export const friendLinksIssueUrl =
	"https://github.com/LnameBF/Lewis.github.io/issues/new";

export const friendLinks: FriendLink[] = [];
