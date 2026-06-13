// markdown-import.js — Markdown 导入（内嵌 snarkdown 解析器 + 表格支持）
window.HVE_MarkdownImport = (function () {
  let panel = null;
  let isActive = false;

  // ========== 内嵌 Snarkdown（MIT License, ~1KB） ==========
  // 原版: https://github.com/developit/snarkdown
  // 增强: 添加了表格解析支持

  function snarkdown(md) {
    if (!md) return '';
    let html = '';
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockContent = '';

    const lines = md.split('\n');
    // 先处理表格
    const processed = extractAndProcessTables(lines);

    let inList = false;
    let listTag = '';

    for (let i = 0; i < processed.length; i++) {
      let line = processed[i];

      // 代码块
      if (line.trimStart().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.trimStart().slice(3).trim();
          codeBlockContent = '';
          continue;
        } else {
          html += `<pre><code>${escapeHTML(codeBlockContent)}</code></pre>\n`;
          inCodeBlock = false;
          continue;
        }
      }
      if (inCodeBlock) {
        codeBlockContent += (codeBlockContent ? '\n' : '') + line;
        continue;
      }

      const trimmed = line.trim();

      // 空行
      if (!trimmed) {
        if (inList) { html += `</${listTag}>\n`; inList = false; }
        continue;
      }

      // 表格行（已处理为 HTML tr）
      if (trimmed.startsWith('[HVE-TABLE-TR]')) {
        if (inList) { html += `</${listTag}>\n`; inList = false; }
        html += trimmed.replace('[HVE-TABLE-TR]', '').trim() + '\n';
        continue;
      }
      if (trimmed.startsWith('[HVE-TABLE-END]')) {
        html += trimmed.replace('[HVE-TABLE-END]', '').trim() + '\n';
        continue;
      }

      // 标题
      const hMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
      if (hMatch) {
        if (inList) { html += `</${listTag}>\n`; inList = false; }
        const level = hMatch[1].length;
        html += `<h${level}>${inlineParse(hMatch[2])}</h${level}>\n`;
        continue;
      }

      // 水平线
      if (/^[-*_]{3,}\s*$/.test(trimmed)) {
        if (inList) { html += `</${listTag}>\n`; inList = false; }
        html += '<hr>\n';
        continue;
      }

      // 引用
      if (trimmed.startsWith('>')) {
        if (inList) { html += `</${listTag}>\n`; inList = false; }
        let quoteText = trimmed.replace(/^>\s?/, '');
        // 合并连续引用行
        while (i + 1 < processed.length && processed[i + 1].trim().startsWith('>')) {
          i++;
          quoteText += '<br>' + processed[i].trim().replace(/^>\s?/, '');
        }
        html += `<blockquote>${inlineParse(quoteText)}</blockquote>\n`;
        continue;
      }

      // 无序列表
      const ulMatch = trimmed.match(/^[-*+]\s+(.+)/);
      if (ulMatch) {
        if (!inList || listTag !== 'ul') {
          if (inList) html += `</${listTag}>\n`;
          html += '<ul>\n';
          inList = true; listTag = 'ul';
        }
        html += `<li>${inlineParse(ulMatch[1])}</li>\n`;
        continue;
      }

      // 有序列表
      const olMatch = trimmed.match(/^\d+[.)]\s+(.+)/);
      if (olMatch) {
        if (!inList || listTag !== 'ol') {
          if (inList) html += `</${listTag}>\n`;
          html += '<ol>\n';
          inList = true; listTag = 'ol';
        }
        html += `<li>${inlineParse(olMatch[1])}</li>\n`;
        continue;
      }

      // 普通段落
      if (inList) { html += `</${listTag}>\n`; inList = false; }
      html += `<p>${inlineParse(trimmed)}</p>\n`;
    }

    if (inList) html += `</${listTag}>\n`;
    if (inCodeBlock) html += `<pre><code>${escapeHTML(codeBlockContent)}</code></pre>\n`;

    return html;
  }

  // 提取并处理表格（返回处理后的行数组）
  function extractAndProcessTables(lines) {
    const result = [];
    let i = 0;
    while (i < lines.length) {
      // 检测表格：当前行含 |，下一行是分隔行（含 --- 和 |）
      const line = lines[i];
      if (line.includes('|') && line.trimStart().startsWith('|')) {
        const nextLine = lines[i + 1];
        if (nextLine && /^\|[\s\-:|]+\|$/.test(nextLine)) {
          // 解析对齐
          const aligns = nextLine.split('|').filter(c => c.trim()).map(c => {
            if (c.trim().startsWith(':') && c.trim().endsWith(':')) return 'center';
            if (c.trim().endsWith(':')) return 'right';
            return 'left';
          });
          const headerCells = parseTableRow(line);

          result.push('[HVE-TABLE-TR]<table><thead><tr>' +
            headerCells.map((c, idx) => `<th style="text-align:${aligns[idx] || 'left'}">${inlineParse(c)}</th>`).join('') +
            '</tr></thead><tbody>');

          i += 2; // 跳过表头和分隔行
          // 解析数据行
          while (i < lines.length && lines[i].trim().startsWith('|')) {
            const cells = parseTableRow(lines[i]);
            result.push('[HVE-TABLE-TR]<tr>' +
              cells.map((c, idx) => `<td style="text-align:${aligns[idx] || 'left'}">${inlineParse(c)}</td>`).join('') +
              '</tr>');
            i++;
          }
          result.push('[HVE-TABLE-END]</tbody></table>');
          continue;
        }
      }
      result.push(line);
      i++;
    }
    return result;
  }

  function parseTableRow(row) {
    return row.split('|').filter((c, idx, arr) => {
      // 排除首尾空元素
      if (idx === 0 && c.trim() === '') return false;
      if (idx === arr.length - 1 && c.trim() === '') return false;
      return true;
    }).map(c => c.trim());
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 行内解析
  function inlineParse(text) {
    // 图片（先于链接处理）
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;display:block;">');
    // 链接
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#D97706;text-decoration:underline;">$1</a>');
    // 粗体 + 斜体
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    text = text.replace(/__(.+?)__/g, '<b>$1</b>');
    text = text.replace(/\*(.+?)\*/g, '<i>$1</i>');
    text = text.replace(/_(.+?)_/g, '<i>$1</i>');
    // 行内代码
    text = text.replace(/`([^`]+)`/g, '<code style="background:#F5F2ED;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em;">$1</code>');
    // 删除线
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

    return text;
  }

  // ========== 激活/停用 ==========

  function activate() {}
  function deactivate() {
    closePanel();
  }

  // ========== 面板 UI ==========

  function openPanel() {
    if (panel && panel.parentNode) {
      panel.querySelector('.hve-md-textarea')?.focus();
      return;
    }
    closePanel();
    isActive = true;

    panel = document.createElement('div');
    panel.setAttribute('data-hve-editor', 'true');
    panel.setAttribute('data-hve-md-panel', 'true');

    panel.innerHTML = `
      <div class="hve-md-header">
        <span class="hve-md-title">Markdown 导入</span>
        <button class="hve-md-close" title="关闭 (Esc)">&times;</button>
      </div>
      <textarea class="hve-md-textarea" placeholder="在此粘贴 Markdown 内容..."></textarea>
      <div class="hve-md-preview" style="display:none;"></div>
      <div class="hve-md-footer">
        <button class="hve-md-btn" data-md-action="preview" title="切换预览">👁 预览</button>
        <div class="hve-md-footer-right">
          <button class="hve-md-btn hve-md-btn-cancel" data-md-action="cancel">取消</button>
          <button class="hve-md-btn hve-md-btn-insert" data-md-action="insert">插入</button>
        </div>
      </div>
    `;

    panel.querySelector('.hve-md-close').addEventListener('click', closePanel);
    panel.querySelector('.hve-md-textarea').addEventListener('keydown', onKeyDown);
    panel.addEventListener('click', onClick);
    panel.addEventListener('keydown', onPanelKeyDown);

    document.body.appendChild(panel);
    setTimeout(() => panel.querySelector('.hve-md-textarea')?.focus(), 50);
  }

  function closePanel() {
    if (panel && panel.parentNode) panel.remove();
    panel = null;
    isActive = false;
  }

  function onPanelKeyDown(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closePanel(); }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closePanel(); }
  }

  function onClick(e) {
    const btn = e.target.closest('[data-md-action]');
    if (!btn) return;

    switch (btn.dataset.mdAction) {
      case 'preview':
        togglePreview(btn);
        break;
      case 'cancel':
        closePanel();
        break;
      case 'insert':
        doInsert();
        break;
    }
  }

  let isPreviewing = false;

  function togglePreview(previewBtn) {
    const textarea = panel?.querySelector('.hve-md-textarea');
    const previewEl = panel?.querySelector('.hve-md-preview');
    if (!textarea || !previewEl) return;

    isPreviewing = !isPreviewing;
    if (isPreviewing) {
      const md = textarea.value;
      const html = snarkdown(md);
      previewEl.innerHTML = postProcessHTML(html);
      previewEl.style.display = 'block';
      textarea.style.display = 'none';
      previewBtn.innerHTML = '✏ 编辑';
    } else {
      previewEl.style.display = 'none';
      textarea.style.display = '';
      previewBtn.innerHTML = '👁 预览';
      textarea.focus();
    }
  }

  // ========== HTML 后处理 ==========

  function postProcessHTML(html) {
    // 用临时 div 解析 HTML
    const div = document.createElement('div');
    div.innerHTML = html;

    // 为表格添加编辑器兼容的 inline style
    const tables = div.querySelectorAll('table');
    tables.forEach(t => {
      t.style.cssText = 'width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;';
    });
    const ths = div.querySelectorAll('th');
    ths.forEach(th => {
      th.style.cssText = (th.style.cssText || '') + 'padding:12px 16px;background:#F5F2ED;font-weight:600;border-bottom:2px solid #E8E5E0;color:#5D534A;text-align:left;';
    });
    const tds = div.querySelectorAll('td');
    tds.forEach(td => {
      td.style.cssText = (td.style.cssText || '') + 'padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#2D2B28;';
    });

    // 确保段落有合适样式
    const ps = div.querySelectorAll('p');
    ps.forEach(p => {
      p.style.cssText = 'font-size:16px;line-height:1.8;color:#2D2B28;margin:10px 0;';
    });

    // 标题样式
    const hs = div.querySelectorAll('h1,h2,h3,h4,h5,h6');
    hs.forEach(h => {
      h.style.cssText = `font-size:${h.tagName === 'H1' ? 36 : h.tagName === 'H2' ? 28 : h.tagName === 'H3' ? 22 : 18}px;font-weight:700;color:#2D2B28;margin:20px 0 12px;`;
    });

    // 列表样式
    const uls = div.querySelectorAll('ul, ol');
    uls.forEach(ul => {
      ul.style.cssText = 'margin:12px 0;padding-left:24px;line-height:1.8;font-size:16px;color:#2D2B28;';
    });

    // 引用样式
    const bqs = div.querySelectorAll('blockquote');
    bqs.forEach(bq => {
      bq.style.cssText = 'margin:16px 0;padding:16px 20px;border-left:4px solid #D97706;background:#FAF9F7;color:#5D534A;font-size:16px;font-style:italic;';
    });

    // 图片样式
    const imgs = div.querySelectorAll('img');
    imgs.forEach(img => {
      img.style.cssText = 'max-width:100%;height:auto;margin:8px 0;display:block;border-radius:8px;';
    });

    return div.innerHTML;
  }

  // ========== 插入 DOM ==========

  function doInsert() {
    const textarea = panel?.querySelector('.hve-md-textarea');
    if (!textarea) return;
    const md = textarea.value.trim();
    if (!md) { closePanel(); return; }

    const rawHTML = snarkdown(md);
    const processedHTML = postProcessHTML(rawHTML);

    const fragment = document.createRange().createContextualFragment(processedHTML);

    // 确定插入位置：当前选中元素之后，或 body 末尾
    let insertParent, insertAfter;
    if (window.HVE_Selector?.isElementSelected()) {
      const sel = window.HVE_Selector.getSelected();
      insertParent = sel.parentElement;
      insertAfter = sel;
    } else {
      insertParent = document.body;
      insertAfter = null;
    }

    const nodes = [...fragment.children];

    // 记录历史
    if (window.HVE_History) {
      window.HVE_History.record({
        type: 'dom',
        element: insertParent,
        before: { action: 'html', html: insertParent.innerHTML },
        after: { action: 'html', html: '' },
        description: 'Markdown 导入'
      });
    }

    // 插入所有节点
    for (const node of nodes) {
      if (insertAfter) {
        insertAfter.parentNode.insertBefore(node, insertAfter.nextSibling);
        insertAfter = node;
      } else {
        insertParent.appendChild(node);
      }
    }

    // 更新历史 after
    if (window.HVE_History) {
      const stack = window.HVE_History._undoStack;
      if (stack?.length > 0) {
        const last = stack[stack.length - 1];
        if (last.element === insertParent) {
          last.after.html = insertParent.innerHTML;
        }
      }
    }

    if (window.HVE_Core) {
      window.HVE_Core.showToast(`已导入 ${nodes.length} 个元素 ✓`, 'success');
    }

    closePanel();
  }

  return { activate, deactivate, openPanel, closePanel };
})();