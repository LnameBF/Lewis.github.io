/*
 * @Description: 
 * @Author: ljw
 * @Email: 3198354433@qq.com
 * @Date: 2026-05-13 16:33:53
 * @LastEditTime: 2026-05-13 17:59:15
 * @LastEditors: ljw
 */
export type CommentConfig = {
	enable: boolean;
	repo: string;
	repoId: string;
	category: string;
	categoryId: string;
	mapping: "pathname";
	strict: "0" | "1";
	reactionsEnabled: "0" | "1";
	inputPosition: "top" | "bottom";
	lang: string;
	theme: string;
};

export const commentConfig: CommentConfig = {
	enable: true,
	repo: "LnameBF/Lewis.github.io",
	repoId: "R_kgDOSbAp7g",
	category: "General",
	categoryId: "DIC_kwDOSbAp7s4C88PI",
	mapping: "pathname",
	strict: "0",
	reactionsEnabled: "1",
	inputPosition: "top",
	lang: "zh-CN",
	theme: "preferred_color_scheme",
};
