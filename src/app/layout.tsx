import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Iron Core Gym - Lifetime Admission & Billing Engine',
  description: '100% Lifetime Free Gym Admission and Billing Management with automated WhatsApp & Email reminders.',
  other: {
    'darkreader-lock': 'dark',
  },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#050811',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" content="dark" />
        <meta name="color-scheme" content="dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var origSetAttr = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, val) {
                    if (
                      name === 'bis_skin_checked' ||
                      name === 'bis_size' ||
                      (typeof name === 'string' && name.indexOf('data-darkreader') === 0)
                    ) {
                      return;
                    }
                    return origSetAttr.apply(this, arguments);
                  };

                  if (window.CSSStyleDeclaration && CSSStyleDeclaration.prototype.setProperty) {
                    var origSetProp = CSSStyleDeclaration.prototype.setProperty;
                    CSSStyleDeclaration.prototype.setProperty = function(prop, val, priority) {
                      if (typeof prop === 'string' && prop.indexOf('--darkreader') === 0) {
                        return;
                      }
                      return origSetProp.apply(this, arguments);
                    };
                  }

                  var clean = function(el) {
                    if (!el || el.nodeType !== 1) return;
                    if (el.hasAttribute('bis_skin_checked')) el.removeAttribute('bis_skin_checked');
                    if (el.hasAttribute('bis_size')) el.removeAttribute('bis_size');
                    if (el.hasAttribute('data-darkreader-inline-stroke')) el.removeAttribute('data-darkreader-inline-stroke');
                    if (el.hasAttribute('data-darkreader-inline-fill')) el.removeAttribute('data-darkreader-inline-fill');
                    if (el.style) {
                      if (el.style.getPropertyValue('--darkreader-inline-stroke')) {
                        el.style.removeProperty('--darkreader-inline-stroke');
                      }
                      if (el.style.getPropertyValue('--darkreader-inline-fill')) {
                        el.style.removeProperty('--darkreader-inline-fill');
                      }
                    }
                  };

                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes') {
                        clean(m.target);
                      } else if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          var node = m.addedNodes[j];
                          clean(node);
                          if (node.querySelectorAll) {
                            var children = node.querySelectorAll('[bis_skin_checked], [bis_size], [data-darkreader-inline-stroke], [data-darkreader-inline-fill]');
                            for (var k = 0; k < children.length; k++) {
                              clean(children[k]);
                            }
                          }
                        }
                      }
                    }
                  });

                  observer.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['bis_skin_checked', 'bis_size', 'data-darkreader-inline-stroke', 'data-darkreader-inline-fill', 'style'],
                    childList: true,
                    subtree: true
                  });
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-[#050811] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-black"
      >
        <Navbar />
        <main suppressHydrationWarning className="flex-1 pb-24 md:pb-12">{children}</main>
        <footer suppressHydrationWarning className="no-print border-t border-white/[0.06] bg-[#050811]/90 py-6 mb-16 md:mb-0 text-center text-xs text-slate-500">
          <div suppressHydrationWarning className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-medium">
            <div>
              Built for <strong className="text-slate-300">100% Lifetime Free Operation</strong> on Vercel, Neon, Cloudflare R2, Resend & Upstash.
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span>PostgreSQL: Connected</span>
              <span>•</span>
              <span>Storage: Cloudflare R2</span>
              <span>•</span>
              <span>Auto-Reminders: 8:00 AM</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
