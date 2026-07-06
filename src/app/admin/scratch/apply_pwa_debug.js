const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/components/PWAInstallPrompt.js';
let content = fs.readFileSync(filePath, 'utf8');

const hasCRLF = content.includes('\r\n');

// Target the start of the function definition
const targetHooks = `export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner]         = useState(false);

  // All detection via lazy initializers — no setState inside effects
  const [isInstalled, setIsInstalled] = useState(detectIsInstalled);
  const [isIOS]                       = useState(detectIsIOS);`;

const replacementHooks = `export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner]         = useState(false);
  const [debugPWA, setDebugPWA]             = useState(false);

  // All detection via lazy initializers — no setState inside effects
  const [isInstalled, setIsInstalled] = useState(detectIsInstalled);
  const [isIOS]                       = useState(detectIsIOS);

  // ── Debug mode check ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDebug = window.location.search.includes('debug_pwa=true');
      setDebugPWA(isDebug);
      if (isDebug) {
        setShowBanner(true);
      }
    }
  }, []);`;

// Target iOS effect
const targetIOSEffect = `  // ── iOS banner: show after 3 s if not dismissed ───────────────────────────
  useEffect(() => {
    if (!isIOS || isInstalled) return;
    const wasDismissed = localStorage.getItem('pwa_ios_dismissed');
    if (wasDismissed) return;
    const t = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(t);
  }, [isIOS, isInstalled]);`;

const replacementIOSEffect = `  // ── iOS banner: show after 3 s if not dismissed ───────────────────────────
  useEffect(() => {
    if (debugPWA) return;
    if (!isIOS || isInstalled) return;
    const wasDismissed = localStorage.getItem('pwa_ios_dismissed');
    if (wasDismissed) return;
    const t = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(t);
  }, [isIOS, isInstalled, debugPWA]);`;

// Target Android effect
const targetAndroidEffect = `  // ── Android/Chrome: capture install prompt ────────────────────────────────
  useEffect(() => {
    if (isIOS || isInstalled) return;
    const wasDismissed = localStorage.getItem('pwa_banner_dismissed');
    if (wasDismissed) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 3000);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [isIOS, isInstalled]);`;

const replacementAndroidEffect = `  // ── Android/Chrome: capture install prompt ────────────────────────────────
  useEffect(() => {
    if (debugPWA) return;
    if (isIOS || isInstalled) return;
    const wasDismissed = localStorage.getItem('pwa_banner_dismissed');
    if (wasDismissed) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 3000);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [isIOS, isInstalled, debugPWA]);`;

// Target handleInstall
const targetHandleInstall = `  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };`;

const replacementHandleInstall = `  const handleInstall = async () => {
    if (debugPWA && !deferredPrompt) {
      alert("Preview Mode: In a live environment, this button will trigger your device's native browser PWA installation dialog.");
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };`;

// Target handleDismiss
const targetHandleDismiss = `  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(isIOS ? 'pwa_ios_dismissed' : 'pwa_banner_dismissed', '1');
  };`;

const replacementHandleDismiss = `  const handleDismiss = () => {
    setShowBanner(false);
    if (!debugPWA) {
      localStorage.setItem(isIOS ? 'pwa_ios_dismissed' : 'pwa_banner_dismissed', '1');
    }
  };`;

// Target render check
const targetRenderCheck = `  if (isInstalled || !showBanner) return null;`;

const replacementRenderCheck = `  if (!debugPWA && (isInstalled || !showBanner)) return null;
  if (debugPWA && !showBanner) return null;`;


const replacements = [
  [targetHooks, replacementHooks],
  [targetIOSEffect, replacementIOSEffect],
  [targetAndroidEffect, replacementAndroidEffect],
  [targetHandleInstall, replacementHandleInstall],
  [targetHandleDismiss, replacementHandleDismiss],
  [targetRenderCheck, replacementRenderCheck]
];

let replacedCount = 0;
replacements.forEach(([target, replacement]) => {
  const normTarget = hasCRLF ? target.replace(/\n/g, '\r\n') : target;
  const normReplacement = hasCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;
  if (content.includes(normTarget)) {
    content = content.replace(normTarget, normReplacement);
    replacedCount++;
  } else {
    console.error(`Target not found: ${target.substring(0, 80)}...`);
  }
});

if (replacedCount === replacements.length) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully added PWA debug features!');
} else {
  console.error(`Only replaced ${replacedCount}/${replacements.length} segments!`);
}
