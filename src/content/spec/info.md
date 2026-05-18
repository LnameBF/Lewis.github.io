---
title: 信息
---

## 信息/提交记录

### 概览

**当前提交：**<span id="commit-short">加载中...</span>
<br>
**提交哈希：**<span id="commit-full">加载中...</span>
<br>
**提交者：** <a id="commit-author-link" href="#" target="_blank" rel="noopener"><span id="commit-author">加载中...</span></a>
<br>
**提交日期：**<span id="commit-date">加载中...</span>
<br>
**提交详情：**<span id="commit-message">加载中...</span>

### 完整提交记录

<pre id="commit-json" style="overflow-x:auto;white-space:pre-wrap;word-wrap:break-word;font-size:0.85rem;line-height:1.5;background:#1e1e2e;color:#cdd6f4;padding:1rem;border-radius:0.5rem;">加载中...</pre>

<script is:inline>
async function loadCommitInfo() {
    try {
        const response = await fetch('https://api.github.com/repos/LnameBF/Lewis.github.io/commits?per_page=1');
        const data = await response.json();
        if (!data || !data[0]) return;
        const latest = data[0];

        const shortHash = latest.sha.slice(0, 7);
        const fullHash = latest.sha;
        const author = latest.commit.author.name;
        const authorLogin = latest.author ? latest.author.login : author;
        const date = new Date(latest.commit.author.date);
        const dateStr = date.getFullYear() + '/' +
            String(date.getMonth() + 1).padStart(2, '0') + '/' +
            String(date.getDate()).padStart(2, '0') + ' ' +
            String(date.getHours()).padStart(2, '0') + ':' +
            String(date.getMinutes()).padStart(2, '0') + ':' +
            String(date.getSeconds()).padStart(2, '0') + ' (UTC+8:00)';
        const message = latest.commit.message;

        const shortEl = document.getElementById('commit-short');
        const fullEl = document.getElementById('commit-full');
        const authorEl = document.getElementById('commit-author');
        const authorLinkEl = document.getElementById('commit-author-link');
        const dateEl = document.getElementById('commit-date');
        const messageEl = document.getElementById('commit-message');
        const jsonEl = document.getElementById('commit-json');

        if (shortEl) shortEl.innerHTML = '<a href="https://github.com/LnameBF/Lewis.github.io/commit/' + fullHash + '" target="_blank" rel="noopener">' + shortHash + '</a>';
        if (fullEl) fullEl.textContent = fullHash;
        if (authorEl) authorEl.textContent = author;
        if (authorLinkEl) authorLinkEl.href = 'https://github.com/' + authorLogin;
        if (dateEl) dateEl.textContent = dateStr;
        if (messageEl) messageEl.textContent = message;
        if (jsonEl) jsonEl.textContent = JSON.stringify(latest, null, 2);
    } catch (e) {
        console.error('Failed to load commit info:', e);
    }
}

loadCommitInfo();

// Re-run on swup page transitions
document.addEventListener('astro:page-load', () => {
    loadCommitInfo();
});
</script>
