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

export const friendLinks: FriendLink[] = [
	{
		name: "DeepSeek",
		url: "https://www.deepseek.com/",
		avatar: "https://www.deepseek.com/favicon.ico",
		description: "专注通用人工智能与大模型能力的 AI 技术平台。",
	},
	{
		name: "Cloudflare",
		url: "https://www.cloudflare.com/",
		avatar: "https://www.cloudflare.com/favicon.ico",
		description: "提供网络加速、安全防护与开发基础设施的全球云平台。",
	},
];
