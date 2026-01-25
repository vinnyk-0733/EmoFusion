import { useRef, useCallback } from 'react';
import { Settings, Palette, Camera, CameraOff, Eye, Type, Volume2, VolumeX, Check, Moon, Sun, RotateCcw, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const themeGridRef = useRef(null);

  const handleThemeKeyDown = useCallback((e) => {
    const buttons = themeGridRef.current?.querySelectorAll('button');
    if (!buttons) return;
    const currentIndex = Array.from(buttons).findIndex((btn) => btn === document.activeElement);
    let nextIndex = currentIndex;
    switch (e.key) {
      case 'ArrowRight': nextIndex = (currentIndex + 1) % buttons.length; e.preventDefault(); break;
      case 'ArrowLeft': nextIndex = (currentIndex - 1 + buttons.length) % buttons.length; e.preventDefault(); break;
      case 'ArrowDown': nextIndex = Math.min(currentIndex + 2, buttons.length - 1); e.preventDefault(); break;
      case 'ArrowUp': nextIndex = Math.max(currentIndex - 2, 0); e.preventDefault(); break;
      case 'Home': nextIndex = 0; e.preventDefault(); break;
      case 'End': nextIndex = buttons.length - 1; e.preventDefault(); break;
      default: return;
    }
    buttons[nextIndex]?.focus();
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
          <section aria-labelledby="theme-heading">
            <div className="flex items-center gap-2 mb-4"><Palette className="h-5 w-5 text-primary" /><h3 id="theme-heading" className="text-base font-semibold text-foreground">Theme</h3></div>
            <div className="space-y-3" role="radiogroup" aria-labelledby="theme-heading">
              {THEMES.map((theme) => (
                <SettingCard
                  key={theme.id}
                  icon={<span className="text-xl">{theme.icon}</span>}
                  label={theme.name}
                  description={theme.description}
                  htmlFor={`theme-${theme.id}`}
                >
                  <Switch
                    id={`theme-${theme.id}`}
                    checked={currentTheme === theme.id}
                    onCheckedChange={(checked) => {
                      if (checked) onThemeChange(theme.id);
                    }}
                    aria-label={`Select ${theme.name} theme`}
                    role="radio"
                    aria-checked={currentTheme === theme.id}
                  />
                </SettingCard>
              ))}
            </div>
          </section>
          <section aria-labelledby="camera-heading">
            <div className="flex items-center gap-2 mb-4"><Camera className="h-5 w-5 text-primary" /><h3 id="camera-heading" className="text-base font-semibold text-foreground">Camera</h3></div>
            <SettingCard icon={cameraOn ? <Camera className="h-5 w-5 text-primary" /> : <CameraOff className="h-5 w-5 text-muted-foreground" />} label="Emotion Detection Camera" description="Enable facial emotion recognition" htmlFor="camera-toggle"><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{cameraOn ? 'On' : 'Off'}</span><Switch id="camera-toggle" checked={cameraOn} onCheckedChange={onCameraToggle} aria-describedby="camera-toggle-desc" /></div></SettingCard>
          </section>
          {voices.length > 0 && onVoiceChange && (
            <section aria-labelledby="voice-heading">
              <div className="flex items-center gap-2 mb-4"><Mic className="h-5 w-5 text-primary" /><h3 id="voice-heading" className="text-base font-semibold text-foreground">Voice</h3></div>
              <div className="glass-card p-4 rounded-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background" role="group" aria-labelledby="voice-select-label">
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><Volume2 className="h-5 w-5 text-muted-foreground" /><div className="flex-1"><Label id="voice-select-label" htmlFor="voice-select" className="text-sm font-medium">Text-to-Speech Voice</Label><p id="voice-select-desc" className="text-xs text-muted-foreground">Choose the voice for AI responses</p></div></div>
                  <Select value={selectedVoiceURI || 'default'} onValueChange={(value) => onVoiceChange(value === 'default' ? '' : value)}><SelectTrigger id="voice-select" className="w-full" aria-describedby="voice-select-desc"><SelectValue placeholder="Select a voice" /></SelectTrigger><SelectContent><SelectItem value="default">System Default</SelectItem>{voices.map((voice) => <SelectItem key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
            </section>
          )}
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
