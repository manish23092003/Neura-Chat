import React, { memo } from 'react'
import RobotSkeleton from '../RobotSkeleton'

/**
 * LivePreview
 *
 * Right panel — shows the running application in device frames.
 * Memoized — only re-renders when iframeUrl, preview settings, or runtime
 * state changes.
 */
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
}) {
    if (!iframeUrl) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <RobotSkeleton
                    state={isRunning ? 'thinking' : terminalOutput.includes('UNSUPPORTED') || terminalOutput.includes('Error:') ? 'error' : 'idle'}
                    message={
                        isRunning
                            ? `${runtimeStatus}…`
                            : terminalOutput.includes('UNSUPPORTED')
                            ? 'Unsupported native framework'
                            : 'Click Run to boot project inside Lifo.sh sandbox!'
                    }
                />
            </div>
        )
    }

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
        const availableWidth = previewPanelWidth - 80
        if (devWidth > availableWidth) scale = availableWidth / devWidth
    } else {
        scale = Number(previewZoom)
    }

    return (
        <div className="preview-canvas-container">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--nc-border)', background: 'var(--nc-surface)' }}>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-5 h-5 rounded-[5px] flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--nc-success)' }} />
                    </div>
                    <span className="text-[11px] font-[800] tracking-wider" style={{ color: 'var(--nc-success)' }}>LIVE PREVIEW</span>
                </div>

                {/* Device Presets */}
                <div className="flex items-center gap-0.5 border rounded-[8px] p-0.5" style={{ borderColor: 'var(--nc-border)', background: 'var(--nc-bg)' }}>
                    {[
                        { id: 'mobile',     icon: 'ri-smartphone-line',  tooltip: 'Phone View (375x812)' },
                        { id: 'tablet',     icon: 'ri-tablet-line',      tooltip: 'Tablet View (768x1024)' },
                        { id: 'laptop',     icon: 'ri-computer-line',    tooltip: 'Laptop View (1024x640)' },
                        { id: 'responsive', icon: 'ri-aspect-ratio-line',tooltip: 'Responsive View (Custom)' },
                    ].map((device) => (
                        <button
                            key={device.id}
                            onClick={() => {
                                setPreviewDevice(device.id)
                                setPreviewOrientation(device.id === 'laptop' ? 'landscape' : 'portrait')
                            }}
                            className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-all"
                            title={device.tooltip}
                            style={{
                                border: 'none',
                                background: previewDevice === device.id ? 'var(--nc-primary-muted)' : 'transparent',
                                color: previewDevice === device.id ? 'var(--nc-primary)' : 'var(--nc-text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            <i className={`${device.icon} text-[13px]`} />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5">
                    {previewDevice !== 'responsive' && (
                        <button
                            onClick={() => setPreviewOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
                            className="w-7 h-7 rounded-[6px] border flex items-center justify-center transition-colors"
                            title={`Rotate Screen`}
                            style={{ borderColor: 'var(--nc-border)', background: 'var(--nc-bg)', color: 'var(--nc-text-secondary)', cursor: 'pointer' }}
                        >
                            <i className={`ri-clockwise-2-line text-[13px] transition-transform duration-300 ${previewOrientation === 'landscape' ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                    <select
                        value={previewZoom}
                        onChange={(e) => setPreviewZoom(e.target.value)}
                        className="nc-input"
                        style={{ height: 28, fontSize: 11, background: 'var(--nc-bg)', border: '1px solid var(--nc-border)', color: 'var(--nc-text-primary)', borderRadius: '6px', cursor: 'pointer', outline: 'none', padding: '0 6px', width: 60 }}
                    >
                        <option value="fit">Fit</option>
                        <option value="0.5">50%</option>
                        <option value="0.75">75%</option>
                        <option value="1.0">100%</option>
                        <option value="1.25">125%</option>
                    </select>
                </div>
            </div>

            {/* URL bar */}
            <div className="flex items-center gap-2 px-4 py-2 shrink-0 border-b" style={{ background: 'var(--nc-surface)', borderColor: 'var(--nc-border)' }}>
                <i className="ri-global-line text-[13px]" style={{ color: 'var(--nc-text-muted)' }} />
                {previewsList && previewsList.length > 1 ? (
                    <select
                        value={iframeUrl}
                        onChange={(e) => setIframeUrl(e.target.value)}
                        className="nc-input flex-1"
                        style={{ height: 26, fontSize: 11, background: 'var(--nc-bg)', border: '1px solid var(--nc-border)', color: 'var(--nc-text-primary)', borderRadius: '6px', cursor: 'pointer', outline: 'none', padding: '0 6px' }}
                    >
                        {previewsList.map((p, idx) => (
                            <option key={idx} value={p.url} style={{ background: 'var(--nc-bg)', color: 'var(--nc-text-primary)' }}>{p.name}</option>
                        ))}
                    </select>
                ) : (
                    <input type="text" value={iframeUrl} readOnly className="nc-input flex-1"
                        style={{ height: 26, fontSize: 11, cursor: 'default', background: 'transparent', border: 'none', color: 'var(--nc-text-muted)' }}
                        title="Lifo Sandbox URL"
                    />
                )}
            </div>

            {/* Responsive width slider */}
            {previewDevice === 'responsive' && (
                <div className="flex items-center gap-3 px-4 py-2 shrink-0 border-b" style={{ background: 'var(--nc-surface)', borderColor: 'var(--nc-border)' }}>
                    <span className="text-[10px] font-[600] uppercase tracking-wider text-[var(--nc-text-muted)] w-20">Width: {previewWidth}px</span>
                    <input type="range" min="320" max="1200" step="10" value={previewWidth}
                        onChange={(e) => setPreviewWidth(Number(e.target.value))}
                        className="flex-1 cursor-pointer accent-[var(--nc-primary)]"
                        style={{ height: 4 }} aria-label="Device width simulation"
                    />
                    <button
                        onClick={() => setPreviewWidth(375)}
                        className="text-[10px] px-2 py-0.5 rounded font-[500] hover:bg-[rgba(34,197,94,0.15)] transition-colors"
                        style={{ background: 'var(--nc-elevated)', border: '1px solid var(--nc-border)', color: 'var(--nc-text-secondary)', cursor: 'pointer' }}
                    >
                        Reset
                    </button>
                </div>
            )}

            {/* Device frame + iframe */}
            <div className="preview-canvas">
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
                            <iframe src={iframeUrl} title="Mobile Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
                        </div>
                    )}
                    {previewDevice === 'tablet' && (
                        <div className="device-tablet" style={{ width: devWidth, height: devHeight }}>
                            <div className="device-tablet-camera" />
                            <iframe src={iframeUrl} title="Tablet Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
                        </div>
                    )}
                    {previewDevice === 'laptop' && (
                        <div className="flex flex-col items-center w-full h-full">
                            <div className="device-laptop" style={{ width: devWidth, height: devHeight }}>
                                <div className="device-laptop-camera" />
                                <iframe src={iframeUrl} title="Laptop Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
                            </div>
                            {previewOrientation === 'landscape' && (
                                <div className="device-laptop-base" style={{ width: devWidth }} />
                            )}
                        </div>
                    )}
                    {previewDevice === 'responsive' && (
                        <div className="device-responsive" style={{ width: devWidth, height: '100%', minHeight: 400 }}>
                            <iframe src={iframeUrl} title="Responsive Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
})

export default LivePreview
