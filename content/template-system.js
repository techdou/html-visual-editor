// template-system.js — 模板系统（内置常用页面模板，一键套用）
window.HVE_TemplateSystem = (function () {
  let panel = null;

  // ========== 内置模板 ==========

  const templates = [
    {
      id: 'weekly-report',
      name: '周报',
      category: '工作',
      icon: '📊',
      html: `
        <h2 style="font-size:32px;font-weight:700;color:#2D2B28;margin:0 0 8px;text-align:center;">工作周报</h2>
        <p style="font-size:14px;color:#9C8E82;margin:0 0 32px;text-align:center;">YYYY年MM月DD日 — MM月DD日</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <thead><tr>
            <th style="padding:12px 16px;background:#F5F2ED;font-weight:600;border-bottom:2px solid #E8E5E0;color:#5D534A;text-align:left;">分类</th>
            <th style="padding:12px 16px;background:#F5F2ED;font-weight:600;border-bottom:2px solid #E8E5E0;color:#5D534A;text-align:left;">内容</th>
            <th style="padding:12px 16px;background:#F5F2ED;font-weight:600;border-bottom:2px solid #E8E5E0;color:#5D534A;text-align:left;">状态</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">本周完成</td><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">完成事项描述</td><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#16A34A;">✅ 完成</td></tr>
            <tr><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">进行中</td><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">进行中事项描述</td><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#D97706;">🔄 进行中</td></tr>
            <tr><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">下周计划</td><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">计划事项描述</td><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#9C8E82;">📋 待开始</td></tr>
            <tr><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">问题与风险</td><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">问题描述</td><td style="padding:10px 16px;border-bottom:1px solid #F0EDE8;color:#DC2626;">⚠️ 需关注</td></tr>
          </tbody>
        </table>
        <h3 style="font-size:20px;font-weight:600;color:#2D2B28;margin:28px 0 12px;">详细说明</h3>
        <p style="font-size:16px;line-height:1.8;color:#2D2B28;margin:10px 0;">在此补充本周工作的详细内容和心得。</p>
      `
    },
    {
      id: 'resume',
      name: '简历',
      category: '个人',
      icon: '📄',
      html: `
        <div style="max-width:720px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="font-size:36px;font-weight:700;color:#2D2B28;margin:0;">姓名</h1>
            <p style="font-size:15px;color:#9C8E82;margin:8px 0;">职位 · 城市 · email@example.com · 138****8888</p>
          </div>
          <h3 style="font-size:20px;font-weight:600;color:#D97706;margin:28px 0 12px;padding-bottom:6px;border-bottom:2px solid #D97706;">工作经历</h3>
          <div style="margin-bottom:20px;">
            <p style="font-size:17px;font-weight:600;color:#2D2B28;margin:0;">公司名称 — 职位</p>
            <p style="font-size:14px;color:#9C8E82;margin:4px 0 10px;">2020.01 — 至今</p>
            <ul style="margin:8px 0;padding-left:20px;line-height:1.8;font-size:15px;color:#5D534A;">
              <li>负责核心业务模块的开发与维护</li>
              <li>主导某项目的技术方案设计与落地</li>
              <li>带领团队完成关键里程碑交付</li>
            </ul>
          </div>
          <h3 style="font-size:20px;font-weight:600;color:#D97706;margin:28px 0 12px;padding-bottom:6px;border-bottom:2px solid #D97706;">教育背景</h3>
          <p style="font-size:17px;font-weight:600;color:#2D2B28;margin:0;">学校名称 — 专业 · 学历</p>
          <p style="font-size:14px;color:#9C8E82;margin:4px 0 0;">2016.09 — 2020.06</p>
          <h3 style="font-size:20px;font-weight:600;color:#D97706;margin:28px 0 12px;padding-bottom:6px;border-bottom:2px solid #D97706;">技能</h3>
          <p style="font-size:15px;color:#5D534A;margin:0;line-height:2;">HTML/CSS · JavaScript · React · Node.js · Git · Docker</p>
        </div>
      `
    },
    {
      id: 'poster',
      name: '产品海报',
      category: '营销',
      icon: '🎨',
      html: `
        <div style="max-width:600px;margin:60px auto;padding:48px 40px;background:linear-gradient(135deg,#D97706,#B45309);border-radius:20px;text-align:center;color:white;">
          <p style="font-size:14px;letter-spacing:4px;margin:0 0 16px;opacity:0.8;">🔥 新品上线</p>
          <h1 style="font-size:42px;font-weight:800;margin:0 0 16px;color:white;">产品名称</h1>
          <p style="font-size:20px;margin:0 0 32px;opacity:0.9;line-height:1.6;">一句话核心卖点描述<br>吸引目标用户注意力</p>
          <div style="display:inline-block;padding:14px 40px;background:white;color:#D97706;border-radius:12px;font-size:18px;font-weight:700;margin-bottom:32px;">立即体验 →</div>
          <div style="display:flex;justify-content:center;gap:40px;font-size:14px;opacity:0.8;">
            <span>⚡ 特性一</span><span>🎯 特性二</span><span>🔒 特性三</span>
          </div>
        </div>
      `
    },
    {
      id: 'meeting',
      name: '会议纪要',
      category: '工作',
      icon: '📋',
      html: `
        <h1 style="font-size:30px;font-weight:700;color:#2D2B28;margin:0 0 8px;">会议纪要</h1>
        <table style="width:100%;border-collapse:collapse;margin:16px 0 24px;font-size:14px;">
          <tr><td style="padding:8px 12px;color:#9C8E82;width:80px;">会议主题</td><td style="padding:8px 12px;color:#2D2B28;border-bottom:1px solid #F0EDE8;">请输入会议主题</td></tr>
          <tr><td style="padding:8px 12px;color:#9C8E82;">时　间</td><td style="padding:8px 12px;color:#2D2B28;border-bottom:1px solid #F0EDE8;">YYYY年MM月DD日 HH:MM</td></tr>
          <tr><td style="padding:8px 12px;color:#9C8E82;">地　点</td><td style="padding:8px 12px;color:#2D2B28;border-bottom:1px solid #F0EDE8;">会议室 / 线上</td></tr>
          <tr><td style="padding:8px 12px;color:#9C8E82;">参会人</td><td style="padding:8px 12px;color:#2D2B28;border-bottom:1px solid #F0EDE8;">张三、李四、王五</td></tr>
        </table>
        <h3 style="font-size:18px;font-weight:600;color:#2D2B28;margin:24px 0 10px;">一、会议目的</h3>
        <p style="font-size:16px;line-height:1.8;color:#2D2B28;margin:8px 0;">在此描述本次会议的背景和目标。</p>
        <h3 style="font-size:18px;font-weight:600;color:#2D2B28;margin:24px 0 10px;">二、讨论内容</h3>
        <ol style="margin:8px 0;padding-left:24px;line-height:1.8;font-size:16px;color:#2D2B28;">
          <li><b>议题一：</b>讨论内容与结论</li>
          <li><b>议题二：</b>讨论内容与结论</li>
          <li><b>议题三：</b>讨论内容与结论</li>
        </ol>
        <h3 style="font-size:18px;font-weight:600;color:#2D2B28;margin:24px 0 10px;">三、待办事项</h3>
        <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">
          <thead><tr>
            <th style="padding:10px 14px;background:#F5F2ED;font-weight:600;border-bottom:2px solid #E8E5E0;color:#5D534A;">事项</th>
            <th style="padding:10px 14px;background:#F5F2ED;font-weight:600;border-bottom:2px solid #E8E5E0;color:#5D534A;">负责人</th>
            <th style="padding:10px 14px;background:#F5F2ED;font-weight:600;border-bottom:2px solid #E8E5E0;color:#5D534A;">截止日期</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding:10px 14px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">待办事项描述</td><td style="padding:10px 14px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">张三</td><td style="padding:10px 14px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">MM-DD</td></tr>
            <tr><td style="padding:10px 14px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">待办事项描述</td><td style="padding:10px 14px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">李四</td><td style="padding:10px 14px;border-bottom:1px solid #F0EDE8;color:#2D2B28;">MM-DD</td></tr>
          </tbody>
        </table>
      `
    },
    {
      id: 'data-brief',
      name: '数据简报',
      category: '工作',
      icon: '📈',
      html: `
        <h1 style="font-size:30px;font-weight:700;color:#2D2B28;margin:0 0 24px;">数据简报</h1>
        <div style="display:flex;gap:16px;margin:20px 0;flex-wrap:wrap;">
          <div style="flex:1;min-width:140px;padding:20px;background:linear-gradient(135deg,#FEF3C7,#FFFDF9);border-radius:14px;border:1px solid #F0EDE8;text-align:center;">
            <p style="font-size:12px;color:#9C8E82;margin:0 0 6px;">核心指标一</p>
            <p style="font-size:32px;font-weight:700;color:#D97706;margin:0;">12,345</p>
            <p style="font-size:12px;color:#16A34A;margin:4px 0 0;">↑ 12.5%</p>
          </div>
          <div style="flex:1;min-width:140px;padding:20px;background:linear-gradient(135deg,#E6F7EE,#FFFDF9);border-radius:14px;border:1px solid #F0EDE8;text-align:center;">
            <p style="font-size:12px;color:#9C8E82;margin:0 0 6px;">核心指标二</p>
            <p style="font-size:32px;font-weight:700;color:#16A34A;margin:0;">8,901</p>
            <p style="font-size:12px;color:#16A34A;margin:4px 0 0;">↑ 5.2%</p>
          </div>
          <div style="flex:1;min-width:140px;padding:20px;background:linear-gradient(135deg,#E8E9F7,#FFFDF9);border-radius:14px;border:1px solid #F0EDE8;text-align:center;">
            <p style="font-size:12px;color:#9C8E82;margin:0 0 6px;">核心指标三</p>
            <p style="font-size:32px;font-weight:700;color:#4F46E5;margin:0;">98.5%</p>
            <p style="font-size:12px;color:#9C8E82;margin:4px 0 0;">持平</p>
          </div>
        </div>
        <h3 style="font-size:18px;font-weight:600;color:#2D2B28;margin:28px 0 10px;">趋势分析</h3>
        <p style="font-size:16px;line-height:1.8;color:#5D534A;margin:8px 0;">在此撰写本周期数据的趋势分析和关键发现。</p>
        <h3 style="font-size:18px;font-weight:600;color:#2D2B28;margin:24px 0 10px;">建议与行动</h3>
        <ul style="margin:8px 0;padding-left:24px;line-height:1.8;font-size:16px;color:#2D2B28;">
          <li>基于数据分析的行动建议一</li>
          <li>基于数据分析的行动建议二</li>
        </ul>
      `
    },
    {
      id: 'invitation',
      name: '邀请函',
      category: '营销',
      icon: '💌',
      html: `
        <div style="max-width:580px;margin:40px auto;padding:48px 36px;background:#FFFDF9;border:2px solid #E8E5E0;border-radius:20px;text-align:center;">
          <p style="font-size:14px;color:#B8ADA4;letter-spacing:4px;margin:0 0 12px;">诚邀莅临</p>
          <h1 style="font-size:34px;font-weight:700;color:#2D2B28;margin:0 0 16px;">活动标题</h1>
          <p style="font-size:17px;color:#5D534A;line-height:1.8;margin:0 0 28px;">在此撰写诚挚的活动邀请文案，<br>描述活动的亮点和吸引力。</p>
          <div style="display:flex;justify-content:center;gap:32px;margin:28px 0;font-size:14px;color:#5D534A;">
            <div><span style="color:#9C8E82;">📅 时间</span><br>MM月DD日 HH:MM</div>
            <div><span style="color:#9C8E82;">📍 地点</span><br>活动地址</div>
            <div><span style="color:#9C8E82;">👥 规模</span><br>100人</div>
          </div>
          <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#E8E5E0,transparent);margin:28px 0;">
          <p style="font-size:13px;color:#B8ADA4;margin:0;">如需参加，请回复本邀请函</p>
        </div>
      `
    }
  ];

  // ========== 激活/停用 ==========

  function activate() {}
  function deactivate() {
    closePanel();
  }

  // ========== 模板面板 ==========

  function openPanel() {
    if (panel && panel.parentNode) return;
    closePanel();

    panel = document.createElement('div');
    panel.setAttribute('data-hve-editor', 'true');
    panel.setAttribute('data-hve-template-panel', 'true');

    const categories = [...new Set(templates.map(t => t.category))];
    let catTabs = categories.map(c => `<button class="hve-tp-cat-btn" data-cat="${c}">${c}</button>`).join('');

    let gridHTML = '';
    templates.forEach(t => {
      gridHTML += `
        <div class="hve-tp-card" data-template="${t.id}" data-category="${t.category}">
          <div class="hve-tp-card-icon">${t.icon}</div>
          <div class="hve-tp-card-name">${t.name}</div>
        </div>`;
    });

    panel.innerHTML = `
      <div class="hve-tp-header">
        <span class="hve-tp-title">从模板创建</span>
        <button class="hve-tp-close" title="关闭 (Esc)">&times;</button>
      </div>
      <div class="hve-tp-categories">${catTabs}</div>
      <div class="hve-tp-grid">${gridHTML}</div>
      <div class="hve-tp-footer">
        <span class="hve-tp-hint">选择模板后，当前页面内容将被替换（可通过「应急恢复」按钮撤销）</span>
      </div>
    `;

    // 事件绑定
    panel.querySelector('.hve-tp-close').addEventListener('click', closePanel);
    panel.addEventListener('click', onPanelClick);
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closePanel(); }
    });
    panel.querySelector('.hve-tp-categories').addEventListener('click', onCategoryClick);

    document.body.appendChild(panel);

    // 默认选中第一个分类
    const firstCat = panel.querySelector('.hve-tp-cat-btn');
    if (firstCat) firstCat.classList.add('hve-tp-cat-active');

    // 点击外部关闭
    setTimeout(() => { document.addEventListener('mousedown', onOutsideClick); }, 0);
  }

  function closePanel() {
    document.removeEventListener('mousedown', onOutsideClick);
    if (panel?.parentNode) panel.remove();
    panel = null;
  }

  function onOutsideClick(e) {
    if (panel && !panel.contains(e.target)) closePanel();
  }

  function onCategoryClick(e) {
    const btn = e.target.closest('.hve-tp-cat-btn');
    if (!btn) return;
    const cat = btn.dataset.cat;

    // 切换标签样式
    panel.querySelectorAll('.hve-tp-cat-btn').forEach(b => b.classList.remove('hve-tp-cat-active'));
    btn.classList.add('hve-tp-cat-active');

    // 过滤卡片
    panel.querySelectorAll('.hve-tp-card').forEach(card => {
      card.style.display = card.dataset.category === cat ? '' : 'none';
    });
  }

  function onPanelClick(e) {
    const card = e.target.closest('.hve-tp-card');
    if (!card) return;
    applyTemplate(card.dataset.template);
  }

  // ========== 套用模板 ==========

  function applyTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // 保存当前 body HTML 到 chrome.storage.local 作为紧急恢复点
    const backupHTML = document.body.innerHTML;

    try {
      chrome.storage?.local?.set({ 'hve_template_backup': backupHTML });
    } catch (e) {}

    // 清空 body 并填充模板内容（保留编辑器注入的 UI 元素）
    const editorElements = [];
    const allEditorEls = document.body.querySelectorAll('[data-hve-editor]');
    allEditorEls.forEach(el => el.remove());

    // 替换 body 内容
    document.body.innerHTML = template.html;

    // 清空历史
    if (window.HVE_History) window.HVE_History.clear();

    // 重新选中 body 下的第一个元素
    setTimeout(() => {
      const firstEl = document.body.firstElementChild;
      if (firstEl && window.HVE_Selector) {
        window.HVE_Selector.select(firstEl);
      }
    }, 100);

    closePanel();

    if (window.HVE_Core) {
      window.HVE_Core.showToast(`已套用「${template.name}」模板 ✓  Ctrl+Shift+R 可恢复`, 'success');
    }

    // 将恢复信息存入 sessionStorage
    sessionStorage.setItem('hve_template_applied', templateId);
  }

  /**
   * 应急恢复：恢复到套用模板前的状态
   */
  function emergencyRevert() {
    chrome.storage?.local?.get('hve_template_backup', (result) => {
      const backup = result?.hve_template_backup;
      if (!backup) {
        if (window.HVE_Core) window.HVE_Core.showToast('没有找到恢复备份', 'info');
        return;
      }

      document.body.innerHTML = backup;

      if (window.HVE_History) window.HVE_History.clear();
      chrome.storage?.local?.remove('hve_template_backup');
      sessionStorage.removeItem('hve_template_applied');

      // 重新激活选择
      setTimeout(() => {
        const firstEl = document.body.firstElementChild;
        if (firstEl && window.HVE_Selector) {
          window.HVE_Selector.select(firstEl);
        }
      }, 100);

      if (window.HVE_Core) window.HVE_Core.showToast('已恢复到套用模板前的状态 ✓', 'success');
    });
  }

  return { activate, deactivate, openPanel, closePanel, emergencyRevert };
})();