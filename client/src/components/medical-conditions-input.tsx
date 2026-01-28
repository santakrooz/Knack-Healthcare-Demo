import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, parseListField, serializeListField } from "@/lib/utils";
import { Loader2, Stethoscope, X } from "lucide-react";

interface ConditionSettings {
  showIcd10: boolean;
  showIcd9: boolean;
  codePosition: "prefix" | "append";
}

function getConditionSettings(): ConditionSettings {
  try {
    const saved = localStorage.getItem("medportal_condition_settings");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return { showIcd10: false, showIcd9: false, codePosition: "append" };
}

interface ConditionSuggestion {
  name: string;
  icd10?: string;
  icd9?: string;
}

function formatConditionWithCodes(
  name: string, 
  icd10?: string, 
  icd9?: string, 
  settings?: ConditionSettings
): string {
  const s = settings || getConditionSettings();
  
  if (!s.showIcd10 && !s.showIcd9) {
    return name;
  }

  const codes: string[] = [];
  if (s.showIcd10 && icd10) {
    codes.push(`ICD-10: ${icd10}`);
  }
  if (s.showIcd9 && icd9) {
    codes.push(`ICD-9: ${icd9}`);
  }

  if (codes.length === 0) {
    return name;
  }

  const codeStr = codes.join(" | ");
  
  if (s.codePosition === "prefix") {
    return `${codeStr} - ${name}`;
  } else {
    return `${name} [${codeStr}]`;
  }
}

interface MedicalConditionsInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MedicalConditionsInput({
  value,
  onChange,
  placeholder = "Search for medical condition...",
  className,
}: MedicalConditionsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<ConditionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Derive conditions from the value prop to avoid sync issues
  const conditions = parseListField(value);

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
        // Request extra fields for ICD codes
        const response = await fetch(
          `https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=${encodeURIComponent(inputValue)}&maxList=10&ef=icd10cm_codes,icd9cm_codes`
        );
        const data = await response.json();
        
        // API response format: [count, codes, extras, display_names]
        // extras (index 2) contains the extra fields we requested
        const displayNamesRaw = data[3];
        const extras = data[2] || {};
        const icd10Codes = extras.icd10cm_codes || [];
        const icd9Codes = extras.icd9cm_codes || [];
        
        if (displayNamesRaw && displayNamesRaw.length > 0) {
          const conditionSuggestions: ConditionSuggestion[] = displayNamesRaw.map(
            (item: string | string[], index: number) => {
              const name = Array.isArray(item) ? item[0] : item;
              // ICD codes are returned as simple arrays, one code per result
              const icd10 = icd10Codes[index] || undefined;
              const icd9 = icd9Codes[index] || undefined;
              return { name, icd10, icd9 };
            }
          ).filter((s: ConditionSuggestion) => s.name);
          
          // Filter out already selected conditions (check base name)
          const filtered = conditionSuggestions.filter(
            (s: ConditionSuggestion) => !conditions.some(c => c.includes(s.name) || s.name.includes(c.split(" [")[0]))
          );
          setSuggestions(filtered);
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching condition suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, value]);

  const addConditionText = (conditionText: string) => {
    const trimmed = conditionText.trim();
    if (!trimmed || conditions.includes(trimmed)) return;
    
    const newConditions = [...conditions, trimmed];
    onChange(serializeListField(newConditions));
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onChange(serializeListField(newConditions));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ".") {
      e.preventDefault();
      if (inputValue.trim()) {
        addConditionText(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && conditions.length > 0) {
      removeCondition(conditions.length - 1);
    }
  };

  const handleSelectSuggestion = (suggestion: ConditionSuggestion) => {
    const settings = getConditionSettings();
    const formatted = formatConditionWithCodes(suggestion.name, suggestion.icd10, suggestion.icd9, settings);
    addConditionText(formatted);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {conditions.map((condition, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              data-testid={`condition-tag-${index}`}
            >
              <span className="max-w-[200px] truncate">{condition}</span>
              <button
                type="button"
                onClick={() => removeCondition(index)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                data-testid={`button-remove-condition-${index}`}
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
          placeholder={conditions.length > 0 ? "Add another condition..." : placeholder}
          className="pr-10"
          data-testid="input-medical-condition"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="cursor-pointer px-3 py-2 text-sm hover-elevate"
                data-testid={`suggestion-condition-${index}`}
              >
                <div className="font-medium">{suggestion.name}</div>
                {(suggestion.icd10 || suggestion.icd9) && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {suggestion.icd10 && <span>ICD-10: {suggestion.icd10}</span>}
                    {suggestion.icd10 && suggestion.icd9 && <span> | </span>}
                    {suggestion.icd9 && <span>ICD-9: {suggestion.icd9}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {inputValue.length >= 2 && !loading && suggestions.length === 0 && isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div
            className="cursor-pointer px-3 py-2 text-sm hover-elevate"
            onClick={() => addConditionText(inputValue)}
            data-testid="add-custom-condition"
          >
            <span className="text-muted-foreground">Add: </span>
            <span className="font-medium">{inputValue}</span>
          </div>
        </div>
      )}

      <p className="mt-1.5 text-xs text-muted-foreground">
        Type to search conditions, or enter your own. Press Enter, comma, or period to add.
      </p>
    </div>
  );
}
