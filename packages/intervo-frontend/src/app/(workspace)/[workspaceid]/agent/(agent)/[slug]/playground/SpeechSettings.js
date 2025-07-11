import { useEffect, useState, useMemo, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AudioLines, Plus, X, Info } from "lucide-react";
import { usePlayground } from "@/context/AgentContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SpeechSettings() {
  const { setAIConfig, aiConfig = {}, updateAIConfig } = usePlayground();
  const [formState, setFormState] = useState(aiConfig);

  // Separate refs to track initialization for each useEffect
  const responseThresholdInitialized = useRef(false);
  const lexicalEnhancementInitialized = useRef(false);

  const speechSettings = useMemo(
    () => [
      "ambientAudio",
      "responseThreshold",
      "conversationalFeedback",
      "utteranceOptimization",
      "lexicalEnhancement",
      "sttSettings",
    ],
    []
  );

  useEffect(() => {
    const currentSettings = Object.fromEntries(
      speechSettings.map((key) => [key, formState[key]])
    );

    const prevSettings = Object.fromEntries(
      speechSettings.map((key) => [key, aiConfig[key]])
    );

    if (JSON.stringify(currentSettings) !== JSON.stringify(prevSettings)) {
      setAIConfig({ ...aiConfig, ...currentSettings });
    }
  }, [formState, aiConfig, speechSettings]);

  //=============== responseThreshold change
  const [responseThreshold, setResponseThreshold] = useState(
    formState.interactionSettings?.responseThreshold
  );
  const handleResponseThresholdChange = (value) => {
    setResponseThreshold(value / 100);

    setFormState((prev) => ({
      ...prev,
      interactionSettings: {
        ...prev.interactionSettings,
        responseThreshold: value / 100,
      },
    }));
  };

  useEffect(() => {
    // Skip on initial render
    if (!responseThresholdInitialized.current) {
      responseThresholdInitialized.current = true;
      return;
    }

    const pushData = setTimeout(() => {
      if (
        responseThreshold === aiConfig?.interactionSettings?.responseThreshold
      ) {
        return;
      }

      let currentSettings = Object.fromEntries(
        speechSettings
          .slice(0, 5)
          .map((key) => [key, formState.interactionSettings[key]])
      );
      currentSettings.responseThreshold = responseThreshold;
      updateAIConfig({
        interactionSettings: currentSettings,
      });
    }, 500);

    return () => clearTimeout(pushData);
  }, [responseThreshold]);

  //================= Lexical Enhancement
  const [lexicalEnhancement, setLexicalEnhancement] = useState(
    formState.interactionSettings?.lexicalEnhancement || {
      terms: [],
      enabled: false,
    }
  );

  const handleLexicalEnhancementChange = (newTerms) => {
    const updatedEnhancement = {
      terms: newTerms,
      enabled: newTerms.length > 0,
    };
    setLexicalEnhancement(updatedEnhancement);
  };

  const addLexicalTerm = () => {
    const newTerms = [
      ...lexicalEnhancement.terms,
      { word: "", pronunciation: "" },
    ];
    handleLexicalEnhancementChange(newTerms);
  };

  const removeLexicalTerm = (index) => {
    const newTerms = lexicalEnhancement.terms.filter((_, i) => i !== index);
    handleLexicalEnhancementChange(newTerms);
  };

  const updateLexicalTerm = (index, field, value) => {
    const newTerms = lexicalEnhancement.terms.map((term, i) =>
      i === index ? { ...term, [field]: value } : term
    );
    handleLexicalEnhancementChange(newTerms);
  };

  useEffect(() => {
    // Skip on initial render
    if (!lexicalEnhancementInitialized.current) {
      lexicalEnhancementInitialized.current = true;
      return;
    }

    const pushData = setTimeout(() => {
      if (
        lexicalEnhancement === aiConfig?.interactionSettings?.lexicalEnhancement
      ) {
        return;
      }

      let currentSettings = Object.fromEntries(
        speechSettings
          .slice(0, 5)
          .map((key) => [key, formState.interactionSettings[key]])
      );
      currentSettings.lexicalEnhancement = lexicalEnhancement;
      updateAIConfig({
        interactionSettings: currentSettings,
      });
    }, 500);

    return () => clearTimeout(pushData);
  }, [lexicalEnhancement]);

  //================= RawTranscriptionMode change
  const handleRawTranscriptionModeChange = (value) => {
    updateAIConfig({
      sttSettings: {
        service: aiConfig.sttSettings.service,
        rawTranscriptionMode: value,
      },
    });
    setFormState((prev) => ({
      ...prev,
      sttSettings: {
        ...prev.sttSettings,
        rawTranscriptionMode: value,
      },
    }));
  };

  const handleStateChange = (value, field) => {
    let currentSettings = Object.fromEntries(
      speechSettings
        .slice(0, 5)
        .map((key) => [key, formState.interactionSettings[key]])
    );
    currentSettings[field] = value;
    updateAIConfig({
      interactionSettings: currentSettings,
    });

    const newState = {
      ...formState,
      interactionSettings: {
        ...formState.interactionSettings,
        [field]: value,
      },
    };

    setFormState(newState);
  };

  return (
    <TooltipProvider>
      <Card className="p-6 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <AudioLines className="w-6 h-6" />
          <span className="text-md font-semibold">Interaction</span>
        </div>

        <Separator />

        {/* //Ambient Audio
      <div className="space-y-2">
        <Label className="font-semibold">Ambient Audio</Label>
        <Select
          onValueChange={(value) => handleStateChange(value, "ambientAudio")}
          value={formState.interactionSettings?.ambientAudio || "None"}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">None</SelectItem>
            <SelectItem value="Background1">Ambient Soundscape 1</SelectItem>
            <SelectItem value="Background2">Ambient Soundscape 2</SelectItem>
          </SelectContent>
        </Select>
      </div> */}

        {/* Response Threshold */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">Response Threshold</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Controls how quickly the AI responds when you interrupt it.
                  Lower values make the AI more responsive to interruptions,
                  while higher values allow the AI to continue speaking longer
                  before responding to voice input.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">
            Adjust the AI&apos;s responsiveness to voice input interruptions
            during dialogue.
          </p>
          <Slider
            value={[responseThreshold * 100 || 50]}
            onValueChange={(value) => handleResponseThresholdChange(value[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Conversational Feedback */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Label className="font-semibold">Conversational Feedback</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    When enabled, the AI will provide subtle verbal cues like
                    &quot;mm-hmm&quot;, &quot;I see&quot;, or &quot;okay&quot;
                    while you&apos;re speaking to show it&apos;s actively
                    listening, creating a more natural conversation flow.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">
              Enables natural dialogue indicators through brief verbal
              acknowledgments during user speech.
            </p>
          </div>
          <Switch
            checked={
              formState.interactionSettings?.conversationalFeedback || false
            }
            onCheckedChange={(value) =>
              handleStateChange(value, "conversationalFeedback")
            }
          />
        </div>

        {/* Lexical Enhancement */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">Lexical Enhancement</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Helps the AI better recognize and pronounce technical terms,
                  brand names, or industry-specific words that might be
                  mispronounced or misunderstood during conversations. Essential
                  for domains like healthcare, finance, or technology.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">
            Add domain-specific terminology with custom pronunciations to
            optimize speech recognition accuracy.
          </p>

          <div className="space-y-3">
            {lexicalEnhancement.terms.map((term, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Word (e.g., Algorithm)"
                    value={term.word}
                    onChange={(e) =>
                      updateLexicalTerm(index, "word", e.target.value)
                    }
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Pronunciation (e.g., al-go-rith-um)"
                    value={term.pronunciation}
                    onChange={(e) =>
                      updateLexicalTerm(index, "pronunciation", e.target.value)
                    }
                    className="w-full"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeLexicalTerm(index)}
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLexicalTerm}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Term
            </Button>
          </div>
        </div>

        {/* Utterance Optimization */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Label className="font-semibold">Utterance Optimization</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Converts text like &quot;$100&quot; to &quot;one hundred
                    dollars&quot;, &quot;3:30 PM&quot; to &quot;three thirty
                    PM&quot;, and &quot;123&quot; to &quot;one hundred
                    twenty-three&quot; for more natural-sounding speech output.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">
              Automatically standardizes numerical values, currency notation,
              and temporal references for natural speech output.
            </p>
          </div>
          <Switch
            checked={
              formState.interactionSettings?.utteranceOptimization || false
            }
            onCheckedChange={(value) =>
              handleStateChange(value, "utteranceOptimization")
            }
          />
        </div>

        {/* Raw Transcription Mode */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Label className="font-semibold">Raw Transcription Mode</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    When enabled, speech-to-text will provide exactly what was
                    spoken without any processing - useful for capturing exact
                    phrases, technical dictation, or when you need verbatim
                    transcription without AI interpretation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">
              Preserves literal transcription output without automatic
              formatting adjustments.
            </p>
          </div>
          <Switch
            checked={formState.sttSettings?.rawTranscriptionMode || false}
            onCheckedChange={(value) => handleRawTranscriptionModeChange(value)}
          />
        </div>
      </Card>
    </TooltipProvider>
  );
}
