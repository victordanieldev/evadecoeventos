'use strict';

const WHATSAPP = '556193514928';

const COLORS = ['#111111', '#c9a24a', '#e8d49a', '#8f6b1c', '#2a2a2a'];
const root = document.documentElement;
const matches = q => window.matchMedia(q).matches;

/* Anuncia uma mensagem para leitores de tela (região aria-live) */
function say(el, msg) {
    el.textContent = '';
    setTimeout(() => {
        el.textContent = msg;
    }, 60);
}

/* ---------- Acessibilidade: tamanho do texto, contraste e animações ---------- */
const store = {
    get(k) {
        try {
            return localStorage.getItem(k);
        } catch {
            return null;
        }
    },
    set(k, v) {
        try {
            localStorage.setItem(k, v);
        } catch {
            /* sem armazenamento */
        }
    },
    del(k) {
        try {
            localStorage.removeItem(k);
        } catch {
            /* sem armazenamento */
        }
    }
};

const FONT_STEPS = [100, 115, 130, 150, 175];
let fontIdx = Number(store.get('a11y-font'));

if (!(fontIdx >= 0 && fontIdx < FONT_STEPS.length)) {
    fontIdx = 0;
}

const sc = store.get('a11y-contrast');
const sm = store.get('a11y-motion');

// Respeita as preferências do sistema quando a pessoa ainda não escolheu nada
let contrastOn = sc !== null ? sc === '1' : matches('(prefers-contrast: more)');
let motionOff = sm !== null ? sm === '1' : matches('(prefers-reduced-motion: reduce)');

const a11yStatus = document.getElementById('a11yStatus');
const fontUp = document.getElementById('fontUp');
const fontDown = document.getElementById('fontDown');
const contrastBtn = document.getElementById('contrastBtn');
const motionBtn = document.getElementById('motionBtn');

function applyA11y() {
    root.style.fontSize = FONT_STEPS[fontIdx] + '%';
    root.classList.toggle('contrast', contrastOn);
    root.classList.toggle('no-motion', motionOff);
    contrastBtn.setAttribute('aria-pressed', String(contrastOn));
    motionBtn.setAttribute('aria-pressed', String(motionOff));
}

function changeFont(step) {
    const next = Math.min(Math.max(fontIdx + step, 0), FONT_STEPS.length - 1);
    const limit = next === fontIdx;

    fontIdx = next;
    store.set('a11y-font', fontIdx);
    applyA11y();

    say(
        a11yStatus,
        `Tamanho do texto: ${FONT_STEPS[fontIdx]}%` + (limit ? (step > 0 ? ' (máximo)' : ' (mínimo)') : '')
    );
}

fontUp.addEventListener('click', () => changeFont(1));
fontDown.addEventListener('click', () => changeFont(-1));

contrastBtn.addEventListener('click', () => {
    contrastOn = !contrastOn;
    store.set('a11y-contrast', contrastOn ? '1' : '0');
    applyA11y();
    say(a11yStatus, contrastOn ? 'Alto contraste ativado' : 'Alto contraste desativado');
});

motionBtn.addEventListener('click', () => {
    motionOff = !motionOff;
    store.set('a11y-motion', motionOff ? '1' : '0');
    applyA11y();
    say(a11yStatus, motionOff ? 'Animações pausadas' : 'Animações ativadas');
});

applyA11y();

/* ---------- Menu de acessibilidade: abre e fecha ---------- */
const widget = document.getElementById('a11yWidget');
const a11yToggle = document.getElementById('a11yToggle');
const a11yPanel = document.getElementById('a11yPanel');

function setPanel(open, returnFocus) {
    a11yPanel.hidden = !open;
    a11yToggle.setAttribute('aria-expanded', String(open));

    if (!open && returnFocus) {
        a11yToggle.focus();
    }
}

function closePanel(returnFocus) {
    if (!a11yPanel.hidden) {
        setPanel(false, returnFocus);
    }
}

a11yToggle.addEventListener('click', () => setPanel(a11yPanel.hidden, false));

document.addEventListener('click', e => {
    if (!widget.contains(e.target)) {
        closePanel(false);
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    ['a11y-font', 'a11y-contrast', 'a11y-motion'].forEach(k => store.del(k));
    fontIdx = 0;
    contrastOn = matches('(prefers-contrast: more)');
    motionOff = matches('(prefers-reduced-motion: reduce)');
    applyA11y();
    say(a11yStatus, 'Opções restauradas para o padrão');
});

/* ---------- Libras (VLibras, tradutor oficial do governo) ---------- */
document.getElementById('librasBtn').addEventListener('click', () => {
    const vlibras = document.querySelector('[vw-access-button]');

    if (vlibras && vlibras.children.length) {
        vlibras.click();
        closePanel(false);
    } else {
        say(a11yStatus, 'O tradutor de Libras não carregou. Verifique a internet e recarregue a página.');
    }
});

window.addEventListener('load', () => {
    try {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
    } catch {
    }
});

/* ---------- Header e menu mobile ---------- */
const topbar = document.getElementById('topbar');
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
    topbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

function closeMenu(returnFocus) {
    if (!nav.classList.contains('open')) {
        return;
    }

    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');

    if (returnFocus) {
        menuBtn.focus();
    }
}

menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
});

nav.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
        closeMenu(false);
    }
});

/* ---------- Balões do hero ---------- */
const stage = document.getElementById('balloons');
const countEl = document.getElementById('popCount');
let popped = 0;

function spawnBalloon(delay = 0) {
    const b = document.createElement('div');
    const size = 50 + Math.random() * 50;

    b.className = 'balloon';
    b.style.cssText =
        `--s:${size}px;--c:${COLORS[Math.floor(Math.random() * COLORS.length)]};` +
        `--d:${9 + Math.random() * 8}s;--rest:${20 + Math.random() * 60}%;` +
        `left:${Math.random() * 92}%;animation-delay:${delay}s,0s;`;

    b.addEventListener('click', () => pop(b));
    b.addEventListener('animationend', e => {
        if (e.animationName === 'rise') {
            b.remove();
        }
    });

    stage.appendChild(b);
}

function pop(b) {
    const r = b.getBoundingClientRect();
    const s = stage.getBoundingClientRect();

    burst(
        r.left - s.left + r.width / 2,
        r.top - s.top + r.height / 2,
        b.style.getPropertyValue('--c')
    );

    b.remove();
    countEl.textContent = ++popped;
}

function burst(x, y, color) {
    if (motionOff) {
        return;
    }

    for (let i = 0; i < 14; i++) {
        const c = document.createElement('i');

        c.className = 'confetti';
        c.style.cssText = `left:${x}px;top:${y}px;background:${i % 2 ? color : '#c9a24a'};`;
        stage.appendChild(c);

        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 90;

        c.animate(
            [
                {
                    transform: 'translate(0,0) rotate(0)',
                    opacity: 1
                },
                {
                    transform: `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist + 60}px) rotate(${Math.random() * 540}deg)`,
                    opacity: 0
                }
            ],
            {
                duration: 800 + Math.random() * 400,
                easing: 'ease-out'
            }
        ).onfinish = () => c.remove();
    }
}

for (let i = 0; i < 9; i++) {
    spawnBalloon(i * 0.5);
}

setInterval(() => {
    if (!document.hidden && !motionOff) {
        spawnBalloon();
    }
}, 1800);

/* ---------- Galeria: filtro e foto ampliada ---------- */
const gallery = document.getElementById('gallery');
const galStatus = document.getElementById('galStatus');
const figures = [...gallery.querySelectorAll('figure')];
const chips = [...document.querySelectorAll('.chip')];

/* ---------- Carrossel independente para cada card ---------- */
gallery.querySelectorAll('.gallery-carousel').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('.carousel-slide')];
    const prev = carousel.querySelector('.prev');
    const next = carousel.querySelector('.next');
    const counter = carousel.querySelector('.carousel-counter');

    if (!slides.length || !prev || !next || !counter) {
        return;
    }

    let current = 0;

    function showSlide(index) {
        current = (index + slides.length) % slides.length;

        slides.forEach((slide, i) => {
            slide.hidden = i !== current;
        });

        counter.textContent = `${current + 1} / ${slides.length}`;

        prev.hidden = slides.length <= 1;
        next.hidden = slides.length <= 1;
        counter.hidden = slides.length <= 1;
    }

    prev.addEventListener('click', event => {
        event.stopPropagation();
        showSlide(current - 1);
    });

    next.addEventListener('click', event => {
        event.stopPropagation();
        showSlide(current + 1);
    });

    showSlide(0);
});

gallery.querySelectorAll('.g-btn').forEach(btn => {
    const img = btn.querySelector('img');

    const markBroken = () => {
        img.classList.add('broken');
        btn.disabled = true;
        btn.closest('figure').setAttribute('aria-hidden', 'true');
    };

    img.addEventListener('error', markBroken);

    if (img.complete && img.naturalWidth === 0) {
        markBroken();
    }
});

chips.forEach(c => c.setAttribute('aria-pressed', String(c.classList.contains('active'))));

document.querySelector('.filters').addEventListener('click', e => {
    const chip = e.target.closest('.chip');

    if (!chip) {
        return;
    }

    chips.forEach(c => {
        c.classList.toggle('active', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
    });

    let shown = 0;

    figures.forEach(f => {
        const hide = chip.dataset.filter !== 'todos' && f.dataset.cat !== chip.dataset.filter;

        f.classList.toggle('hide', hide);

        if (!hide) {
            shown++;
        }
    });

    say(galStatus, `Filtro ${chip.textContent}: ${shown} ${shown === 1 ? 'item' : 'itens'}`);
});

const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbClose = document.getElementById('lbClose');
let lastFocus = null;

function openLb(btn) {
    lbImg.src = btn.querySelector('img').src;
    lbImg.alt = btn.dataset.alt;
    lastFocus = btn;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
}

function closeLb() {
    if (lb.hidden) {
        return;
    }

    lb.hidden = true;
    document.body.style.overflow = '';

    if (lastFocus) {
        lastFocus.focus();
    }
}

gallery.addEventListener('click', e => {
    const btn = e.target.closest('.g-btn');

    if (btn && !btn.disabled) {
        openLb(btn);
    }
});

lb.addEventListener('click', e => {
    if (e.target !== lbImg) {
        closeLb();
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeLb();
        closeMenu(true);
        closePanel(true);
    }

    // Com a foto aberta, o foco fica preso no botão Fechar
    if (e.key === 'Tab' && !lb.hidden) {
        e.preventDefault();
        lbClose.focus();
    }
});

/* ---------- Formulário: valida, avisa erros e abre o WhatsApp ---------- */
const form = document.getElementById('contactForm');
const errorEl = document.getElementById('formError');

form.addEventListener('submit', e => {
    e.preventDefault();

    const d = Object.fromEntries(new FormData(form));
    const bad = [];

    [
        ['nome', !d.nome.trim()],
        ['tipo', !d.tipo]
    ].forEach(([name, isBad]) => {
        form[name].classList.toggle('invalid', isBad);
        form[name].setAttribute('aria-invalid', String(isBad));

        if (isBad) {
            bad.push(form[name]);
        }
    });

    if (bad.length) {
        errorEl.textContent = bad.length > 1
            ? 'Preencha seu nome e escolha o tipo de evento.'
            : (bad[0] === form.nome ? 'Preencha seu nome.' : 'Escolha o tipo de evento.');
        bad[0].focus();
        return;
    }

    errorEl.textContent = '';

    const data = d.data ? d.data.split('-').reverse().join('/') : 'a definir';
    const text =
        `Olá, Eva! Sou ${d.nome.trim()}. Quero um orçamento de decoração para ${d.tipo.toLowerCase()}na ` +
        `Data: ${data},   ${ d.msg.trim()}`;

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
});

document.getElementById('year').textContent = new Date().getFullYear();
