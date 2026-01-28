import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, parseListField, serializeListField } from "@/lib/utils";
import { Loader2, ClipboardList, X } from "lucide-react";

interface DiagnosisSettings {
  showCode: boolean;
  codePosition: "prefix" | "append";
}

function getDiagnosisSettings(): DiagnosisSettings {
  try {
    const saved = localStorage.getItem("medportal_diagnosis_settings");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return { showCode: true, codePosition: "prefix" };
}

function formatDiagnosis(code: string, description: string, settings?: DiagnosisSettings): string {
  const s = settings || getDiagnosisSettings();
  
  if (!s.showCode) {
    return description;
  }
  
  if (s.codePosition === "prefix") {
    return `${code} - ${description}`;
  } else {
    return `${description} [${code}]`;
  }
}

interface DiagnosisInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface ICD10Result {
  code: string;
  description: string;
}

export function DiagnosisInput({
  value,
  onChange,
  placeholder = "Search ICD-10-CM diagnosis codes...",
  className,
}: DiagnosisInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<ICD10Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const diagnoses = parseListField(value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(inputValue)}&maxList=10`
        );
        const data = await response.json();
        
        const codes = data[1] || [];
        const displayData = data[3] || [];
        const settings = getDiagnosisSettings();
        
        const results: ICD10Result[] = [];
        for (let i = 0; i < codes.length; i++) {
          const code = codes[i];
          const displayArr = displayData[i];
          const description = Array.isArray(displayArr) && displayArr.length > 1 ? displayArr[1] : displayArr?.[0] || code;
          const formattedText = formatDiagnosis(code, description, settings);
          
          // Check if already added (match by code or formatted text)
          if (!diagnoses.some(d => d.includes(code) || d === formattedText)) {
            results.push({ code, description });
          }
        }
        
        setSuggestions(results);
        setIsOpen(true);
      } catch (error) {
        console.error("Error fetching ICD-10 suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, value]);

  const addDiagnosis = (diagnosis: string) => {
    const trimmed = diagnosis.trim();
    if (!trimmed || diagnoses.includes(trimmed)) return;
    
    const newDiagnoses = [...diagnoses, trimmed];
    onChange(serializeListField(newDiagnoses));
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const removeDiagnosis = (index: number) => {
    const newDiagnoses = diagnoses.filter((_, i) => i !== index);
    onChange(serializeListField(newDiagnoses));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ".") {
      e.preventDefault();
      if (inputValue.trim()) {
        addDiagnosis(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && diagnoses.length > 0) {
      removeDiagnosis(diagnoses.length - 1);
    }
  };

  const handleSelectSuggestion = (suggestion: ICD10Result) => {
    const settings = getDiagnosisSettings();
    const formatted = formatDiagnosis(suggestion.code, suggestion.description, settings);
    addDiagnosis(formatted);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {diagnoses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {diagnoses.map((diagnosis, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              data-testid={`diagnosis-tag-${index}`}
            >
              <span className="max-w-[250px] truncate">{diagnosis}</span>
              <button
                type="button"
                onClick={() => removeDiagnosis(index)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                data-testid={`button-remove-diagnosis-${index}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={diagnoses.length > 0 ? "Add another diagnosis..." : placeholder}
          className="pr-10"
          data-testid="input-diagnosis"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {suggestions.map((suggestion, index) => {
              const settings = getDiagnosisSettings();
              return (
                <li
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="cursor-pointer px-3 py-2 text-sm hover-elevate"
                  data-testid={`suggestion-diagnosis-${index}`}
                >
                  <div className="font-medium">{suggestion.description}</div>
                  {settings.showCode && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ICD-10: {suggestion.code}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {inputValue.length >= 2 && !loading && suggestions.length === 0 && isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div
            className="cursor-pointer px-3 py-2 text-sm hover-elevate"
            onClick={() => addDiagnosis(inputValue)}
            data-testid="add-custom-diagnosis"
          >
            <span className="text-muted-foreground">Add: </span>
            <span className="font-medium">{inputValue}</span>
          </div>
        </div>
      )}

      <p className="mt-1.5 text-xs text-muted-foreground">
        Search ICD-10-CM codes or enter freeform text. Press Enter, comma, or period to add.
      </p>
    </div>
  );
}
