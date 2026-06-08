(function () {
    'use strict';

    window.BoseStoreData = {
        store: null,
        orderRules: null,
        categories: [],
        products: [],
        testimonials: [],
        statistics: [],
        footer: null,
        cakeBuilder: null,
        flowerBuilder: null,
        isLoaded: false
    };

    const JSON_PATH = 'data/site-data-final.json';

    const loadStoreDatabase = async () => {
        try {
            const response = await fetch(JSON_PATH);
            if (!response.ok) {
                throw new Error(`Failed to load store database: ${response.status}`);
            }
            const data = await response.json();
            
            window.BoseStoreData.store = data.store || null;
            window.BoseStoreData.orderRules = data.orderRules || null;
            window.BoseStoreData.categories = data.categories || [];
            window.BoseStoreData.products = data.products || [];
            window.BoseStoreData.testimonials = data.testimonials || [];
            window.BoseStoreData.statistics = data.statistics || [];
            window.BoseStoreData.footer = data.footer || null;
            window.BoseStoreData.cakeBuilder = data.cakeBuilder || null;
            window.BoseStoreData.flowerBuilder = data.flowerBuilder || null;
            window.BoseStoreData.isLoaded = true;

            document.dispatchEvent(new CustomEvent('BoseStoreDataReady', { detail: window.BoseStoreData }));
            
            initializeGlobalComponents();
        } catch (error) {
            console.error('📊 BoseSweets Core Engine Error:', error);
        }
    };

    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        if (!window.BoseStoreData || !window.BoseStoreData.store) return basePrice;
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return Math.round(basePrice * (1 + (rule.percent / 100)));
        }
        return basePrice;
    };

    const initializeGlobalComponents = () => {
        updateNavigationCartCount();
        injectGlobalBrandingData();
        setupGlobalNavigationInteractions();
    };

    const injectGlobalBrandingData = () => {
        const store = window.BoseStoreData.store;
        if (!store) return;

        const logoSelectors = ['#bose-store-logo', '#sidebar-logo-img', '#footer-logo-img'];
        logoSelectors.forEach(selector => {
            const img = document.querySelectorAll(selector);
            img.forEach(el => {
                if (el) {
                    el.src = store.logo;
                    el.alt = store.name;
                }
            });
        });

        const sloganText = document.getElementById('sidebar-slogan-text');
        if (sloganText) sloganText.textContent = store.slogan;

        const footerAbout = document.getElementById('footer-about-text');
        if (footerAbout && window.BoseStoreData.footer) {
            footerAbout.textContent = window.BoseStoreData.footer.about || store.slogan;
        }

        const footerPickup = document.getElementById('footer-pickup-address-text');
        if (footerPickup) {
            footerPickup.textContent = store.pickup.address;
        }

        renderGlobalNavigationLinks();
        renderFooterSocialLinks();
        renderFooterPolicies();
    };

    const renderGlobalNavigationLinks = () => {
        const navList = document.getElementById('main-nav-links-list');
        if (!navList) return;

        const links = [
            { text: 'الرئيسية', url: 'index.html' },
            { text: 'قائمة المنيو', url: 'menu.html' },
            { text: 'محاكي التورت', url: 'cake-builder.html' },
            { text: 'محاكي الورد', url: 'flower-builder.html' },
            { text: 'سلة المشتريات', url: 'cart.html' }
        ];

        navList.innerHTML = links.map(link => `
            <li class="nav-item">
                <a href="${link.url}" class="nav-item-link">${link.text}</a>
            </li>
        `).join('');
        
        highlightActiveNavLink();
    };

    const highlightActiveNavLink = () => {
        const currentFile = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-item-link');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentFile) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    const renderFooterSocialLinks = () => {
        const footerSocial = document.getElementById('footer-social-links');
        if (!footerSocial || !window.BoseStoreData.store) return;

        const socialData = window.BoseStoreData.store.priceIncrease ? {
            facebook: "https://www.facebook.com/share/1H1vVMHyu9/",
            instagram: "https://www.instagram.com/bose_sweets?igsh=amdkMmhxMXJyanYy",
            tiktok: "https://www.tiktok.com/@bosesweets1?_r=1&_t=ZS-96lRDDHq9QK"
        } : {};
        
        const fbBtn = footerSocial.querySelector('.social-link-facebook');
        if (fbBtn) fbBtn.href = socialData.facebook || '#';

        const igBtn = footerSocial.querySelector('.social-link-instagram');
        if (igBtn) igBtn.href = socialData.instagram || '#';

        const ttBtn = footerSocial.querySelector('.social-link-tiktok');
        if (ttBtn) ttBtn.href = socialData.tiktok || '#';

        const waBtn = footerSocial.querySelector('.social-link-whatsapp');
        if (waBtn) {
            const phone = window.BoseStoreData.store.phone || '01097238441';
            waBtn.href = `https://wa.me/${phone}`;
        }
    };

    const renderFooterPolicies = () => {
        const container = document.getElementById('global-footer-policies');
        if (!container || !window.BoseStoreData.footer || !window.BoseStoreData.footer.policies) return;

        const policyUrls = {
            "سياسة الخصوصية": "privacy-policy.html",
            "سياسة الاسترجاع": "refund-policy.html",
            "سياسة الطلبات": "shipping-policy.html",
            "الشروط والأحكام": "terms.html"
        };

        const currentYear = new Date().getFullYear();
        const policyLinksHtml = window.BoseStoreData.footer.policies.map(policyName => {
            const url = policyUrls[policyName] || '#';
            return `<a href="${url}" class="footer-policy-link">${policyName}</a>`;
        }).join(' | ');

        container.innerHTML = `
            <div class="footer-policies-links-wrapper">${policyLinksHtml}</div>
            <p class="footer-copyright-text" style="margin-top: 12px;">&copy; ${currentYear} حلويات بوسي. جميع الحقوق محفوظة.</p>
        `;
    };

    const setupGlobalNavigationInteractions = () => {
        const toggleTrigger = document.getElementById('sidebar-toggle-trigger');
        const closeTrigger = document.getElementById('sidebar-close-trigger');
        const navMenu = document.getElementById('bose-nav-menu');

        if (toggleTrigger && navMenu) {
            toggleTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                navMenu.classList.toggle('active');
            });
        }

        if (closeTrigger && navMenu) {
            closeTrigger.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (navMenu && navMenu.classList.contains('active')) {
                if (!navMenu.contains(e.target) && e.target !== toggleTrigger) {
                    navMenu.classList.remove('active');
                }
            }
        });
    };

    window.updateNavigationCartCount = () => {
        const cartCountBadge = document.getElementById('nav-cart-count');
        if (!cartCountBadge) return;

        try {
            const rawCart = localStorage.getItem('bose_cart');
            const cart = rawCart ? JSON.parse(rawCart) : [];
            const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
            cartCountBadge.textContent = totalItems;
        } catch (e) {
            cartCountBadge.textContent = '0';
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadStoreDatabase);
    } else {
        loadStoreDatabase();
    }
})();
