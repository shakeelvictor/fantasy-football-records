// ====== League Rules ======
let activeSection = 'all';

function sectionBlock(section) {
  return `
    <div class="rule-section" id="rule-${section.id}">
      <div class="rule-section-head">
        <h2>${section.title}</h2>
        <p>${section.blurb}</p>
      </div>
      ${section.items.length ? `
        <ul class="rule-list">
          ${section.items.map(item => `
            <li>
              <span class="rule-text">${item.text}</span>
              ${item.since ? `<span class="since-badge">Set ${item.since}</span>` : ''}
            </li>
          `).join('')}
        </ul>
      ` : ''}
      ${(section.tables || []).length ? `
        <div class="rule-tables">
          ${section.tables.map(t => `
            <div class="rule-table">
              <h3>${t.caption}</h3>
              <dl>
                ${t.rows.map(([label, value]) => `
                  <div class="rule-row">
                    <dt>${label}</dt>
                    <dd>${value}</dd>
                  </div>
                `).join('')}
              </dl>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderSections() {
  const wrap = document.getElementById('ruleSections');
  const shown = activeSection === 'all'
    ? RULES
    : RULES.filter(s => s.id === activeSection);
  wrap.innerHTML = shown.map(sectionBlock).join('');
}

function renderSectionPills() {
  const wrap = document.getElementById('sectionPills');
  const options = [{ id: 'all', title: 'All Rules' }, ...RULES];
  wrap.innerHTML = options.map(o => `
    <button class="era-tab year-pill ${o.id === activeSection ? 'active' : ''}"
            data-section="${o.id}"
            aria-pressed="${o.id === activeSection}">
      ${o.title}
    </button>
  `).join('');

  wrap.querySelectorAll('.year-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSection = btn.dataset.section;
      syncHash();
      renderSectionPills();
      renderSections();
    });
  });
}

// Keep the selected section in the URL so a filtered view is linkable.
function syncHash() {
  if (activeSection === 'all') history.replaceState(null, '', location.pathname);
  else history.replaceState(null, '', `#${activeSection}`);
}

function readHash() {
  const id = location.hash.replace('#', '');
  if (RULES.some(s => s.id === id)) activeSection = id;
}

// Publish the sticky header's real height so the filter bar sits flush under it.
function trackHeaderHeight() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const set = () => document.documentElement.style
    .setProperty('--header-h', `${Math.round(header.getBoundingClientRect().height)}px`);
  set();
  if (window.ResizeObserver) new ResizeObserver(set).observe(header);
  else window.addEventListener('resize', set);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(set);
}

// ====== Mobile Nav ======
function setupMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
}

document.addEventListener('DOMContentLoaded', () => {
  readHash();
  renderSectionPills();
  renderSections();
  trackHeaderHeight();
  setupMobileNav();
});
