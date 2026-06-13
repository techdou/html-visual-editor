// find-replace.js — 查找替换（非侵入式高亮，CSS Custom Highlight API）
window.HVE_FindReplace = (function () {
  let panel = null;
  let matches = [];         // { range, textNode, start, end } 列表
  let currentIndex = -1;
  let highlightName = 'hve-find';
  let isActive = false;

  // ========== 激活/停用 ==========

  function activate() {
    // 模块加载时无需额外操作
  }

  function deactivate() {
    closePanel();
  }

  // ========== 面板 UI ==========

  function openPanel(showReplace) {
    if (panel && panel.parentNode) {
      // 已打开，切换到替换模式
      if (showReplace) {
        const replaceRow = panel.querySelector('.hve-fr-replace-row');
        if (replaceRow) replaceRow.style.display = 'flex';
      }
      panel.querySelector('.hve-fr-find-input')?.focus();
      return;
    }

    closePanel();

    panel = document.createElement('div');
    panel.setAttribute('data-hve-editor', 'true');
    panel.setAttribute('data-hve-find-panel', 'true');

    panel.innerHTML = `
      <div class="hve-fr-header">
        <span class="hve-fr-title">查找${showReplace ? '和替换' : ''}</span>
        <button class="hve-fr-close" title="关闭 (Esc)">&times;</button>
      </div>
      <div class="hve-fr-row">
        <input type="text" class="hve-fr-find-input" placeholder="查找..." />
        <span class="hve-fr-count">0/0</span>
      </div>
      <div class="hve-fr-row hve-fr-replace-row" style="display: ${showReplace ? 'flex' : 'none'}">
        <input type="text" class="hve-fr-replace-input" placeholder="替换为..." />
      </div>
      <div class="hve-fr-actions">
        <button class="hve-fr-btn" data-fr-action="prev" title="上一个匹配 (Shift+Enter)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button class="hve-fr-btn" data-fr-action="next" title="下一个匹配 (Enter)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <span class="hve-fr-sep"></span>
        <button class="hve-fr-btn" data-fr-action="toggle-replace" title="显示/隐藏替换">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
        </button>
        <button class="hve-fr-btn hve-fr-btn-replace" data-fr-action="replace" title="替换当前" style="display: none">替换</button>
        <button class="hve-fr-btn hve-fr-btn-replace-all" data-fr-action="replace-all" title="全部替换" style="display: none">全部</button>
      </div>
    `;

    // 事件绑定
    panel.querySelector('.hve-fr-close').addEventListener('click', closePanel);
    panel.querySelector('.hve-fr-find-input').addEventListener('input', onFindInput);
    panel.querySelector('.hve-fr-find-input').addEventListener('keydown', onFindKeyDown);
    panel.querySelector('.hve-fr-replace-input').addEventListener('keydown', onReplaceKeyDown);
    panel.addEventListener('click', onPanelClick);
    panel.addEventListener('keydown', onPanelKeyDown);

    document.body.appendChild(panel);
    isActive = true;

    // 聚焦查找输入框
    setTimeout(() => {
      panel?.querySelector('.hve-fr-find-input')?.focus();
    }, 50);
  }

  function closePanel() {
    clearHighlights();
    if (panel && panel.parentNode) {
      panel.remove();
    }
    panel = null;
    matches = [];
    currentIndex = -1;
    isActive = false;
  }

  // ========== 搜索逻辑 ==========

  function onFindInput() {
    const query = panel?.querySelector('.hve-fr-find-input')?.value || '';
    if (!query) {
      clearHighlights();
      updateCount();
      return;
    }
    performSearch(query);
  }

  function onFindKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        navigatePrev();
      } else {
        navigateNext();
      }
    }
  }

  function onReplaceKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      doReplace();
    }
  }

  function onPanelClick(e) {
    const btn = e.target.closest('[data-fr-action]');
    if (!btn) return;

    switch (btn.dataset.frAction) {
      case 'prev':
        navigatePrev();
        break;
      case 'next':
        navigateNext();
        break;
      case 'toggle-replace': {
        const replaceRow = panel.querySelector('.hve-fr-replace-row');
        const replaceBtn = panel.querySelector('[data-fr-action="replace"]');
        const replaceAllBtn = panel.querySelector('[data-fr-action="replace-all"]');
        const isHidden = replaceRow.style.display === 'none';
        replaceRow.style.display = isHidden ? 'flex' : 'none';
        replaceBtn.style.display = isHidden ? '' : 'none';
        replaceAllBtn.style.display = isHidden ? '' : 'none';
        if (isHidden) {
          panel.querySelector('.hve-fr-title').textContent = '查找和替换';
          panel.querySelector('.hve-fr-replace-input')?.focus();
        } else {
          panel.querySelector('.hve-fr-title').textContent = '查找';
        }
        break;
      }
      case 'replace':
        doReplace();
        break;
      case 'replace-all':
        doReplaceAll();
        break;
    }
  }

  function onPanelKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closePanel();
    }
  }

  /**
   * 执行搜索：使用 TreeWalker 遍历文本节点
   */
  function performSearch(query) {
    clearHighlights();
    matches = [];
    currentIndex = -1;

    if (!query) {
      updateCount();
      return;
    }

    const caseSensitive = false; // 可扩展
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    // 使用 TreeWalker 遍历所有文本节点
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          // 跳过编辑器自身元素内的文本
          if (node.parentElement && node.parentElement.closest('[data-hve-editor]')) {
            return NodeFilter.FILTER_REJECT;
          }
          // 跳过 script/style
          const tag = node.parentElement?.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          // 跳过空文本节点
          if (!node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const ranges = [];

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const text = caseSensitive ? textNode.textContent : textNode.textContent.toLowerCase();
      let searchStart = 0;

      while (searchStart < text.length) {
        const idx = text.indexOf(searchQuery, searchStart);
        if (idx === -1) break;

        const range = document.createRange();
        range.setStart(textNode, idx);
        range.setEnd(textNode, idx + query.length);

        matches.push({
          range,
          textNode,
          start: idx,
          end: idx + query.length,
        });

        ranges.push(range);
        searchStart = idx + query.length;
      }
    }

    // 使用 CSS Custom Highlight API 高亮（Chrome 105+）
    if (ranges.length > 0 && CSS.highlights) {
      const highlight = new Highlight(...ranges);
      CSS.highlights.set(highlightName, highlight);
    }

    // 跳到第一个匹配
    if (matches.length > 0) {
      currentIndex = 0;
      scrollToMatch(0);
    }

    updateCount();
  }

  /**
   * 清除所有高亮
   */
  function clearHighlights() {
    if (CSS.highlights && CSS.highlights.has(highlightName)) {
      CSS.highlights.delete(highlightName);
    }
  }

  /**
   * 更新匹配计数显示
   */
  function updateCount() {
    const countEl = panel?.querySelector('.hve-fr-count');
    if (!countEl) return;
    if (matches.length === 0) {
      countEl.textContent = '0/0';
    } else {
      countEl.textContent = `${currentIndex + 1}/${matches.length}`;
    }
  }

  // ========== 导航 ==========

  function navigateNext() {
    if (matches.length === 0) return;
    currentIndex = (currentIndex + 1) % matches.length;
    scrollToMatch(currentIndex);
    updateCount();
  }

  function navigatePrev() {
    if (matches.length === 0) return;
    currentIndex = (currentIndex - 1 + matches.length) % matches.length;
    scrollToMatch(currentIndex);
    updateCount();
  }

  function scrollToMatch(index) {
    if (index < 0 || index >= matches.length) return;

    // 清除之前的高亮焦点
    if (CSS.highlights && CSS.highlights.has(highlightName)) {
      CSS.highlights.delete(highlightName);
    }

    // 重新创建高亮，当前匹配使用不同高亮名
    const currentRange = matches[index].range;
    const otherRanges = matches.filter((_, i) => i !== index).map(m => m.range);

    if (CSS.highlights) {
      // 其他匹配 - 黄色背景
      if (otherRanges.length > 0) {
        CSS.highlights.set(highlightName, new Highlight(...otherRanges));
      }
      // 当前匹配 - 橙色背景
      CSS.highlights.set(highlightName + '-current', new Highlight(currentRange));
    }

    // 滚动到当前匹配
    try {
      currentRange.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    } catch (e) {
      // 降级：使用元素滚动
      const container = currentRange.startContainer.parentElement;
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  // ========== 替换逻辑 ==========

  function doReplace() {
    if (currentIndex < 0 || currentIndex >= matches.length) return;

    const match = matches[currentIndex];
    const query = panel?.querySelector('.hve-fr-find-input')?.value || '';
    const replacement = panel?.querySelector('.hve-fr-replace-input')?.value || '';

    const textNode = match.textNode;
    const oldText = textNode.textContent;
    const newText = oldText.substring(0, match.start) + replacement + oldText.substring(match.end);

    // 记录历史
    const parentEl = textNode.parentElement;
    if (parentEl && window.HVE_History) {
      window.HVE_History.record({
        type: 'content',
        element: parentEl,
        before: { innerHTML: parentEl.innerHTML },
        after: { innerHTML: '' }, // 占位，后面更新
        description: '查找替换'
      });
    }

    // 执行替换
    textNode.textContent = newText;

    // 更新历史 after
    if (parentEl && window.HVE_History) {
      const stack = window.HVE_History._undoStack;
      if (stack && stack.length > 0) {
        const last = stack[stack.length - 1];
        if (last.element === parentEl && last.type === 'content') {
          last.after.innerHTML = parentEl.innerHTML;
        }
      }
    }

    // 重新搜索
    performSearch(query);

    // 跳到下一个匹配
    if (matches.length > 0) {
      if (currentIndex >= matches.length) currentIndex = 0;
      scrollToMatch(currentIndex);
    }
    updateCount();
  }

  function doReplaceAll() {
    if (matches.length === 0) return;

    const query = panel?.querySelector('.hve-fr-find-input')?.value || '';
    const replacement = panel?.querySelector('.hve-fr-replace-input')?.value || '';

    // 按父元素分组记录历史（避免每个文本节点一条记录）
    const affectedParents = new Set();
    for (const match of matches) {
      if (match.textNode.parentElement) {
        affectedParents.add(match.textNode.parentElement);
      }
    }

    // 记录所有受影响父元素的 before
    const beforeStates = new Map();
    for (const parent of affectedParents) {
      beforeStates.set(parent, parent.innerHTML);
    }

    // 执行所有替换（从后往前，避免偏移问题）
    const sortedMatches = [...matches].sort((a, b) => {
      if (a.textNode !== b.textNode) return 0;
      return b.start - a.start;
    });

    for (const match of sortedMatches) {
      const textNode = match.textNode;
      // 检查节点是否仍在 DOM 中
      if (!textNode.isConnected) continue;
      const oldText = textNode.textContent;
      const newText = oldText.substring(0, match.start) + replacement + oldText.substring(match.end);
      textNode.textContent = newText;
    }

    // 记录历史
    for (const parent of affectedParents) {
      if (window.HVE_History && beforeStates.has(parent)) {
        window.HVE_History.record({
          type: 'content',
          element: parent,
          before: { innerHTML: beforeStates.get(parent) },
          after: { innerHTML: parent.innerHTML },
          description: `全部替换 (${matches.length} 处)`
        });
      }
    }

    if (window.HVE_Core) {
      window.HVE_Core.showToast(`已替换 ${matches.length} 处 ✓`, 'success');
    }

    // 重新搜索
    performSearch(query);
    updateCount();
  }

  // ========== 公共 API ==========

  return {
    activate,
    deactivate,
    openPanel,
    closePanel,
  };
})();
