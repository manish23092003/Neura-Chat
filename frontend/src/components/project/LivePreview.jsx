import React, { memo, useState, useCallback, useEffect, useRef } from 'react'
import RobotSkeleton from '../RobotSkeleton'

/**
 * LivePreview
 *
 * Professional IDE preview panel with responsive toolbar.
 * Dropdowns for Device & Zoom, icon buttons for actions, overflow "More" menu.
 * NO horizontal toolbar scrolling.
 */

const DEVICES = [
    { id: 'responsive', label: 'Responsive', icon: 'ri-aspect-ratio-line' },
    { id: 'laptop',     label: 'Laptop',     icon: 'ri-computer-line' },
    { id: 'tablet',     label: 'Tablet',     icon: 'ri-tablet-line' },
    { id: 'mobile',     label: 'Mobile',     icon: 'ri-smartphone-line' },
]

const ZOOM_OPTIONS = [
    { value: 'fit',  label: 'Fit' },
    { value: '0.5',  label: '50%' },
    { value: '0.75', label: '75%' },
    { value: '1.0',  label: '100%' },
    { value: '1.25', label: '125%' },
]

const LivePreview = memo(function LivePreview({
    iframeUrl,
    previewsList,
    setIframeUrl,
    previewDevice,
    setPreviewDevice,
    previewOrientation,
    setPreviewOrientation,
    previewZoom,
    setPreviewZoom,
    previewWidth,
    setPreviewWidth,
    previewPanelWidth,
    isRunning,
    runtimeStatus,
    terminalOutput,
    onRun,
}) {
    const [refreshKey, setRefreshKey] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [iframeLoading, setIframeLoading] = useState(false)

    // Dropdown open states
    const [deviceOpen, setDeviceOpen] = useState(false)
    const [zoomOpen, setZoomOpen] = useState(false)
    const [moreOpen, setMoreOpen] = useState(false)

    // Refs for click-outside
    const deviceRef = useRef(null)
    const zoomRef = useRef(null)
    const moreRef = useRef(null)

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (deviceRef.current && !deviceRef.current.contains(e.target)) setDeviceOpen(false)
            if (zoomRef.current && !zoomRef.current.contains(e.target)) setZoomOpen(false)
            if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    // Escape exits fullscreen
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false) }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [isFullscreen])

    const handleRefresh = useCallback(() => {
        setIframeLoading(true)
        setRefreshKey(prev => prev + 1)
    }, [])

    const handleOpenNewTab = useCallback(() => {
        if (iframeUrl) window.open(iframeUrl, '_blank')
    }, [iframeUrl])

    const handleCopyUrl = useCallback(() => {
        if (iframeUrl) {
            navigator.clipboard.writeText(iframeUrl).catch(() => {})
        }
    }, [iframeUrl])

    /* ── Idle / Starting / Error / No URL state ── */
    if (!iframeUrl) {
        const isError = !isRunning && (
            runtimeStatus === 'Failed' ||
            (terminalOutput && (terminalOutput.includes('UNSUPPORTED') || terminalOutput.includes('Error:') || terminalOutput.includes('ENOENT')))
        )

        let robotState = 'idle'
        let title = 'Preview is not running'
        let description = 'Run your project to see the live result here.'

        if (isRunning) {
            robotState = 'thinking'
            title = 'Starting preview...'
            description = runtimeStatus && runtimeStatus !== 'Idle' ? runtimeStatus : 'Preparing your project.'
        } else if (isError) {
            robotState = 'error'
            title = "Preview couldn't start"
            description = 'Something went wrong while starting your project.'
        }

        return (
            <div 
                className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden" 
                style={{ background: '#0A0A0B', color: '#E8E8EA' }}
            >
                {/* Robot Illustration (subtle, no speech bubbles) */}
                <div className="mb-2 shrink-0">
                    <RobotSkeleton
                        state={robotState}
                        showBubble={false}
                        scale={0.7}
                    />
                </div>

                {/* Typography Hierarchy */}
                <div className="max-w-xs flex flex-col items-center gap-1.5 mb-5 shrink-0">
                    <h3 className="text-base font-semibold text-[#E8E8EA] tracking-tight">
                        {title}
                    </h3>
                    <p className="text-xs text-[#A1A4AC] leading-relaxed max-w-[260px]">
                        {description}
                    </p>
                </div>

                {/* State CTA Actions */}
                <div className="shrink-0">
                    {isRunning ? (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#16181D] border border-[#24262A] text-xs text-[#A1A4AC] font-medium">
                            <i className="ri-loader-4-line animate-spin text-[#3B82F6] text-sm" />
                            <span>Starting preview...</span>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center gap-2">
                            {onRun && (
                                <button
                                    onClick={onRun}
                                    className="px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all shadow-xs active:scale-95 bg-[#3B82F6] hover:bg-[#2563EB] text-white cursor-pointer"
                                >
                                    <i className="ri-refresh-line text-sm" />
                                    Try Again
                                </button>
                            )}
                            <span className="text-[11px] text-[#6B6F78]">
                                Check terminal console for details
                            </span>
                        </div>
                    ) : (
                        onRun && (
                            <button
                                onClick={onRun}
                                className="px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all shadow-xs active:scale-95 bg-[#3B82F6] hover:bg-[#2563EB] text-white cursor-pointer"
                            >
                                <i className="ri-play-fill text-sm" />
                                ▶ Run Project
                            </button>
                        )
                    )}
                </div>
            </div>
        )
    }

    /* ── Device dimensions ── */
    const deviceDimensions = {
        mobile:     { portrait: { width: 375, height: 812 },  landscape: { width: 812, height: 375 } },
        tablet:     { portrait: { width: 768, height: 1024 }, landscape: { width: 1024, height: 768 } },
        laptop:     { portrait: { width: 800, height: 1200 }, landscape: { width: 1024, height: 640 } },
        responsive: { portrait: { width: previewWidth, height: '100%' }, landscape: { width: previewWidth, height: '100%' } },
    }

    const dims = deviceDimensions[previewDevice][previewOrientation]
    const devWidth = dims.width
    const devHeight = dims.height

    let scale = 1
    if (previewZoom === 'fit') {
        const availableWidth = (isFullscreen ? window.innerWidth : previewPanelWidth) - 80
        if (devWidth > availableWidth) scale = availableWidth / devWidth
    } else {
        scale = Number(previewZoom)
    }

    const iframeSrc = iframeUrl.startsWith('blob:') ? iframeUrl : `${iframeUrl}${iframeUrl.includes('?') ? '&' : '?'}_r=${refreshKey}`

    const currentDevice = DEVICES.find(d => d.id === previewDevice) || DEVICES[0]
    const currentZoom = ZOOM_OPTIONS.find(z => z.value === String(previewZoom)) || ZOOM_OPTIONS[0]

    /* ── Dropdown component (reusable) ── */
    const Dropdown = ({ refProp, isOpen, toggle, label, icon, children, className = '', align = 'left' }) => (
        <div ref={refProp} className={`relative ${className}`}>
            <button
                onClick={toggle}
                className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded transition-colors"
                style={{
                    background: isOpen ? '#1A1C20' : 'transparent',
                    color: isOpen ? '#E8E8EA' : '#A1A4AC',
                    border: 'none',
                    cursor: 'pointer',
                }}
            >
                {icon && <i className={`${icon} text-[12px]`} />}
                <span>{label}</span>
                <i className={`ri-arrow-down-s-line text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div
                    className="absolute top-full mt-1 py-1 rounded-md z-50 min-w-[140px]"
                    style={{
                        background: '#15171A',
                        border: '1px solid #24262A',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        ...(align === 'right' ? { right: 0 } : { left: 0 }),
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    )

    /* ── Icon Button (reusable) ── */
    const IconBtn = ({ icon, title, onClick, active = false, className = '' }) => (
        <button
            onClick={onClick}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${className}`}
            style={{
                color: active ? '#3B82F6' : '#6B6F78',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
            }}
            title={title}
            aria-label={title}
            onMouseEnter={e => { e.currentTarget.style.color = '#E8E8EA'; e.currentTarget.style.background = '#1A1C20' }}
            onMouseLeave={e => { e.currentTarget.style.color = active ? '#3B82F6' : '#6B6F78'; e.currentTarget.style.background = 'transparent' }}
        >
            <i className={`${icon} text-[13px]`} />
        </button>
    )

    /* ── Dropdown option row ── */
    const DropdownItem = ({ icon, label, selected, onClick }) => (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors"
            style={{
                color: selected ? '#E8E8EA' : '#A1A4AC',
                background: selected ? '#1A1C20' : 'transparent',
                border: 'none',
                cursor: 'pointer',
            }}
            onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#1A1C20' }}
            onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
        >
            {icon && <i className={`${icon} text-[12px]`} style={{ color: selected ? '#3B82F6' : '#6B6F78' }} />}
            <span className="flex-1">{label}</span>
            {selected && <i className="ri-check-line text-[11px]" style={{ color: '#3B82F6' }} />}
        </button>
    )

    return (
        <div className={`preview-canvas-container flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`} style={{ background: '#0A0A0B' }}>

            {/* ═══ Toolbar ═══ */}
            <div
                className="flex items-center justify-between px-3 shrink-0"
                style={{ height: 40, borderBottom: '1px solid #24262A', background: '#101113' }}
            >
                {/* Left: Status indicator */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
                    <span className="text-[11px] font-medium tracking-normal text-[#E8E8EA]">
                        Preview running
                    </span>
                </div>

                {/* Center: Device + Zoom dropdowns */}
                <div className="flex items-center gap-1">
                    {/* Device selector */}
                    <Dropdown
                        refProp={deviceRef}
                        isOpen={deviceOpen}
                        toggle={() => { setDeviceOpen(p => !p); setZoomOpen(false); setMoreOpen(false) }}
                        label={currentDevice.label}
                        icon={currentDevice.icon}
                    >
                        {DEVICES.map(d => (
                            <DropdownItem
                                key={d.id}
                                icon={d.icon}
                                label={d.label}
                                selected={previewDevice === d.id}
                                onClick={() => {
                                    setPreviewDevice(d.id)
                                    setPreviewOrientation(d.id === 'laptop' ? 'landscape' : 'portrait')
                                    setDeviceOpen(false)
                                }}
                            />
                        ))}
                    </Dropdown>

                    {/* Zoom selector */}
                    <Dropdown
                        refProp={zoomRef}
                        isOpen={zoomOpen}
                        toggle={() => { setZoomOpen(p => !p); setDeviceOpen(false); setMoreOpen(false) }}
                        label={currentZoom.label}
                    >
                        {ZOOM_OPTIONS.map(z => (
                            <DropdownItem
                                key={z.value}
                                label={z.label}
                                selected={String(previewZoom) === z.value}
                                onClick={() => {
                                    setPreviewZoom(z.value)
                                    setZoomOpen(false)
                                }}
                            />
                        ))}
                    </Dropdown>

                    {/* Orientation toggle (only for device frames) */}
                    {previewDevice !== 'responsive' && (
                        <IconBtn
                            icon={`ri-clockwise-2-line ${previewOrientation === 'landscape' ? 'rotate-90' : ''}`}
                            title="Rotate"
                            onClick={() => setPreviewOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
                        />
                    )}
                </div>

                {/* Right: Primary actions + More */}
                <div className="flex items-center gap-0.5 shrink-0">
                    {/* Primary actions — always visible */}
                    <IconBtn icon="ri-refresh-line" title="Refresh preview" onClick={handleRefresh} />
                    <IconBtn icon="ri-external-link-line" title="Open in new tab" onClick={handleOpenNewTab} className="preview-hide-narrow" />
                    <IconBtn
                        icon={isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'}
                        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        onClick={() => setIsFullscreen(p => !p)}
                        className="preview-hide-narrow"
                    />

                    {/* More menu */}
                    <Dropdown
                        refProp={moreRef}
                        isOpen={moreOpen}
                        toggle={() => { setMoreOpen(p => !p); setDeviceOpen(false); setZoomOpen(false) }}
                        label=""
                        icon="ri-more-2-fill"
                        align="right"
                    >
                        {/* Show collapsed actions at narrow widths */}
                        <div className="preview-show-narrow-only">
                            <DropdownItem icon="ri-external-link-line" label="Open in new tab" onClick={() => { handleOpenNewTab(); setMoreOpen(false) }} />
                            <DropdownItem icon={isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'} label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={() => { setIsFullscreen(p => !p); setMoreOpen(false) }} />
                            <div style={{ height: 1, background: '#24262A', margin: '4px 0' }} />
                        </div>
                        <DropdownItem icon="ri-file-copy-line" label="Copy preview URL" onClick={() => { handleCopyUrl(); setMoreOpen(false) }} />
                        <DropdownItem icon="ri-restart-line" label="Reset preview" onClick={() => { handleRefresh(); setMoreOpen(false) }} />
                    </Dropdown>
                </div>
            </div>

            {/* ═══ URL / Route bar ═══ */}
            <div
                className="flex items-center gap-2 px-3 shrink-0"
                style={{ height: 32, borderBottom: '1px solid #1A1C20', background: '#0D0D0F' }}
            >
                <i className="ri-global-line text-[12px]" style={{ color: '#6B6F78' }} />
                {previewsList && previewsList.length > 1 ? (
                    <select
                        value={iframeUrl}
                        onChange={(e) => setIframeUrl(e.target.value)}
                        className="flex-1 text-[11px] font-mono outline-none"
                        style={{ background: 'transparent', border: 'none', color: '#A1A4AC', cursor: 'pointer' }}
                    >
                        {previewsList.map((p, idx) => (
                            <option key={idx} value={p.url} style={{ background: '#101113', color: '#E8E8EA' }}>{p.name}</option>
                        ))}
                    </select>
                ) : (
                    <span className="flex-1 text-[11px] font-mono truncate" style={{ color: '#6B6F78' }}>
                        {iframeUrl}
                    </span>
                )}
            </div>

            {/* ═══ Responsive width slider (only in responsive mode) ═══ */}
            {previewDevice === 'responsive' && (
                <div
                    className="flex items-center gap-3 px-3 shrink-0"
                    style={{ height: 28, borderBottom: '1px solid #1A1C20', background: '#0D0D0F' }}
                >
                    <span className="text-[10px] font-mono shrink-0" style={{ color: '#6B6F78' }}>
                        {previewWidth}px
                    </span>
                    <input
                        type="range" min="320" max="1400" step="10"
                        value={previewWidth}
                        onChange={(e) => setPreviewWidth(Number(e.target.value))}
                        className="flex-1 cursor-pointer accent-[#3B82F6]"
                        style={{ height: 3 }}
                        aria-label="Preview width"
                    />
                    <button
                        onClick={() => setPreviewWidth(800)}
                        className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
                        style={{ color: '#6B6F78', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#A1A4AC'; e.currentTarget.style.background = '#1A1C20' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#6B6F78'; e.currentTarget.style.background = 'transparent' }}
                        title="Reset to 800px"
                    >
                        Reset
                    </button>
                </div>
            )}

            {/* ═══ Preview Canvas ═══ */}
            <div className="preview-canvas relative flex-1">
                {/* Loading overlay */}
                {iframeLoading && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(10,10,11,0.8)' }}>
                        <i className="ri-loader-4-line nc-spin text-lg" style={{ color: '#3B82F6' }} />
                        <span className="text-[12px] font-medium" style={{ color: '#A1A4AC' }}>Reloading preview…</span>
                    </div>
                )}

                <div
                    className="device-wrapper"
                    style={{
                        transform: `scale(${scale})`,
                        width: devWidth,
                        height: previewDevice === 'laptop' && previewOrientation === 'landscape'
                            ? (typeof devHeight === 'number' ? devHeight + 12 : devHeight)
                            : devHeight,
                        flexShrink: 0,
                    }}
                >
                    {previewDevice === 'mobile' && (
                        <div className="device-phone" style={{ width: devWidth, height: devHeight }}>
                            <div className="device-phone-speaker" />
                            <div className="device-phone-camera" />
                            <iframe
                                key={refreshKey}
                                src={iframeSrc}
                                title="Mobile Preview"
                                onLoad={() => setIframeLoading(false)}
                                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                            />
                        </div>
                    )}
                    {previewDevice === 'tablet' && (
                        <div className="device-tablet" style={{ width: devWidth, height: devHeight }}>
                            <div className="device-tablet-camera" />
                            <iframe
                                key={refreshKey}
                                src={iframeSrc}
                                title="Tablet Preview"
                                onLoad={() => setIframeLoading(false)}
                                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                            />
                        </div>
                    )}
                    {previewDevice === 'laptop' && (
                        <div className="flex flex-col items-center w-full h-full">
                            <div className="device-laptop" style={{ width: devWidth, height: devHeight }}>
                                <div className="device-laptop-camera" />
                                <iframe
                                    key={refreshKey}
                                    src={iframeSrc}
                                    title="Laptop Preview"
                                    onLoad={() => setIframeLoading(false)}
                                    style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                                />
                            </div>
                            {previewOrientation === 'landscape' && (
                                <div className="device-laptop-base" style={{ width: devWidth }} />
                            )}
                        </div>
                    )}
                    {previewDevice === 'responsive' && (
                        <div className="device-responsive" style={{ width: devWidth, height: '100%', minHeight: 400 }}>
                            <iframe
                                key={refreshKey}
                                src={iframeSrc}
                                title="Responsive Preview"
                                onLoad={() => setIframeLoading(false)}
                                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
})

export default LivePreview
