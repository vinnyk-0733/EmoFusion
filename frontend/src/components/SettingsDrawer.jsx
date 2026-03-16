import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Settings, Palette, Camera, CameraOff, Eye, Type, Volume2, VolumeX, Check, Moon, Sun, RotateCcw, Mic, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { THEMES } from '@/types/theme';
import { useAccessibility } from '@/context/AccessibilityContext';

const SettingCard = ({ icon, label, description, htmlFor, children }) => (
  <label htmlFor={htmlFor} className="glass-card p-4 rounded-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background transition-colors duration-200 cursor-pointer flex items-center justify-between" role="group" aria-labelledby={`${htmlFor}-label`}>
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <span id={`${htmlFor}-label`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
          {label}
        </span>
        <p id={`${htmlFor}-desc`} className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
    {children}
  </label>
);

const SettingsDrawer = ({ currentTheme, onThemeChange, cameraOn, onCameraToggle, voices = [], selectedVoiceURI, onVoiceChange, open, onOpenChange }) => {
  const { settings, updateSetting, resetSettings } = useAccessibility();
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [voiceExpanded, setVoiceExpanded] = useState(false);
  const [themeSearch, setThemeSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const themeRef = useRef(null);
  const voiceRef = useRef(null);

  const currentThemeData = THEMES.find(t => t.id === currentTheme);
  const currentVoiceName = voices.find(v => v.voiceURI === selectedVoiceURI)?.name || 'System Default';

  // 500ms debounce for theme search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(themeSearch), 500);
    return () => clearTimeout(timer);
  }, [themeSearch]);

  const filteredThemes = useMemo(() => {
    if (!debouncedSearch.trim()) return THEMES;
    const q = debouncedSearch.toLowerCase();
    return THEMES.filter(t => t.name.toLowerCase().includes(q));
  }, [debouncedSearch]);

  // Click outside to close theme/voice dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeExpanded(false);
        setThemeSearch('');
        setDebouncedSearch('');
      }
      if (voiceRef.current && !voiceRef.current.contains(e.target)) {
        setVoiceExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle settings" className="relative h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:shadow-glow focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          <Settings className="h-5 w-5 text-primary" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[400px] overflow-y-auto no-scrollbar bg-card border-border z-[150] fixed top-0 right-0 h-full transition-transform duration-500 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right" aria-describedby="settings-description">
        <SheetHeader className="mb-6"><SheetTitle className="text-xl gradient-text">Settings</SheetTitle><SheetDescription id="settings-description">Customize your experience with themes, camera, and accessibility options.</SheetDescription></SheetHeader>
        <div className="space-y-8" role="main">

          {/* Theme Section */}
          <section aria-labelledby="theme-heading" ref={themeRef}>
            <div className="flex items-center gap-2 mb-4"><Palette className="h-5 w-5 text-primary" /><h3 id="theme-heading" className="text-base font-semibold text-foreground">Theme</h3></div>

            {/* Current theme / search input - entire div is clickable */}
            <div
              onClick={() => { if (!themeExpanded) { setThemeExpanded(true); setThemeSearch(''); setDebouncedSearch(''); } }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/30 transition-colors ${!themeExpanded ? 'cursor-pointer hover:bg-secondary/50' : ''}`}
            >
              <span className="text-lg flex-shrink-0">{currentThemeData?.icon}</span>
              {themeExpanded ? (
                <input
                  type="text"
                  placeholder="Search themes..."
                  value={themeSearch}
                  onChange={(e) => setThemeSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-left text-sm font-medium text-foreground">{currentThemeData?.name}</span>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${themeExpanded ? 'rotate-180' : ''}`} />
            </div>

            {/* Expandable theme list */}
            {themeExpanded && (
              <div className="mt-2 rounded-xl border border-border bg-secondary/20">
                <div className="max-h-[260px] overflow-y-auto no-scrollbar">
                  {filteredThemes.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">No themes found</div>
                  ) : (
                    filteredThemes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          onThemeChange(theme.id);
                          setThemeExpanded(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 transition-colors hover:bg-secondary/50 ${currentTheme === theme.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                          }`}
                      >
                        <span className="text-sm flex-shrink-0">{theme.icon}</span>
                        <span className="flex-1 text-left text-sm font-medium text-foreground truncate">{theme.name}</span>
                        {theme.colors && (
                          <div className="flex gap-1 flex-shrink-0">
                            <div className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: theme.colors.bg }} />
                            <div className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: theme.colors.primary }} />
                            <div className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: theme.colors.accent }} />
                          </div>
                        )}
                        {currentTheme === theme.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Camera Section */}
          <section aria-labelledby="camera-heading">
            <div className="flex items-center gap-2 mb-4"><Camera className="h-5 w-5 text-primary" /><h3 id="camera-heading" className="text-base font-semibold text-foreground">Camera</h3></div>
            <SettingCard icon={cameraOn ? <Camera className="h-5 w-5 text-primary" /> : <CameraOff className="h-5 w-5 text-muted-foreground" />} label="Emotion Detection Camera" description="Enable facial emotion recognition" htmlFor="camera-toggle"><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{cameraOn ? 'On' : 'Off'}</span><Switch id="camera-toggle" checked={cameraOn} onCheckedChange={onCameraToggle} aria-describedby="camera-toggle-desc" /></div></SettingCard>
          </section>

          {/* Voice Section - custom expandable list */}
          {voices.length > 0 && onVoiceChange && (
            <section aria-labelledby="voice-heading" ref={voiceRef}>
              <div className="flex items-center gap-2 mb-4"><Mic className="h-5 w-5 text-primary" /><h3 id="voice-heading" className="text-base font-semibold text-foreground">Voice</h3></div>

              <div
                onClick={() => { if (!voiceExpanded) setVoiceExpanded(true); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30 transition-colors ${!voiceExpanded ? 'cursor-pointer hover:bg-secondary/50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground truncate">{currentVoiceName}</div>
                    <div className="text-xs text-muted-foreground">Text-to-Speech Voice</div>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${voiceExpanded ? 'rotate-180' : ''}`} />
              </div>

              {voiceExpanded && (
                <div className="mt-2 max-h-[220px] overflow-y-auto rounded-xl border border-border bg-secondary/20 no-scrollbar">
                  <button
                    onClick={() => { onVoiceChange(''); setVoiceExpanded(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/50 ${!selectedVoiceURI ? 'bg-primary/10 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                      }`}
                  >
                    <span className="text-sm text-foreground">System Default</span>
                    {!selectedVoiceURI && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </button>
                  {voices.map((voice) => (
                    <button
                      key={voice.voiceURI}
                      onClick={() => { onVoiceChange(voice.voiceURI); setVoiceExpanded(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/50 ${selectedVoiceURI === voice.voiceURI ? 'bg-primary/10 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                        }`}
                    >
                      <span className="text-sm text-foreground truncate">{voice.name} ({voice.lang})</span>
                      {selectedVoiceURI === voice.voiceURI && <Check className="h-4 w-4 text-primary ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Accessibility Section */}
          <section aria-labelledby="accessibility-heading">
            <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /><h3 id="accessibility-heading" className="text-base font-semibold text-foreground">Accessibility</h3></div><Button variant="ghost" size="sm" onClick={resetSettings} aria-label="Reset all accessibility settings to default" className="text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"><RotateCcw className="h-3 w-3 mr-1" />Reset</Button></div>
            <div className="space-y-4" role="group" aria-labelledby="accessibility-heading">
              <SettingCard icon={<Moon className="h-5 w-5 text-muted-foreground" />} label="Reduced Motion" description="Disable all animations" htmlFor="reduced-motion"><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{settings.reducedMotion ? 'On' : 'Off'}</span><Switch id="reduced-motion" checked={settings.reducedMotion} onCheckedChange={(checked) => updateSetting('reducedMotion', checked)} aria-describedby="reduced-motion-desc" /></div></SettingCard>
              <SettingCard icon={<Sun className="h-5 w-5 text-muted-foreground" />} label="High Contrast" description="Black/white with yellow accents" htmlFor="high-contrast"><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{settings.highContrast ? 'On' : 'Off'}</span><Switch id="high-contrast" checked={settings.highContrast} onCheckedChange={(checked) => updateSetting('highContrast', checked)} aria-describedby="high-contrast-desc" /></div></SettingCard>
              <SettingCard icon={<Type className="h-5 w-5 text-muted-foreground" />} label="Large Text" description="Minimum 125% font size" htmlFor="large-text"><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{settings.largeText ? 'On' : 'Off'}</span><Switch id="large-text" checked={settings.largeText} onCheckedChange={(checked) => updateSetting('largeText', checked)} aria-describedby="large-text-desc" /></div></SettingCard>
              <SettingCard icon={settings.soundEnabled ? <Volume2 className="h-5 w-5 text-muted-foreground" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />} label="Sound Effects" description="Enable notification sounds" htmlFor="sound-toggle"><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{settings.soundEnabled ? 'On' : 'Off'}</span><Switch id="sound-toggle" checked={settings.soundEnabled} onCheckedChange={(checked) => updateSetting('soundEnabled', checked)} aria-describedby="sound-toggle-desc" /></div></SettingCard>
              <div className="glass-card p-4 rounded-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background" role="group" aria-labelledby="font-size-label">
                <div className="space-y-4"><div className="flex items-center gap-3"><Type className="h-5 w-5 text-muted-foreground" /><div className="flex-1"><Label id="font-size-label" htmlFor="font-size-slider" className="text-sm font-medium">Font Size: {settings.fontSize}%</Label><p id="font-size-desc" className="text-xs text-muted-foreground">Adjust the base font size</p></div></div><Slider id="font-size-slider" value={[settings.fontSize]} onValueChange={([value]) => updateSetting('fontSize', value)} min={75} max={150} step={5} className="w-full" aria-labelledby="font-size-label" aria-describedby="font-size-desc" /><div className="flex justify-between text-xs text-muted-foreground"><span>75%</span><span>100%</span><span>150%</span></div></div>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsDrawer;
