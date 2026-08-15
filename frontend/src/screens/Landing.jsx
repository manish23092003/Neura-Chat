import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'
import NeuraLogo from '../components/ui/NeuraLogo'
import RobotSkeleton from '../components/RobotSkeleton'

// ============================================================================
// VERCEL / LINEAR STYLE LANDING PAGE
// ============================================================================

const Landing = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const features = [
    {
      icon: 'ri-command-line',
      title: 'Keyboard First',
      description: 'Navigate entirely with keyboard shortcuts. Command menu gives you instant access to every feature.'
    },
    {
      icon: 'ri-thunderstorms-line',
      title: 'Instant Synchronization',
      description: 'Real-time collaborative editing. Your team sees your changes with zero latency.'
    },
    {
      icon: 'ri-terminal-box-line',
      title: 'Built-in Terminal',
      description: 'Execute code instantly within the browser using secure WebContainers. No local setup required.'
    },
    {
      icon: 'ri-message-3-line',
      title: 'Contextual Chat',
      description: 'AI understands your entire codebase. Ask questions, generate tests, and refactor instantly.'
    },
    {
      icon: 'ri-git-branch-line',
      title: 'Branch & Ship',
      description: 'Seamless integration with your existing Git workflows. Deploy directly from your workspace.'
    },
    {
      icon: 'ri-shield-keyhole-line',
      title: 'Enterprise Security',
      description: 'SOC2 compliant infrastructure. Role-based access control and strict data isolation.'
    }
  ]

  const faqs = [
    {
      q: 'Do I need to install anything locally?',
      a: 'No. NeuraChat runs entirely in your browser using secure WebContainers, providing a full Node.js environment without any local setup.'
    },
    {
      q: 'How does the AI understand my code?',
      a: 'Our AI context engine indexes your workspace in real-time, allowing it to provide relevant, context-aware suggestions and refactoring.'
    },
    {
      q: 'Can I invite my team?',
      a: 'Yes. NeuraChat is built for collaboration. You can invite unlimited team members to your workspace with precise access controls.'
    }
  ]

  return (
    <div className="min-h-screen font-sans bg-[var(--nc-bg)] text-[var(--nc-text-primary)] selection:bg-[var(--nc-primary-border)]">
      
      {/* ─── NAVIGATION ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b ${
          scrolled ? 'bg-[var(--nc-surface)]/90 backdrop-blur-md border-[var(--nc-border)] shadow-sm' : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" aria-label="NeuraChat Home">
            <NeuraLogo size={32} showText animated />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-[500] text-[var(--nc-text-secondary)]">
            <a href="#features" className="hover:text-[var(--nc-text-primary)] transition-colors duration-150">Features</a>
            <a href="#dx" className="hover:text-[var(--nc-text-primary)] transition-colors duration-150">Developers</a>
            <a href="#faq" className="hover:text-[var(--nc-text-primary)] transition-colors duration-150">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-[14px] font-[600] text-[var(--nc-text-secondary)] hover:text-[var(--nc-text-primary)] transition-colors duration-150">
              Log in
            </Link>
            <Link to="/register">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>

          <button className="md:hidden p-2 text-[20px]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <i className={`ri-${mobileMenuOpen ? 'close' : 'menu'}-line`} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 z-40 bg-[var(--nc-surface)] pt-20 px-6 flex flex-col gap-6"
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-[500]">Features</a>
            <a href="#dx" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-[500]">Developers</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-[500]">FAQ</a>
            <div className="h-px bg-[var(--nc-border)] w-full my-4" />
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-[500]">Log in</Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button fullWidth size="lg">Sign Up</Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative pt-32 pb-24 flex flex-col items-center">
        
        {/* ─── HERO SECTION ─── */}
        <section className="w-full max-w-[1280px] px-6 text-center pt-10 pb-16">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-[48px] md:text-[72px] font-[800] leading-[1.05] tracking-[-0.04em] mb-6"
          >
            The developer platform <br className="hidden md:block" /> for the AI era.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut', delay: 0.05 }}
            className="text-[18px] md:text-[20px] max-w-[600px] mx-auto text-[var(--nc-text-secondary)] mb-10 leading-[1.6]"
          >
            NeuraChat combines an intelligent AI assistant, real-time collaboration, and instant environments into one seamless workspace.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }}
            className="flex items-center justify-center gap-4"
          >
            <Link to="/register">
              <Button size="lg" className="h-[48px] px-8 text-[15px]">Start Building</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg" className="h-[48px] px-8 text-[15px]">View Demo</Button>
            </Link>
          </motion.div>
        </section>

        {/* ─── PRODUCT WORKSPACE DEMO (MATTE BLACK THEME) ─── */}
        <section className="w-full max-w-[1280px] px-3 md:px-6 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
            className="w-full rounded-[14px] border border-[#27272a] bg-[#09090b] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col text-left font-sans select-none"
            style={{
              boxShadow: '0 25px 80px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)'
            }}
          >
            {/* ═══ Top Project Header Bar ═══ */}
            <div className="h-10 px-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="text-[#71717a] hover:text-white transition-colors"><i className="ri-arrow-left-line text-[14px]" /></button>
                <div className="flex items-center gap-1.5 font-semibold text-[13px] text-[#f4f4f5]">
                  <i className="ri-folder-3-fill text-[#3b82f6] text-[15px]" />
                  <span>demo-workspace</span>
                </div>
              </div>

              {/* Right: Collaborators & Join Button */}
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-[9px] font-bold text-white flex items-center justify-center border border-[#121215]">A</div>
                  <div className="w-5 h-5 rounded-full bg-[#10b981] text-[9px] font-bold text-white flex items-center justify-center border border-[#121215]">B</div>
                  <div className="w-5 h-5 rounded-full bg-[#6366f1] text-[9px] font-bold text-white flex items-center justify-center border border-[#121215]">C</div>
                </div>
                <span className="text-[11px] text-[#a1a1aa] hidden sm:inline-block">Realtime Collaboration</span>
                <Link to="/login">
                  <button className="px-2.5 py-1 rounded-[6px] bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all cursor-pointer">
                    <i className="ri-user-add-line text-[12px]" />
                    <span>Join Workspace</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* ═══ Main 3-Pane Body ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] bg-[#09090b] divide-y lg:divide-y-0 lg:divide-x divide-[#27272a]">
              
              {/* ── Left Pane: Chat & Tasks (Locked Preview Before Login) ── */}
              <div className="lg:col-span-3 flex flex-col justify-between bg-[#0f0f12] h-full border-b lg:border-b-0 border-[#27272a]">
                {/* Chat/Tasks Tabs */}
                <div className="h-10 border-b border-[#27272a] px-3 flex items-center justify-between text-[12px] font-medium bg-[#141418]">
                  <div className="flex items-center gap-4 h-full">
                    <div className="flex items-center gap-1.5 text-white border-b-2 border-[#3b82f6] h-full px-1">
                      <i className="ri-message-3-line text-[13px]" />
                      <span>Chat</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#71717a] hover:text-white cursor-pointer h-full px-1">
                      <i className="ri-task-line text-[13px]" />
                      <span>Tasks</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#27272a] text-[#a1a1aa] font-mono flex items-center gap-1">
                    <i className="ri-lock-line text-[10px]" /> Preview
                  </span>
                </div>

                {/* Locked / Clean Reference State */}
                <div className="p-6 flex-1 flex flex-col items-center justify-center text-center font-sans">
                  <div className="w-12 h-12 rounded-[12px] bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#3b82f6] mb-3 shadow-inner">
                    <i className="ri-lock-2-line text-[22px]" />
                  </div>
                  <div className="text-[13px] font-semibold text-[#f4f4f5] mb-1">Interactive Chat Locked</div>
                  <p className="text-[11px] text-[#71717a] max-w-[210px] leading-relaxed mb-4">
                    Sign in to chat with NeuraChat AI, generate fullstack code, and collaborate in real time.
                  </p>
                  <Link to="/login">
                    <button className="px-3.5 py-1.5 rounded-[6px] bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[11.5px] font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
                      <i className="ri-login-box-line text-[12px]" />
                      <span>Sign In to Unlock</span>
                    </button>
                  </Link>
                </div>

                {/* Locked Composer */}
                <div className="p-2.5 border-t border-[#27272a] bg-[#121215]">
                  <div className="w-full h-9 rounded-[8px] border border-[#27272a] bg-[#09090b] flex items-center px-2.5 gap-2 opacity-60">
                    <i className="ri-lock-line text-[#71717a] text-[13px]" />
                    <span className="text-[11px] text-[#71717a] flex-1 truncate">Sign in to send prompts...</span>
                    <div className="w-6 h-6 rounded-[5px] bg-[#27272a] text-[#71717a] flex items-center justify-center">
                      <i className="ri-send-plane-fill text-[11px]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Center Pane: Explorer + Editor + Console (col-span-6) ── */}
              <div className="lg:col-span-6 flex flex-col bg-[#09090b] divide-y divide-[#27272a]">
                
                {/* Upper Area: Explorer (Left) + Editor Ready (Right) */}
                <div className="grid grid-cols-12 flex-1 min-h-[380px] divide-x divide-[#27272a]">
                  {/* Sub-Explorer (4 cols) */}
                  <div className="col-span-4 p-3 flex flex-col justify-between bg-[#0f0f12]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11.5px] text-[#f4f4f5] font-semibold">
                        <div className="flex items-center gap-1.5">
                          <i className="ri-layout-grid-line text-[#38bdf8]" />
                          <span>Main Workspace</span>
                          <i className="ri-arrow-down-s-line text-[11px]" />
                        </div>
                        <i className="ri-cloud-line text-[#71717a]" />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-bold text-[#71717a] tracking-wider pt-1">
                        <span>FILES EXPLORER</span>
                        <button className="text-[#3b82f6] hover:text-white flex items-center gap-0.5 font-medium">+ New File</button>
                      </div>

                      <div className="w-full h-7 rounded-[6px] bg-[#18181b] border border-[#27272a] px-2 flex items-center gap-1.5 text-[10.5px] text-[#71717a]">
                        <i className="ri-search-line text-[11px]" />
                        <span>Search files...</span>
                      </div>
                    </div>

                    <div className="my-auto py-10 flex flex-col items-center justify-center text-center">
                      <i className="ri-file-text-line text-[#27272a] text-[28px] mb-1.5" />
                      <span className="text-[11px] text-[#71717a]">No files in workspace</span>
                    </div>
                  </div>

                  {/* Sub-Editor Empty State (8 cols) */}
                  <div className="col-span-8 flex flex-col bg-[#09090b] justify-between">
                    {/* Tab Header */}
                    <div className="h-8 border-b border-[#27272a] px-3 flex items-center justify-between text-[11px] text-[#71717a] bg-[#121215]">
                      <span>No files open</span>
                      <i className="ri-split-cells-horizontal text-[13px] hover:text-white cursor-pointer" />
                    </div>

                    {/* Editor Ready Empty State */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-10 h-10 rounded-[10px] bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#f4f4f5] mb-3 shadow-inner">
                        <i className="ri-terminal-box-line text-[20px]" />
                      </div>
                      <div className="text-[13.5px] font-bold text-[#f4f4f5] tracking-tight mb-1">Editor Ready</div>
                      <div className="text-[11px] text-[#71717a] max-w-[220px]">Select a file from the explorer to start editing</div>
                    </div>
                  </div>
                </div>

                {/* Lower Area: Console Terminal */}
                <div className="h-[180px] flex flex-col bg-[#09090b] font-mono text-[10.5px]">
                  {/* Console Header Tabs & Actions */}
                  <div className="h-8 border-b border-[#27272a] px-3 flex items-center justify-between bg-[#121215] select-none">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#71717a]" />
                      <span className="font-semibold text-[#f4f4f5] text-[11px]">CONSOLE</span>
                      <i className="ri-arrow-down-s-line text-[#71717a] text-[10px]" />
                      <span className="px-1.5 py-0.5 rounded bg-[#18181b] text-[#a1a1aa] text-[9.5px]">0 lines</span>
                      <div className="flex items-center gap-1 ml-2 text-[10px] text-[#71717a]">
                        <span className="px-1.5 py-0.5 rounded bg-[#27272a] text-white font-semibold">All</span>
                        <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Errors</span>
                        <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Warnings</span>
                        <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Info</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-[#71717a] text-[12px]">
                      <i className="ri-search-line hover:text-white cursor-pointer" />
                      <i className="ri-time-line hover:text-white cursor-pointer" />
                      <i className="ri-arrow-down-line hover:text-white cursor-pointer" />
                      <i className="ri-text-wrap hover:text-white cursor-pointer" />
                      <i className="ri-download-2-line hover:text-white cursor-pointer" />
                      <i className="ri-file-copy-line hover:text-white cursor-pointer" />
                      <i className="ri-delete-bin-line hover:text-white cursor-pointer" />
                      <i className="ri-fullscreen-line hover:text-white cursor-pointer" />
                    </div>
                  </div>

                  {/* Console Body */}
                  <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <i className="ri-terminal-line text-[#27272a] text-[20px] mb-1" />
                    <div className="text-[11px] font-semibold text-[#71717a]">No output yet</div>
                    <div className="text-[10px] text-[#52525b]">Run your project to see runtime logs here.</div>
                  </div>
                </div>

              </div>

              {/* ── Right Pane: Live Preview (col-span-3) ── */}
              <div className="lg:col-span-3 flex flex-col items-center justify-center p-6 text-center bg-[#09090b] h-full overflow-hidden">
                <div className="mb-2 shrink-0">
                  <RobotSkeleton
                    state="idle"
                    showBubble={false}
                    scale={0.65}
                  />
                </div>

                <div className="max-w-xs flex flex-col items-center gap-1 mb-5 shrink-0">
                  <h3 className="text-[14px] font-semibold text-[#f4f4f5] tracking-tight">
                    Preview is not running
                  </h3>
                  <p className="text-[11px] text-[#71717a] leading-relaxed max-w-[220px]">
                    Run your project to see the live result here.
                  </p>
                </div>

                <button className="px-4 py-2 rounded-[7px] text-[11.5px] font-semibold flex items-center gap-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-md cursor-pointer transition-all">
                  <i className="ri-play-fill text-[13px]" />
                  <span>Run Project</span>
                </button>
              </div>

            </div>

            {/* ═══ Bottom IDE Status Bar ═══ */}
            <div className="h-6 border-t border-[#27272a] px-3 bg-[#121215] flex items-center justify-between text-[10px] text-[#71717a] font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[#d4d4d8]"><i className="ri-layout-grid-line text-[#38bdf8]" /> Main Workspace</span>
                <span className="flex items-center gap-1 text-[#eab308]"><span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" /> Sandbox Idle</span>
                <span className="hidden sm:inline-block"><i className="ri-command-line" /> Cmd + Shift + P</span>
              </div>
              <div className="flex items-center gap-3">
                <span>42 MB</span>
                <span>Spaces: 4</span>
                <span>UTF-8</span>
                <span className="text-[#38bdf8]">&lt;&gt; JavaScript</span>
                <span className="flex items-center gap-1"><i className="ri-layout-right-line" /> Right Dock</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ─── FEATURES GRID ─── */}
        <section id="features" className="w-full max-w-[1280px] px-6 mb-32">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-[32px] font-[700] tracking-tight mb-4">Everything you need to ship.</h2>
            <p className="text-[18px] text-[var(--nc-text-secondary)]">A complete, integrated environment optimized for speed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="p-6 rounded-[16px] border border-[var(--nc-border)] bg-[var(--nc-surface)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-200">
                <i className={`${feature.icon} text-[24px] mb-4 block`} />
                <h3 className="text-[16px] font-[600] mb-2">{feature.title}</h3>
                <p className="text-[14px] text-[var(--nc-text-secondary)] leading-[1.6]">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── DEVELOPER EXPERIENCE ─── */}
        <section id="dx" className="w-full bg-[var(--nc-surface)] border-y border-[var(--nc-border)] py-24 mb-32">
          <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-[32px] font-[700] tracking-tight mb-6">Built for developers,<br/>by developers.</h2>
              <p className="text-[16px] text-[var(--nc-text-secondary)] leading-[1.6] mb-6">
                NeuraChat removes the friction of local environments. With instant WebContainers, you get a full Node.js ecosystem directly in the browser. Install dependencies, run servers, and execute scripts safely and instantly.
              </p>
              <ul className="flex flex-col gap-4">
                {['Instant server starts (0ms cold boot)', 'Full terminal access', 'Real-time collaborative editing'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] font-[500]">
                    <i className="ri-check-line text-[var(--nc-text-secondary)] text-[18px]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[16px] border border-[var(--nc-border)] bg-[var(--nc-bg)] p-8 font-mono text-[13px] leading-[1.6] text-[var(--nc-text-secondary)] overflow-hidden">
              <span className="text-[var(--nc-accent)]">$</span> npm create vite@latest my-app<br/>
              Scaffolding project in ./my-app...<br/>
              Done. Now run:<br/><br/>
              <span className="text-[var(--nc-accent)]">$</span> cd my-app<br/>
              <span className="text-[var(--nc-accent)]">$</span> npm install<br/>
              <span className="text-[var(--nc-accent)]">$</span> npm run dev<br/><br/>
              <span className="text-[#16A34A]">VITE v4.0.0</span>  ready in 120 ms
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="w-full max-w-[800px] mx-auto px-6 mb-32">
          <h2 className="text-[32px] font-[700] tracking-tight mb-10 text-center">Frequently Asked Questions</h2>
          <div className="flex flex-col divide-y divide-[var(--nc-border)] border-y border-[var(--nc-border)]">
            {faqs.map((faq, i) => (
              <div key={i} className="py-6">
                <h3 className="text-[16px] font-[600] mb-2">{faq.q}</h3>
                <p className="text-[15px] text-[var(--nc-text-secondary)] leading-[1.6]">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="w-full max-w-[1280px] px-6 text-center mb-32">
          <div className="rounded-[24px] bg-[var(--nc-surface)] border border-[var(--nc-border)] py-20 px-6 flex flex-col items-center shadow-sm">
            <h2 className="text-[36px] font-[700] tracking-tight mb-6">Start building today.</h2>
            <p className="text-[18px] text-[var(--nc-text-secondary)] mb-10 max-w-[500px]">
              Join the developers who are shipping faster with NeuraChat's collaborative AI workspace.
            </p>
            <Link to="/register">
              <Button size="lg" className="h-[48px] px-8 text-[15px]">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[var(--nc-border)] bg-[var(--nc-surface)] py-12">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-[var(--nc-text-secondary)]">
          <div className="flex items-center gap-2">
            <NeuraLogo size={20} />
            <span className="font-[600]">NeuraChat © 2026</span>
          </div>
          <div className="flex gap-6 font-[500]">
            <a href="#" className="hover:text-[var(--nc-text-primary)] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[var(--nc-text-primary)] transition-colors">GitHub</a>
            <a href="#" className="hover:text-[var(--nc-text-primary)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[var(--nc-text-primary)] transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
