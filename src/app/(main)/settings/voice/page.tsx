import { VoicePromptCustomizer } from '@/components/voice-prompt-customizer';

export default function VoiceSettingsPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Voice Prompts</h1>
        <p className="text-muted-foreground">Customize your audio reminders.</p>
      </header>
      <VoicePromptCustomizer />
    </div>
  );
}
