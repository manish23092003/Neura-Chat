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

        {/* ─── PRODUCT WORKSPACE DEMO ─── */}
        <section className="w-full max-w-[1280px] px-3 md:px-6 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
            className="w-full rounded-[14px] border border-[#2B1B48] bg-[#0A0A0E] shadow-[0_30px_90px_-15px_rgba(124,58,237,0.22)] overflow-hidden flex flex-col text-left font-sans select-none"
            style={{
              boxShadow: '0 20px 80px -10px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.15)'
            }}
          >
            {/* ═══ Top Project Header Bar ═══ */}
            <div className="h-10 px-4 border-b border-[#1E1B2E] bg-[#0E0B1A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="text-[#8E8A9F] hover:text-white transition-colors"><i className="ri-arrow-left-line text-[14px]" /></button>
                <div className="flex items-center gap-1.5 font-semibold text-[13px] text-[#F3F1FA]">
                  <i className="ri-folder-3-fill text-[#3B82F6] text-[15px]" />
                  <span>first</span>
                </div>
              </div>

              {/* Right: Collaborators & Invite Button */}
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#06B6D4] text-[9px] font-bold text-[#0A0A0E] flex items-center justify-center border border-[#0E0B1A]">M</div>
                  <div className="w-5 h-5 rounded-full bg-[#3B82F6] text-[9px] font-bold text-white flex items-center justify-center border border-[#0E0B1A]">M</div>
                  <div className="w-5 h-5 rounded-full bg-[#0EA5E9] text-[9px] font-bold text-white flex items-center justify-center border border-[#0E0B1A]">M</div>
                </div>
                <span className="text-[11px] text-[#8E8A9F] hidden sm:inline-block">3 Collaborators</span>
                <button className="px-2.5 py-1 rounded-[6px] bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all">
                  <i className="ri-user-add-line text-[12px]" />
                  <span>Invite</span>
                </button>
              </div>
            </div>

            {/* ═══ Main 3-Pane Body ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] bg-[#09080F] divide-y lg:divide-y-0 lg:divide-x divide-[#1E1B2E]">
              
              {/* ── Left Pane: Chat & Tasks (col-span-3) ── */}
              <div className="lg:col-span-3 flex flex-col justify-between bg-[#0B0914] h-full border-b lg:border-b-0 border-[#1E1B2E]">
                {/* Chat/Tasks Tabs */}
                <div className="h-10 border-b border-[#1E1B2E] px-3 flex items-center gap-4 text-[12px] font-medium bg-[#0E0B1A]">
                  <div className="flex items-center gap-1.5 text-white border-b-2 border-[#7C3AED] h-full px-1">
                    <i className="ri-message-3-line text-[13px]" />
                    <span>Chat</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#827D95] hover:text-white cursor-pointer h-full px-1">
                    <i className="ri-task-line text-[13px]" />
                    <span>Tasks</span>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="p-3 space-y-3 flex-1 overflow-hidden font-sans text-[11.5px]">
                  {/* User Message 1 */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-4 h-4 rounded-full bg-[#EF4444] text-[8px] font-bold text-white flex items-center justify-center">M</div>
                      <span className="text-[10px] text-[#868199] truncate">manish.soni232003@gmail.com</span>
                    </div>
                    <div className="px-3 py-2 rounded-[10px] bg-[#1A1629] border border-[#2B2440] text-[#EDEAF5] w-fit max-w-[90%]">
                      Hello
                    </div>
                    <span className="text-[9px] text-[#635F74] mt-0.5 block">Aug 14, 05:24 PM</span>
                  </div>

                  {/* Message 2 */}
                  <div className="flex flex-col items-end">
                    <div className="px-3 py-2 rounded-[10px] bg-[#1A1629] border border-[#2B2440] text-[#EDEAF5]">
                      Hello
                    </div>
                    <span className="text-[9px] text-[#635F74] mt-0.5 mr-1">Aug 14, 05:25 PM</span>
                  </div>

                  {/* Message 3 Prompt */}
                  <div className="flex flex-col items-end">
                    <div className="px-3 py-2 rounded-[10px] bg-[#1A1629] border border-[#2B2440] text-[#EDEAF5]">
                      @ai create a simple calender
                    </div>
                    <span className="text-[9px] text-[#635F74] mt-0.5 mr-1">Aug 14, 05:49 PM</span>
                  </div>

                  {/* AI Response Card */}
                  <div className="p-2.5 rounded-[10px] bg-[#120F20] border border-[#2B2440] space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-semibold text-[#E9E6F5]">
                        <i className="ri-robot-2-line text-[#8B5CF6]" />
                        <span>NeuraChat AI</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#7C7790] text-[11px]">
                        <button className="hover:text-white flex items-center gap-0.5"><i className="ri-file-copy-line" /> Copy</button>
                        <button className="hover:text-white"><i className="ri-more-fill" /></button>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-[#B8B4C9] leading-relaxed">
                      I've created a simple, interactive calendar using plain HTML, CSS, and JavaScript. It displays the current month and year, highlights the current day, and allows you to navigate to previous and next months. The calendar dynamically adjusts for different month lengths and leap years.
                    </p>
                    {/* Attachment preview */}
                    <div className="p-2 rounded-[8px] bg-[#090810] border border-[#221D33] flex items-center justify-between text-[10.5px]">
                      <div className="flex items-center gap-2">
                        <i className="ri-folder-3-fill text-[#F59E0B] text-[14px]" />
                        <div>
                          <div className="font-semibold text-[#E2DFED]">Generated Workspace</div>
                          <div className="text-[9px] text-[#7C7790]">3 files • HTML/CSS/JS</div>
                        </div>
                      </div>
                      <span className="text-[#3B82F6] text-[10px] font-medium flex items-center gap-0.5">View files <i className="ri-arrow-down-s-line" /></span>
                    </div>
                  </div>
                </div>

                {/* Chat Composer */}
                <div className="p-2.5 border-t border-[#1E1B2E] bg-[#0E0B1A]">
                  <div className="w-full h-9 rounded-[8px] border border-[#27213A] bg-[#07060C] flex items-center px-2.5 gap-2">
                    <i className="ri-attachment-2 text-[#77728B] hover:text-white cursor-pointer text-[13px]" />
                    <span className="text-[11px] text-[#726E86] flex-1 truncate">Type @ai to ask NeuraChat AI...</span>
                    <button className="w-6 h-6 rounded-[5px] bg-[#3B82F6] text-white flex items-center justify-center hover:bg-[#2563EB] transition-colors">
                      <i className="ri-send-plane-fill text-[11px]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Center Pane: Explorer + Editor + Console (col-span-6) ── */}
              <div className="lg:col-span-6 flex flex-col bg-[#07060C] divide-y divide-[#1E1B2E]">
                
                {/* Upper Area: Explorer (Left) + Editor Ready (Right) */}
                <div className="grid grid-cols-12 flex-1 min-h-[380px] divide-x divide-[#1E1B2E]">
                  {/* Sub-Explorer (4 cols) */}
                  <div className="col-span-4 p-3 flex flex-col justify-between bg-[#090812]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11.5px] text-[#D8D4E5] font-semibold">
                        <div className="flex items-center gap-1.5">
                          <i className="ri-layout-grid-line text-[#38BDF8]" />
                          <span>Main Workspace</span>
                          <i className="ri-arrow-down-s-line text-[11px]" />
                        </div>
                        <i className="ri-cloud-line text-[#7A758E]" />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-bold text-[#6D6880] tracking-wider pt-1">
                        <span>FILES EXPLORER</span>
                        <button className="text-[#A78BFA] hover:text-white flex items-center gap-0.5 font-medium">+ New File</button>
                      </div>

                      <div className="w-full h-7 rounded-[6px] bg-[#120F20] border border-[#221D33] px-2 flex items-center gap-1.5 text-[10.5px] text-[#7A758E]">
                        <i className="ri-search-line text-[11px]" />
                        <span>Search files...</span>
                      </div>
                    </div>

                    <div className="my-auto py-10 flex flex-col items-center justify-center text-center">
                      <i className="ri-file-text-line text-[#3F3A53] text-[28px] mb-1.5" />
                      <span className="text-[11px] text-[#6D6880]">No files in workspace</span>
                    </div>
                  </div>

                  {/* Sub-Editor Empty State (8 cols) */}
                  <div className="col-span-8 flex flex-col bg-[#08070E] justify-between">
                    {/* Tab Header */}
                    <div className="h-8 border-b border-[#1E1B2E] px-3 flex items-center justify-between text-[11px] text-[#77728B] bg-[#0B0914]">
                      <span>No files open</span>
                      <i className="ri-split-cells-horizontal text-[13px] hover:text-white cursor-pointer" />
                    </div>

                    {/* Editor Ready Empty State */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-10 h-10 rounded-[10px] bg-[#161225] border border-[#2B2342] flex items-center justify-center text-[#E2DFED] mb-3 shadow-inner">
                        <i className="ri-terminal-box-line text-[20px]" />
                      </div>
                      <div className="text-[13.5px] font-bold text-[#E9E6F5] tracking-tight mb-1">Editor Ready</div>
                      <div className="text-[11px] text-[#7C7790] max-w-[220px]">Select a file from the explorer to start editing</div>
                    </div>
                  </div>
                </div>

                {/* Lower Area: Console Terminal */}
                <div className="h-[180px] flex flex-col bg-[#08070E] font-mono text-[10.5px]">
                  {/* Console Header Tabs & Actions */}
                  <div className="h-8 border-b border-[#1E1B2E] px-3 flex items-center justify-between bg-[#0B0914] select-none">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7C7790]" />
                      <span className="font-semibold text-[#DFDCED] text-[11px]">CONSOLE</span>
                      <i className="ri-arrow-down-s-line text-[#7C7790] text-[10px]" />
                      <span className="px-1.5 py-0.5 rounded bg-[#161324] text-[#8E89A4] text-[9.5px]">0 lines</span>
                      <div className="flex items-center gap-1 ml-2 text-[10px] text-[#7C7790]">
                        <span className="px-1.5 py-0.5 rounded bg-[#1C182E] text-white font-semibold">All</span>
                        <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Errors</span>
                        <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Warnings</span>
                        <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Info</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-[#6D6880] text-[12px]">
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
                    <i className="ri-terminal-line text-[#332E44] text-[20px] mb-1" />
                    <div className="text-[11px] font-semibold text-[#868199]">No output yet</div>
                    <div className="text-[10px] text-[#5D586F]">Run your project to see runtime logs here.</div>
                  </div>
                </div>

              </div>

              {/* ── Right Pane: Live Preview (col-span-3) ── */}
              <div className="lg:col-span-3 flex flex-col items-center justify-center p-6 text-center bg-[#07060C] h-full overflow-hidden">
                <div className="mb-2 shrink-0">
                  <RobotSkeleton
                    state="idle"
                    showBubble={false}
                    scale={0.65}
                  />
                </div>

                <div className="max-w-xs flex flex-col items-center gap-1 mb-5 shrink-0">
                  <h3 className="text-[14px] font-semibold text-[#E8E8EA] tracking-tight">
                    Preview is not running
                  </h3>
                  <p className="text-[11px] text-[#8A879B] leading-relaxed max-w-[220px]">
                    Run your project to see the live result here.
                  </p>
                </div>

                <button className="px-4 py-2 rounded-[7px] text-[11.5px] font-semibold flex items-center gap-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md cursor-pointer transition-all">
                  <i className="ri-play-fill text-[13px]" />
                  <span>Run Project</span>
                </button>
              </div>

            </div>

            {/* ═══ Bottom IDE Status Bar ═══ */}
            <div className="h-6 border-t border-[#1E1B2E] px-3 bg-[#0B0914] flex items-center justify-between text-[10px] text-[#716D83] font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[#D3CFE2]"><i className="ri-layout-grid-line text-[#38BDF8]" /> Main Workspace</span>
                <span className="flex items-center gap-1 text-[#F59E0B]"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> Sandbox Idle</span>
                <span className="hidden sm:inline-block"><i className="ri-command-line" /> Cmd + Shift + P</span>
              </div>
              <div className="flex items-center gap-3">
                <span>42 MB</span>
                <span>Spaces: 4</span>
                <span>UTF-8</span>
                <span className="text-[#38BDF8]">&lt;&gt; JavaScript</span>
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
