import { Sandbox } from '@lifo-sh/core';

let sandboxInstance = null;
let currentProjectId = null;
let bootPromise = null;
const installedPackagesCache = new Map();

const KNOWN_NATIVE_PACKAGES = [
  '@next/swc', 'next', 'esbuild', 'node-gyp', 'sharp',
  'sqlite3', 'canvas', 'bcrypt', 'fsevents', 'puppeteer',
  're2', 'bufferutil', 'utf-8-validate'
];

/**
 * Lazy-initialize Lifo Sandbox.
 * Only boots when first called (when Run is clicked).
 * Reuses the same instance across runs.
 */
export const getLifoSandbox = async (projectId = null) => {
  if (projectId && currentProjectId && currentProjectId !== projectId) {
    await destroyLifoSandbox();
  }
  if (sandboxInstance) return sandboxInstance;
  if (bootPromise) return bootPromise;

  currentProjectId = projectId;
  bootPromise = (async () => {
    try {
      sandboxInstance = await Sandbox.create({ cwd: '/app', persist: false });
    } catch (e) {
      sandboxInstance = null;
      bootPromise = null;
      throw new Error(`Lifo.sh sandbox failed to initialize: ${e.message || e}`);
    }
    try { await sandboxInstance.fs.mkdir('/app', { recursive: true }); } catch (_) {}
    bootPromise = null;
    return sandboxInstance;
  })();
  return bootPromise;
};

/** Destroy active sandbox and free all resources. */
export const destroyLifoSandbox = async () => {
  bootPromise = null;
  if (sandboxInstance) {
    try { sandboxInstance.destroy(); } catch (_) {}
    sandboxInstance = null;
    currentProjectId = null;
  }
};

/** Flatten editor file tree → flat array of { path, content }. */
export const flattenFileTree = (tree, currentPath = '') => {
  const result = [];
  if (!tree || typeof tree !== 'object') return result;
  for (const key of Object.keys(tree)) {
    const item = tree[key];
    const itemPath = currentPath ? `${currentPath}/${key}` : key;
    if (!item) continue;
    if (item.file) {
      result.push({ path: itemPath, content: item.file.contents ?? '' });
    } else if (item.directory) {
      result.push(...flattenFileTree(item.directory, itemPath));
    } else if (typeof item === 'object') {
      if (item.contents !== undefined) {
        result.push({ path: itemPath, content: item.contents });
      } else {
        result.push(...flattenFileTree(item, itemPath));
      }
    }
  }
  return result;
};

/** Write all files into sandbox VFS using batch API. */
const syncFilesToSandbox = async (sandbox, fileTree) => {
  const files = flattenFileTree(fileTree);
  if (files.length === 0) return;
  const dirs = new Set();
  const entries = [];
  for (const file of files) {
    const fullPath = `/app/${file.path}`;
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    if (dir && dir !== '/app') dirs.add(dir);
    entries.push({ path: fullPath, content: file.content });
  }
  for (const dir of [...dirs].sort((a, b) => a.split('/').length - b.split('/').length)) {
    await sandbox.fs.mkdir(dir, { recursive: true }).catch(() => {});
  }
  try {
    await sandbox.fs.writeFiles(entries);
  } catch (_) {
    for (const e of entries) await sandbox.fs.writeFile(e.path, e.content);
  }
};

/** Detect project type. */
export const detectProjectType = (fileTree) => {
  const files = flattenFileTree(fileTree);
  const paths = files.map(f => f.path);
  const pkgFile = files.find(f => f.path === 'package.json');
  let pkg = null;
  if (pkgFile) { try { pkg = JSON.parse(pkgFile.content); } catch (_) {} }
  const allDeps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };

  const native = Object.keys(allDeps).filter(d => KNOWN_NATIVE_PACKAGES.some(p => d === p || d.startsWith(p + '/')));
  if (allDeps['next'] && !native.includes('next')) native.push('next');
  if (native.length > 0) return { type: 'unsupported_native', nativeDeps: native, pkg };
  if (paths.some(p => p.startsWith('pages/') || p.includes('next.config.')))
    return { type: 'unsupported_native', nativeDeps: ['Next.js (requires @next/swc)'], pkg };

  if (allDeps['vite'] || allDeps['react'] || paths.some(p => p.endsWith('.jsx') || p.endsWith('.tsx') || p.includes('vite.config')))
    return { type: 'react_vite', pkg };
  if (allDeps['express'] || paths.some(p => p === 'server.js' || p === 'app.js'))
    return { type: 'express', pkg };
  if (paths.some(p => p === 'index.html' || p.endsWith('.html')))
    return { type: 'static_html', pkg };
  if (paths.some(p => p === 'index.js' || p.endsWith('.js') || p.endsWith('.ts')))
    return { type: 'plain_js', pkg };
  return { type: 'empty', pkg };
};

/** Main execution pipeline — called on Run click. */
export const runLifoProject = async ({ sandbox, fileTree, onStatusChange, onLog }) => {
  const info = detectProjectType(fileTree);

  // ── Unsupported ──
  if (info.type === 'unsupported_native') {
    onStatusChange?.('Failed');
    onLog?.(
      `\n⚠️  UNSUPPORTED PROJECT\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Native binary dependencies detected:\n  → ${info.nativeDeps.join(', ')}\n\n` +
      `Lifo.sh is a browser-native runtime. Native C/C++ binaries\ncannot execute in the browser. Execution aborted.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    );
    return { success: false, previewUrl: null, reason: 'unsupported_native' };
  }
  if (info.type === 'empty') {
    onStatusChange?.('Failed');
    onLog?.('No runnable files found in the project.\n');
    return { success: false, previewUrl: null, reason: 'empty' };
  }

  // ── Sync files ──
  onStatusChange?.('Initializing');
  onLog?.('Writing project files to Lifo virtual filesystem…\n');
  try {
    await syncFilesToSandbox(sandbox, fileTree);
    onLog?.(`✓ ${flattenFileTree(fileTree).length} files synced.\n`);
  } catch (err) {
    onStatusChange?.('Failed');
    onLog?.(`Failed to write files: ${err.message}\n`);
    return { success: false, previewUrl: null, reason: 'vfs_error' };
  }

  const files = flattenFileTree(fileTree);
  const pkgFile = files.find(f => f.path === 'package.json');

  // ── Install dependencies ──
  if (pkgFile) {
    const content = pkgFile.content;
    const hash = content.length + '_' + simpleHash(content);
    if (!installedPackagesCache.has(hash)) {
      onStatusChange?.('Installing Dependencies');
      onLog?.('Running npm install…\n');
      try {
        const res = await sandbox.commands.run('npm install', {
          cwd: '/app', timeout: 120000,
          onStdout: d => onLog?.(d), onStderr: d => onLog?.(d),
        });
        if (res.exitCode === 0) {
          installedPackagesCache.set(hash, true);
          onLog?.('✓ Dependencies installed.\n');
        } else {
          onLog?.(`⚠ npm install exited with code ${res.exitCode}\n`);
        }
      } catch (err) {
        onLog?.(`npm install error: ${err.message || err}\n`);
      }
    } else {
      onLog?.('✓ Using cached dependencies.\n');
    }
  }

  // ── Start application ──
  onStatusChange?.('Starting Application');
  let previewUrl = null;

  try {
    if (info.type === 'static_html') {
      previewUrl = buildStaticPreview(files);
      onLog?.('✓ Static HTML loaded.\n');

    } else if (info.type === 'react_vite') {
      onLog?.('Starting Vite dev server…\n');
      const devCmd = info.pkg?.scripts?.dev ? 'npm run dev -- --host 0.0.0.0' : 'npx vite --host 0.0.0.0';
      sandbox.commands.run(devCmd, {
        cwd: '/app',
        onStdout: d => onLog?.(d), onStderr: d => onLog?.(d),
      }).catch(e => onLog?.(`Dev server ended: ${e.message || e}\n`));

      const port = 5173;
      try {
        await sandbox.waitForPort(port, { timeout: 45000 });
        onLog?.(`✓ Vite dev server on port ${port}.\n`);
        previewUrl = await fetchFullPage(sandbox, port, files);
        onLog?.('✓ Preview rendered.\n');
      } catch (e) {
        onLog?.(`Port wait failed: ${e.message}. Using static fallback.\n`);
        previewUrl = buildStaticPreview(files);
      }

    } else if (info.type === 'express') {
      const startCmd = info.pkg?.scripts?.start || 'node index.js';
      onLog?.(`Running: ${startCmd}\n`);
      sandbox.commands.run(startCmd, {
        cwd: '/app',
        onStdout: d => onLog?.(d), onStderr: d => onLog?.(d),
      }).catch(e => onLog?.(`Server ended: ${e.message || e}\n`));

      const port = detectPort(info.pkg) || 3000;
      try {
        await sandbox.waitForPort(port, { timeout: 15000 });
        onLog?.(`✓ Server listening on port ${port}.\n`);
        previewUrl = await fetchAndRenderExpressResponse(sandbox, port);
      } catch (_) {
        onLog?.('Server port not detected. Check terminal.\n');
        previewUrl = blobUrl(buildServerStatusPage(startCmd, port));
      }

    } else if (info.type === 'plain_js') {
      const cmd = info.pkg?.scripts?.start || 'node index.js';
      onLog?.(`Running: ${cmd}\n`);
      try {
        const res = await sandbox.commands.run(cmd, {
          cwd: '/app', timeout: 15000,
          onStdout: d => onLog?.(d), onStderr: d => onLog?.(d),
        });
        onLog?.(`\nExited with code ${res.exitCode}\n`);
      } catch (e) {
        onLog?.(`${e.message || e}\n`);
      }
      previewUrl = blobUrl(buildNodeOutputPage());
    }
  } catch (err) {
    onLog?.(`Startup error: ${err.message}\n`);
  }

  if (previewUrl) {
    onStatusChange?.('Running');
    
    const previews = [];
    if (info.type === 'express') {
      previews.push({ name: 'Express Server API', url: previewUrl });
    } else if (info.type === 'react_vite') {
      previews.push({ name: 'Vite Server App', url: previewUrl });
    } else if (info.type === 'static_html') {
      previews.push({ name: 'Web Application', url: previewUrl });
    } else {
      previews.push({ name: 'Default App', url: previewUrl });
    }

    // Extract all HTML files and generate static previews
    const htmlFiles = files.filter(f => f.path.endsWith('.html'));
    for (const hf of htmlFiles) {
      try {
        const url = buildStaticPreviewForFile(hf, files);
        if (url && !previews.some(p => p.name === hf.path)) {
          previews.push({ name: hf.path, url });
        }
      } catch (_) {}
    }

    // Set first calculator/index.html or index.html as recommended preview if it exists
    const recommendedPreview = previews.find(p => p.name.includes('calculator/index.html')) || 
                                previews.find(p => p.name === 'index.html') || 
                                previews[0];

    return { 
      success: true, 
      previewUrl: recommendedPreview?.url || previewUrl, 
      projectType: info.type,
      previews
    };
  }
  onStatusChange?.('Failed');
  onLog?.('Could not generate preview.\n');
  return { success: false, previewUrl: null, reason: 'no_preview' };
};

function buildStaticPreviewForFile(htmlFile, files) {
  let html = htmlFile.content;
  // Inline CSS
  html = html.replace(/<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi, (m, href) => {
    const f = files.find(x => x.path === href || x.path === href.replace(/^\.\//, '') || x.path.endsWith('/' + href));
    return f ? `<style>/* ${href} */\n${f.content}</style>` : m;
  });
  // Inline JS
  html = html.replace(/<script\s+[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/gi, (m, src) => {
    const f = files.find(x => x.path === src || x.path === src.replace(/^\.\//, '') || x.path.endsWith('/' + src));
    return f ? `<script>/* ${src} */\n${f.content}<\/script>` : m;
  });
  return blobUrl(html);
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function detectPort(pkg) {
  const s = pkg?.scripts?.start || '';
  const m = s.match(/PORT[=\s]+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function blobUrl(html) {
  return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Build self-contained static HTML preview by inlining CSS/JS. */
function buildStaticPreview(files) {
  let htmlFile = files.find(f => f.path === 'index.html') || files.find(f => f.path.endsWith('.html'));
  if (!htmlFile) return null;
  let html = htmlFile.content;
  // Inline CSS
  html = html.replace(/<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi, (m, href) => {
    const f = files.find(x => x.path === href || x.path === href.replace(/^\.\//, '') || x.path.endsWith('/' + href));
    return f ? `<style>/* ${href} */\n${f.content}</style>` : m;
  });
  // Inline JS
  html = html.replace(/<script\s+[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/gi, (m, src) => {
    const f = files.find(x => x.path === src || x.path === src.replace(/^\.\//, '') || x.path.endsWith('/' + src));
    return f ? `<script>/* ${src} */\n${f.content}<\/script>` : m;
  });
  return blobUrl(html);
}

/**
 * Fetch the rendered page from an in-VM server and package it as a blob URL.
 * Also fetches CSS/JS assets referenced in the HTML to make a self-contained preview.
 */
async function fetchFullPage(sandbox, port, files) {
  try {
    const resp = await sandbox.fetch(`http://localhost:${port}/`, { timeout: 15000 });
    let html = await resp.text();
    // Try to inline any local CSS/JS from the file tree
    html = html.replace(/<link\s+[^>]*href=["']\/([^"']+\.css)["'][^>]*>/gi, (m, href) => {
      const f = files.find(x => x.path === href || x.path.endsWith('/' + href));
      return f ? `<style>/* ${href} */\n${f.content}</style>` : m;
    });
    html = html.replace(/<script\s+[^>]*src=["']\/([^"']+\.js)["'][^>]*><\/script>/gi, (m, src) => {
      const f = files.find(x => x.path === src || x.path.endsWith('/' + src));
      return f ? `<script>/* ${src} */\n${f.content}<\/script>` : m;
    });
    return blobUrl(html);
  } catch (e) {
    // Fallback to static file tree
    return buildStaticPreview(files);
  }
}

/** Fetch Express response and show it in a proper viewer. */
async function fetchAndRenderExpressResponse(sandbox, port) {
  try {
    const resp = await sandbox.fetch(`http://localhost:${port}/`, { timeout: 10000 });
    const ct = resp.headers.get('content-type') || '';
    const body = await resp.text();

    // If it's HTML, show it directly
    if (ct.includes('html')) return blobUrl(body);

    // Otherwise (JSON, text, etc.) show in styled API viewer
    let formatted = body;
    try { formatted = JSON.stringify(JSON.parse(body), null, 2); } catch (_) {}

    return blobUrl(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>API Response</title></head>
<body style="margin:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#0c0e14;color:#e2e8f0;min-height:100vh;display:flex;flex-direction:column">
  <header style="padding:12px 20px;background:linear-gradient(135deg,#1a1f35,#0f172a);border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:10px">
    <div style="width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,0.5)"></div>
    <span style="font-weight:700;font-size:12px;letter-spacing:1px;color:#94a3b8;text-transform:uppercase">Express Server · Port ${port}</span>
    <span style="margin-left:auto;font-size:12px;padding:3px 10px;border-radius:4px;background:#1e293b;color:#64748b;border:1px solid #334155">GET /</span>
    <span style="font-size:12px;padding:3px 10px;border-radius:4px;background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.2)">${resp.status} OK</span>
  </header>
  <main style="flex:1;padding:20px;overflow:auto">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#475569;margin-bottom:10px;font-weight:600">Response Body</div>
    <pre style="background:#111827;border:1px solid #1e293b;border-radius:10px;padding:20px;margin:0;overflow:auto;font-size:13px;line-height:1.7;color:#7dd3fc;font-family:'Cascadia Code','Fira Code',monospace"><code>${esc(formatted)}</code></pre>
  </main>
  <footer style="padding:10px 20px;border-top:1px solid #1e293b;text-align:center">
    <span style="font-size:11px;color:#334155">Served by Lifo.sh Sandbox Runtime</span>
  </footer>
</body>
</html>`);
  } catch (e) {
    return blobUrl(buildServerStatusPage('express', port));
  }
}

function buildServerStatusPage(cmd, port) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Server Running</title></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#0c0e14;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh">
  <div style="text-align:center;padding:32px">
    <div style="font-size:48px;margin-bottom:16px">🚀</div>
    <h2 style="margin:0 0 8px;color:#f8fafc">Server Running</h2>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 16px">Process started inside Lifo.sh sandbox</p>
    <code style="background:#1e293b;border:1px solid #334155;border-radius:6px;padding:8px 16px;font-size:13px;color:#7dd3fc">${esc(cmd)}</code>
    <p style="color:#475569;font-size:12px;margin-top:12px">Port ${port} · Check terminal for output</p>
  </div>
</body></html>`;
}

function buildNodeOutputPage() {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Script Completed</title></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#0c0e14;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh">
  <div style="text-align:center;padding:32px">
    <div style="font-size:48px;margin-bottom:16px">✅</div>
    <h2 style="margin:0 0 8px;color:#f8fafc">Script Completed</h2>
    <p style="color:#94a3b8;font-size:14px;margin:0">See terminal output above for results.</p>
  </div>
</body></html>`;
}
