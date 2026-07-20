import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'

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
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-[8px] bg-[var(--nc-primary)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <i className="ri-sparkling-2-line text-[16px] text-[var(--nc-bg)]" />
            </div>
            <span className="font-[700] text-[15px] tracking-tight">NeuraChat</span>
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

        {/* ─── PRODUCT SCREENSHOT ─── */}
        <section className="w-full max-w-[1100px] px-6 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.15 }}
            className="w-full rounded-[16px] border border-[var(--nc-border)] bg-[var(--nc-surface)] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col"
          >
            {/* Fake Mac Header */}
            <div className="h-12 border-b border-[var(--nc-border)] flex items-center px-4 gap-2 bg-[var(--nc-bg)]">
              <div className="w-3 h-3 rounded-full bg-[var(--nc-border)] hover:bg-[#EF4444] transition-colors" />
              <div className="w-3 h-3 rounded-full bg-[var(--nc-border)] hover:bg-[#F59E0B] transition-colors" />
              <div className="w-3 h-3 rounded-full bg-[var(--nc-border)] hover:bg-[#22C55E] transition-colors" />
              <div className="mx-auto text-[12px] font-[500] text-[var(--nc-text-muted)] flex items-center gap-1">
                <i className="ri-lock-line" /> neurachat.dev
              </div>
            </div>
            {/* Fake UI */}
            <div className="flex h-[400px] md:h-[600px]">
              {/* Sidebar */}
              <div className="w-16 md:w-64 border-r border-[var(--nc-border)] bg-[var(--nc-bg)] flex flex-col p-4 gap-4">
                <div className="h-8 w-full rounded-[8px] bg-[var(--nc-border)] opacity-50" />
                <div className="hidden md:block h-4 w-3/4 rounded-[4px] bg-[var(--nc-border)] opacity-30 mt-4" />
                <div className="hidden md:block h-4 w-1/2 rounded-[4px] bg-[var(--nc-border)] opacity-30" />
                <div className="hidden md:block h-4 w-2/3 rounded-[4px] bg-[var(--nc-border)] opacity-30" />
              </div>
              {/* Main Content */}
              <div className="flex-1 flex flex-col bg-[var(--nc-surface)]">
                <div className="h-14 border-b border-[var(--nc-border)] flex items-center px-6">
                  <div className="h-4 w-32 rounded-[4px] bg-[var(--nc-border)] opacity-50" />
                </div>
                <div className="flex-1 p-6 flex flex-col gap-6">
                  {/* Fake Chat Bubbles */}
                  <div className="self-end w-3/4 md:w-1/2 p-4 rounded-[12px] bg-[var(--nc-elevated)] border border-[var(--nc-border)]">
                    <div className="h-3 w-full bg-[var(--nc-border)] rounded-[2px] opacity-40 mb-2" />
                    <div className="h-3 w-4/5 bg-[var(--nc-border)] rounded-[2px] opacity-40" />
                  </div>
                  <div className="self-start w-3/4 md:w-2/3 p-4">
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-[6px] bg-[var(--nc-primary)] flex-shrink-0 flex items-center justify-center">
                         <i className="ri-sparkling-2-line text-[14px] text-[var(--nc-bg)]" />
                      </div>
                      <div className="w-full">
                        <div className="h-3 w-1/3 bg-[var(--nc-text-secondary)] rounded-[2px] opacity-30 mb-4" />
                        <div className="w-full h-32 border border-[var(--nc-border)] rounded-[8px] bg-[var(--nc-bg)] p-3 flex flex-col gap-2">
                           <div className="h-2 w-1/4 bg-[var(--nc-border)] rounded-[2px]" />
                           <div className="h-2 w-1/2 bg-[var(--nc-border)] rounded-[2px]" />
                           <div className="h-2 w-1/3 bg-[var(--nc-border)] rounded-[2px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Fake Composer */}
                <div className="p-4 border-t border-[var(--nc-border)]">
                  <div className="w-full h-12 rounded-[14px] border border-[var(--nc-border)] bg-[var(--nc-bg)] flex items-center justify-between px-4 shadow-sm">
                     <div className="h-3 w-32 bg-[var(--nc-border)] rounded-[2px] opacity-40" />
                     <div className="h-6 w-6 rounded-[4px] bg-[var(--nc-primary)] flex items-center justify-center">
                         <i className="ri-arrow-up-line text-[14px] text-[var(--nc-bg)]" />
                     </div>
                  </div>
                </div>
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
        <section className="w-full max-w-[1280px] px-6 text-center">
          <div className="rounded-[24px] bg-[var(--nc-primary)] text-[var(--nc-bg)] py-20 px-6 flex flex-col items-center shadow-lg">
            <h2 className="text-[36px] font-[700] tracking-tight mb-6">Start building today.</h2>
            <p className="text-[18px] opacity-80 mb-10 max-w-[500px]">
              Join the developers who are shipping faster with NeuraChat's collaborative AI workspace.
            </p>
            <Link to="/register">
              <button className="h-[48px] px-8 rounded-[12px] bg-[var(--nc-bg)] text-[var(--nc-primary)] font-[600] hover:scale-[0.98] transition-transform duration-150 shadow-sm">
                Get Started for Free
              </button>
            </Link>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[var(--nc-border)] bg-[var(--nc-surface)] py-12">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-[var(--nc-text-secondary)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[var(--nc-text-secondary)] flex items-center justify-center opacity-80">
              <i className="ri-sparkling-2-fill text-[var(--nc-bg)] text-[12px]" />
            </div>
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
