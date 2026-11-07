import React, { useEffect, useRef, useState } from 'react';
import { Camera, Download, Maximize2, RefreshCw, Settings2, Video, VideoOff } from 'lucide-react';
import { CameraConfig, RestaurantSettings } from '../data/mockDatabase';

interface CctvModuleProps {
  settings: RestaurantSettings;
  onUpdateSettings: (next: RestaurantSettings) => void;
  isAdmin: boolean;
}

interface SnapshotItem {
  id: string;
  cameraName: string;
  timestamp: string;
  dataUrl: string;
}

export const CctvModule: React.FC<CctvModuleProps> = ({ settings, onUpdateSettings, isAdmin }) => {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [editingCamId, setEditingCamId] = useState<string | null>(null);
  const [expandedCamId, setExpandedCamId] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [typeDraft, setTypeDraft] = useState<'simulated' | 'iframe' | 'video'>('simulated');
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // Render simulated live kitchen feed on canvases so cameras work out-of-the-box and support real snapshots
  useEffect(() => {
    let animId: number;
    let tick = 0;

    const renderFeeds = () => {
      tick += 1;
      const nowStr = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      settings.cameras.forEach((cam, idx) => {
        const canvas = canvasRefs.current[cam.id];
        if (!canvas || !cam.online || cam.streamType !== 'simulated') return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        // Subtle dark industrial kitchen backdrop
        const grad = ctx.createLinearGradient(0, 0, w, h);
        if (idx === 0) {
          grad.addColorStop(0, '#1c1917');
          grad.addColorStop(1, '#292524');
        } else if (idx === 1) {
          grad.addColorStop(0, '#18181b');
          grad.addColorStop(1, '#27272a');
        } else if (idx === 2) {
          grad.addColorStop(0, '#172554');
          grad.addColorStop(1, '#1e293b');
        } else {
          grad.addColorStop(0, '#14291e');
          grad.addColorStop(1, '#1e293b');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Perspective grid lines representing kitchen counters / tiles
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 48) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += 36) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Simulated Stainless Steel Counter & Station Elements
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(40, h - 95, w - 80, 65);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.strokeRect(40, h - 95, w - 80, 65);

        // Moving activity indicators (staff motion / steam / packaging boxes)
        const pos1 = 90 + Math.sin(tick * 0.03 + idx) * 75;
        const pos2 = w - 140 + Math.cos(tick * 0.025 + idx * 2) * 55;

        // Heat / Station signature
        ctx.fillStyle = idx === 0 ? 'rgba(245, 158, 11, 0.28)' : 'rgba(56, 189, 248, 0.22)';
        ctx.beginPath();
        ctx.arc(pos1, h - 115, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(pos2 - 22, h - 135, 44, 34);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
        ctx.strokeRect(pos2 - 22, h - 135, 44, 34);

        // OSD Top Bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, w, 34);
        ctx.fillStyle = '#f5f5f4';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(`${cam.id} · ${cam.name.toUpperCase()}`, 12, 21);
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(nowStr, w - 185, 21);

        // OSD Bottom Metadata
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, h - 28, w, 28);
        ctx.fillStyle = '#a8a29e';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`MUMBAI ZAIKA · WAZIRBAGH LUCKNOW · ${cam.zone}`, 12, h - 10);
        ctx.fillText(`BITRATE: ${2180 + ((tick + idx * 17) % 140)} kbps`, w - 155, h - 10);
      });

      animId = requestAnimationFrame(renderFeeds);
    };

    animId = requestAnimationFrame(renderFeeds);
    return () => cancelAnimationFrame(animId);
  }, [settings.cameras]);

  const handleCaptureSnapshot = (cam: CameraConfig) => {
    const canvas = canvasRefs.current[cam.id];
    let dataUrl = '';

    if (canvas && cam.streamType === 'simulated') {
      dataUrl = canvas.toDataURL('image/png');
    } else {
      // Create a clean fallback snapshot canvas if external iframe/video stream
      const temp = document.createElement('canvas');
      temp.width = 640;
      temp.height = 360;
      const ctx = temp.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`MUMBAI ZAIKA CCTV SNAPSHOT - ${cam.name}`, 24, 60);
        ctx.font = '14px monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`Stream URL: ${cam.streamUrl || 'Direct Feed'}`, 24, 100);
        ctx.fillText(`Captured: ${new Date().toLocaleString('en-IN')}`, 24, 130);
      }
      dataUrl = temp.toDataURL('image/png');
    }

    const snap: SnapshotItem = {
      id: `SNAP-${Date.now()}`,
      cameraName: cam.name,
      timestamp: new Date().toLocaleTimeString('en-IN'),
      dataUrl,
    };
    setSnapshots((prev) => [snap, ...prev]);
  };

  const handleToggleOnline = (camId: string) => {
    const updated = settings.cameras.map((c) =>
      c.id === camId ? { ...c, online: !c.online } : c
    );
    onUpdateSettings({ ...settings, cameras: updated });
  };

  const openEditStream = (cam: CameraConfig) => {
    setEditingCamId(cam.id);
    setUrlDraft(cam.streamUrl);
    setTypeDraft(cam.streamType);
  };

  const saveEditStream = (camId: string) => {
    const updated: CameraConfig[] = settings.cameras.map((c) => {
      if (c.id !== camId) return c;
      const nextType: 'simulated' | 'iframe' | 'video' = urlDraft.trim()
        ? typeDraft === 'simulated'
          ? 'iframe'
          : typeDraft
        : 'simulated';
      return {
        ...c,
        streamUrl: urlDraft.trim(),
        streamType: nextType,
      };
    });
    onUpdateSettings({ ...settings, cameras: updated });
    setEditingCamId(null);
  };

  const visibleCameras = expandedCamId
    ? settings.cameras.filter((c) => c.id === expandedCamId)
    : settings.cameras;

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Shop Live Camera Feed · CCTV Hub
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            2x2 real-time monitoring for Kitchen Tandoor Line, Stew Prep, Packaging Counter, and Wazirbagh Rider Pickup Window.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-stone-600">
          <span>Active Feeds: {settings.cameras.filter((c) => c.online).length}/{settings.cameras.length}</span>
          <span>·</span>
          <span>Snapshots: {snapshots.length}</span>
          {expandedCamId && (
            <button
              onClick={() => setExpandedCamId(null)}
              className="px-3 py-1.5 bg-stone-900 text-white rounded-md font-sans font-medium hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
            >
              Exit Full View
            </button>
          )}
        </div>
      </div>

      {/* 2x2 Camera Grid */}
      <div className={`grid gap-6 ${expandedCamId ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {visibleCameras.map((cam) => (
          <div
            key={cam.id}
            className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col"
          >
            {/* Camera Top Control Bar */}
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between gap-4 bg-stone-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 truncate">
                  <span>{cam.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5 font-mono">
                  <span>{cam.id}</span>
                  <span>·</span>
                  <span>{cam.zone}</span>
                  <span>·</span>
                  <span>{cam.resolution}</span>
                  <span>·</span>
                  <span className={cam.online ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
                    {cam.online ? 'Status: Online' : 'Status: Offline'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCaptureSnapshot(cam)}
                  disabled={!cam.online}
                  title="Take Snapshot"
                  className="px-2.5 py-1.5 text-xs font-medium bg-white border border-stone-300 text-stone-800 rounded-md hover:bg-stone-100 disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snapshot</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => openEditStream(cam)}
                    title="Configure RTSP/HLS/WebRTC URL"
                    className="px-2.5 py-1.5 text-xs font-medium bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-100 flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Stream URL</span>
                  </button>
                )}
                <button
                  onClick={() => handleToggleOnline(cam.id)}
                  title={cam.online ? 'Switch Offline' : 'Reconnect Feed'}
                  className="p-1.5 text-xs bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-100"
                >
                  {cam.online ? <Video className="w-3.5 h-3.5 text-emerald-700" /> : <VideoOff className="w-3.5 h-3.5 text-red-600" />}
                </button>
                <button
                  onClick={() => setExpandedCamId(expandedCamId === cam.id ? null : cam.id)}
                  title="Toggle Expand"
                  className="p-1.5 text-xs bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-100"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stream Configuration Drawer (if editing) */}
            {editingCamId === cam.id && (
              <div className="p-4 bg-amber-50/70 border-b border-stone-200 space-y-3">
                <div className="text-xs font-semibold text-stone-800">
                  Configure RTSP-to-HLS / WebRTC / IP Camera Stream for {cam.name}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={typeDraft}
                    onChange={(e) => setTypeDraft(e.target.value as 'simulated' | 'iframe' | 'video')}
                    className="px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md"
                  >
                    <option value="simulated">Simulated Kitchen Feed</option>
                    <option value="iframe">WebRTC / IP Cam Iframe URL</option>
                    <option value="video">HLS / MP4 Video Stream URL</option>
                  </select>
                  <input
                    type="url"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    placeholder="https://your-nvr-gateway.local/live/cam1.m3u8 or WebRTC embed URL"
                    className="sm:col-span-2 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md font-mono"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => saveEditStream(cam.id)}
                      className="flex-1 px-3 py-1.5 text-xs font-medium bg-stone-900 text-white rounded-md hover:bg-stone-800 whitespace-nowrap"
                    >
                      Save Feed
                    </button>
                    <button
                      onClick={() => setEditingCamId(null)}
                      className="px-2.5 py-1.5 text-xs font-medium bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-100 whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Video / Canvas Viewport */}
            <div className="relative bg-stone-950 aspect-video w-full flex items-center justify-center overflow-hidden">
              {!cam.online ? (
                <div className="text-center p-6 space-y-2">
                  <VideoOff className="w-8 h-8 text-stone-500 mx-auto" />
                  <div className="text-sm font-medium text-stone-300">Camera Feed Offline</div>
                  <div className="text-xs text-stone-500 font-mono">{cam.id} · Signal Disconnected</div>
                  <button
                    onClick={() => handleToggleOnline(cam.id)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-800 text-stone-200 rounded-md hover:bg-stone-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reconnect Camera</span>
                  </button>
                </div>
              ) : cam.streamType === 'iframe' && cam.streamUrl ? (
                <iframe
                  src={cam.streamUrl}
                  title={cam.name}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen"
                />
              ) : cam.streamType === 'video' && cam.streamUrl ? (
                <video
                  src={cam.streamUrl}
                  controls
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <canvas
                  ref={(el) => {
                    canvasRefs.current[cam.id] = el;
                  }}
                  width={640}
                  height={360}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Captured Snapshots Gallery */}
      <div className="border-t border-stone-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Captured Kitchen Snapshots</h2>
            <p className="text-xs text-stone-500">
              Click "Snapshot" on any active camera above to log hygiene & dispatch verification frames.
            </p>
          </div>
          {snapshots.length > 0 && (
            <button
              onClick={() => setSnapshots([])}
              className="text-xs text-stone-600 hover:text-stone-900 underline"
            >
              Clear Gallery
            </button>
          )}
        </div>

        {snapshots.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
            <p className="text-sm text-stone-600">
              No snapshots captured in this session yet. Click <strong>Snapshot</strong> on any camera feed above to capture a timestamped frame.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {snapshots.map((snap) => (
              <div key={snap.id} className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                <img
                  src={snap.dataUrl}
                  alt={snap.cameraName}
                  className="w-full aspect-video object-cover border-b border-stone-200"
                />
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-stone-900 truncate">{snap.cameraName}</div>
                    <div className="text-[11px] font-mono text-stone-500">{snap.timestamp}</div>
                  </div>
                  <a
                    href={snap.dataUrl}
                    download={`${snap.id}.png`}
                    className="p-1.5 text-stone-700 hover:text-stone-900 bg-stone-100 rounded-md shrink-0"
                    title="Download PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
