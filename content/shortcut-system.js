// shortcut-system.js — 快捷键统一管理与帮助面板（增量模式）
window.HVE_Shortcuts = (function () {
  // 已注册的动态快捷键列表
  const shortcuts = [];

  // 帮助面板 DOM 引用
  let helpPanel = null;

  // ========== 现有快捷键静态描述列表（从 editor-core.js 提取） ==========
  // 这些快捷键仍在 editor-core.js 中处理，此处仅用于帮助面板展示
  const builtInShortcuts = [
    { combo: 'Ctrl+Z', description: '撤销', category: '编辑' },
    { combo: 'Ctrl+Y / Ctrl+Shift+Z', description: '重做', category: '编辑' },
    { combo: 'Ctrl+S', description: '保存文件', category: '文件' },
    { combo: 'Delete / Backspace', description: '删除选中元素', category: '编辑' },
    { combo: 'Escape', description: '取消选择 / 向上选父级', category: '导航' },
    { combo: 'Ctrl+D', description: '复制元素', category: '编辑' },
    { combo: 'Ctrl+Shift+C', description: '复制样式', category: '样式' },
    { combo: 'Ctrl+Shift+V', description: '粘贴样式', category: '样式' },
    { combo: '方向键', description: '微调位置（1px）', category: '编辑' },
    { combo: 'Shift+方向键', description: '微调位置（10px）', category: '编辑' },
    { combo: 'Ctrl+L', description: '锁定/解锁元素', category: '编辑' },
    { combo: 'Ctrl+G', description: '组合元素', category: '编辑' },
    { combo: 'Ctrl+Shift+G', description: '取消组合', category: '编辑' },
    { combo: 'Ctrl+Shift+P', description: '页面排序器', category: '视图' },
    { combo: 'Ctrl+B', description: '加粗（文本编辑中）', category: '格式' },
    { combo: 'Ctrl+I', description: '斜体（文本编辑中）', category: '格式' },
    { combo: 'Ctrl+U', description: '下划线（文本编辑中）', category: '格式' },
  ];

  // ========== 快捷键注册接口 ==========

  /**
   * 注册一个快捷键
   * @param {Object} options
   * @param {string} options.combo - 按键组合描述，如 'Ctrl+F', 'Ctrl+Shift+M'
   * @param {Function} options.action - 按键匹配时执行的函数，返回 true 表示已消费该事件
   * @param {string} options.description - 快捷键描述（用于帮助面板展示）
   * @param {string} options.category - 分类（编辑/文件/视图/格式/导航/样式 等）
   * @param {Function} [options.condition] - 额外条件判断函数，返回 true 才执行 action
   */
  function register(options) {
    if (!options || !options.combo || !options.action) return;
    shortcuts.push({
      combo: options.combo,
      action: options.action,
      description: options.description || '',
      category: options.category || '其他',
      condition: options.condition || null,
      // 解析 combo 为匹配条件
      parsed: parseCombo(options.combo),
    });
  }

  /**
   * 注销快捷键
   * @param {string} combo - 要注销的按键组合描述
   */
  function unregister(combo) {
    const idx = shortcuts.findIndex(s => s.combo === combo);
    if (idx !== -1) shortcuts.splice(idx, 1);
  }

  // ========== Combo 解析 ==========

  /**
   * 将 combo 字符串解析为匹配条件对象
   * 支持: Ctrl, Shift, Alt, Meta 修饰键 + 主键
   * 示例: 'Ctrl+F' → { ctrl: true, shift: false, alt: false, meta: false, key: 'f' }
   */
  function parseCombo(combo) {
    const parts = combo.split('+').map(p => p.trim());
    const result = {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
      key: '',
    };

    for (const part of parts) {
      const lower = part.toLowerCase();
      if (lower === 'ctrl' || lower === 'cmd') {
        result.ctrl = true;
      } else if (lower === 'shift') {
        result.shift = true;
      } else if (lower === 'alt') {
        result.alt = true;
      } else if (lower === 'meta') {
        result.meta = true;
      } else {
        result.key = lower;
      }
    }

    return result;
  }

  /**
   * 检查键盘事件是否匹配解析后的 combo
   */
  function matchesCombo(e, parsed) {
    // 修饰键匹配
    const ctrlMatch = parsed.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
    if (!ctrlMatch) return false;

    const shiftMatch = parsed.shift ? e.shiftKey : !e.shiftKey;
    if (!shiftMatch) return false;

    const altMatch = parsed.alt ? e.altKey : !e.altKey;
    if (!altMatch) return false;

    // 主键匹配
    if (parsed.key) {
      const eKey = e.key.toLowerCase();
      // 特殊键映射
      const keyMap = {
        'escape': 'escape',
        'enter': 'enter',
        'tab': 'tab',
        'space': ' ',
        'delete': 'delete',
        'backspace': 'backspace',
        '/': '/',
        '?': '?',
      };
      const targetKey = keyMap[parsed.key] || parsed.key;
      return eKey === targetKey;
    }

    return false;
  }

  // ========== 事件分发 ==========

  /**
   * 处理键盘事件（由 editor-core.js 的 onKeyDown 末尾调用）
   * 遍历已注册的动态快捷键，匹配则执行 action
   * @param {KeyboardEvent} e
   * @returns {boolean} true 表示事件已被消费，调用方应 stopPropagation
   */
  function handle(e) {
    for (const shortcut of shortcuts) {
      if (matchesCombo(e, shortcut.parsed)) {
        // 检查额外条件
        if (shortcut.condition && !shortcut.condition()) continue;

        const consumed = shortcut.action(e);
        if (consumed) {
          e.preventDefault();
          e.stopPropagation();
          return true;
        }
      }
    }
    return false;
  }

  // ========== 帮助面板 ==========

  /**
   * 切换帮助面板的显示/隐藏
   */
  function toggleHelp() {
    if (helpPanel && helpPanel.parentNode) {
      closeHelp();
    } else {
      openHelp();
    }
  }

  function openHelp() {
    closeHelp();

    helpPanel = document.createElement('div');
    helpPanel.setAttribute('data-hve-editor', 'true');
    helpPanel.setAttribute('data-hve-shortcut-help', 'true');

    // 合并内置和动态注册的快捷键
    const allShortcuts = [
      ...builtInShortcuts,
      ...shortcuts.map(s => ({ combo: s.combo, description: s.description, category: s.category })),
    ];

    // 按分类分组
    const categories = {};
    const categoryOrder = ['编辑', '格式', '样式', '文件', '视图', '导航', '其他'];
    for (const sc of allShortcuts) {
      const cat = sc.category || '其他';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(sc);
    }

    // 构建面板 HTML
    let html = `
      <div class="hve-sh-header">
        <span class="hve-sh-title">键盘快捷键</span>
        <button class="hve-sh-close" title="关闭">&times;</button>
      </div>
      <div class="hve-sh-search">
        <input type="text" class="hve-sh-search-input" placeholder="搜索快捷键..." />
      </div>
      <div class="hve-sh-body">
    `;

    for (const cat of categoryOrder) {
      if (!categories[cat]) continue;
      html += `<div class="hve-sh-category" data-category="${cat}">`;
      html += `<div class="hve-sh-cat-title">${cat}</div>`;
      for (const sc of categories[cat]) {
        html += `
          <div class="hve-sh-row" data-search="${sc.description.toLowerCase()} ${sc.combo.toLowerCase()}">
            <span class="hve-sh-desc">${sc.description}</span>
            <span class="hve-sh-keys">${formatCombo(sc.combo)}</span>
          </div>
        `;
      }
      html += `</div>`;
    }

    // 添加未在 categoryOrder 中的分类
    for (const cat of Object.keys(categories)) {
      if (categoryOrder.includes(cat)) continue;
      html += `<div class="hve-sh-category" data-category="${cat}">`;
      html += `<div class="hve-sh-cat-title">${cat}</div>`;
      for (const sc of categories[cat]) {
        html += `
          <div class="hve-sh-row" data-search="${sc.description.toLowerCase()} ${sc.combo.toLowerCase()}">
            <span class="hve-sh-desc">${sc.description}</span>
            <span class="hve-sh-keys">${formatCombo(sc.combo)}</span>
          </div>
        `;
      }
      html += `</div>`;
    }

    html += `</div>`; // .hve-sh-body

    helpPanel.innerHTML = html;

    // 事件绑定
    helpPanel.querySelector('.hve-sh-close').addEventListener('click', closeHelp);
    helpPanel.querySelector('.hve-sh-search-input').addEventListener('input', onSearchInput);
    helpPanel.addEventListener('keydown', onPanelKeyDown);

    document.body.appendChild(helpPanel);

    // 聚焦搜索框
    setTimeout(() => {
      helpPanel?.querySelector('.hve-sh-search-input')?.focus();
    }, 50);

    // 点击外部关闭
    setTimeout(() => {
      document.addEventListener('mousedown', onOutsideClick);
    }, 0);
  }

  function closeHelp() {
    document.removeEventListener('mousedown', onOutsideClick);
    if (helpPanel && helpPanel.parentNode) {
      helpPanel.remove();
    }
    helpPanel = null;
  }

  function onOutsideClick(e) {
    if (helpPanel && !helpPanel.contains(e.target)) {
      closeHelp();
    }
  }

  function onPanelKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeHelp();
    }
  }

  function onSearchInput(e) {
    if (!helpPanel) return;
    const query = e.target.value.trim().toLowerCase();
    const rows = helpPanel.querySelectorAll('.hve-sh-row');
    const categories = helpPanel.querySelectorAll('.hve-sh-category');

    rows.forEach(row => {
      const searchText = row.dataset.search || '';
      row.style.display = !query || searchText.includes(query) ? '' : 'none';
    });

    // 隐藏没有可见行的分类
    categories.forEach(cat => {
      const visibleRows = cat.querySelectorAll('.hve-sh-row:not([style*="display: none"])');
      cat.style.display = visibleRows.length > 0 ? '' : 'none';
    });
  }

  /**
   * 格式化 combo 字符串为可读的键盘符号
   */
  function formatCombo(combo) {
    // 先替换特殊关键词
    let result = combo
      .replace(/Ctrl/g, '⌘Ctrl⌘')
      .replace(/Shift/g, '⌘Shift⌘')
      .replace(/Alt/g, '⌘Alt⌘')
      .replace(/Meta/g, '⌘Meta⌘')
      .replace(/Delete/g, '⌘Del⌘')
      .replace(/Backspace/g, '⌘⌫⌘')
      .replace(/Escape/g, '⌘Esc⌘')
      .replace(/方向键/g, '⌘←↑↓→⌘');

    // 将 ⌘...⌘ 包裹的内容转为 <kbd> 标签
    result = result.replace(/⌘([^⌘]+)⌘/g, '<kbd>$1</kbd>');

    // 将 + 替换为加号分隔符
    result = result.replace(/\+/g, ' <span class="hve-sh-plus">+</span> ');

    // 将 / 分隔的多个 combo 用 " 或 " 连接
    result = result.replace(/\s*\/\s*/g, ' 或 ');

    // 将剩余的独立单字母包裹为 kbd（如 F, M 等新注册的快捷键主键）
    result = result.replace(/\b([A-Za-z0-9])\b(?!<)/g, '<kbd>$1</kbd>');

    return result;
  }

  // ========== 注册帮助面板快捷键 ==========

  register({
    combo: 'Ctrl+/',
    action: () => {
      toggleHelp();
      return true;
    },
    description: '快捷键帮助',
    category: '视图',
    condition: () => !window.HVE_TextEdit?.isEditing(),
  });

  // ========== 注册查找替换快捷键 ==========

  register({
    combo: 'Ctrl+F',
    action: () => {
      if (window.HVE_TextEdit?.isEditing()) window.HVE_TextEdit.finishEditing();
      if (window.HVE_FindReplace) window.HVE_FindReplace.openPanel(false);
      return true;
    },
    description: '查找',
    category: '编辑',
    condition: () => !window.HVE_TextEdit?.isEditing() || true, // 查找总是可用
  });

  register({
    combo: 'Ctrl+H',
    action: () => {
      if (window.HVE_TextEdit?.isEditing()) window.HVE_TextEdit.finishEditing();
      if (window.HVE_FindReplace) window.HVE_FindReplace.openPanel(true);
      return true;
    },
    description: '查找和替换',
    category: '编辑',
    condition: () => !window.HVE_TextEdit?.isEditing() || true,
  });

  // ========== 公共 API ==========

  return {
    register,
    unregister,
    handle,
    toggleHelp,
    closeHelp,
  };
})();
