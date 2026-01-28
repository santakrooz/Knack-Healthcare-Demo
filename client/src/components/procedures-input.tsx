import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, parseListField, serializeListField } from "@/lib/utils";
import { Loader2, Scissors, X } from "lucide-react";

interface ProcedureSettings {
  showCode: boolean;
  codePosition: "prefix" | "append";
}

function getProcedureSettings(): ProcedureSettings {
  try {
    const saved = localStorage.getItem("medportal_procedure_settings");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return { showCode: true, codePosition: "prefix" };
}

function formatProcedure(code: string, description: string, settings?: ProcedureSettings): string {
  const s = settings || getProcedureSettings();
  
  if (!s.showCode) {
    return description;
  }
  
  if (s.codePosition === "prefix") {
    return `${code} - ${description}`;
  } else {
    return `${description} [${code}]`;
  }
}

interface ProceduresInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface HCPCSResult {
  code: string;
  description: string;
}

export function ProceduresInput({
  value,
  onChange,
  placeholder = "Search HCPCS procedure codes...",
  className,
}: ProceduresInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<HCPCSResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const procedures = parseListField(value);

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
          `https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search?terms=${encodeURIComponent(inputValue)}&maxList=10`
        );
        const data = await response.json();
        
        const codes = data[1] || [];
        const displayData = data[3] || [];
        const settings = getProcedureSettings();
        
        const results: HCPCSResult[] = [];
        for (let i = 0; i < codes.length; i++) {
          const code = codes[i];
          const displayArr = displayData[i];
          const description = Array.isArray(displayArr) && displayArr.length > 1 ? displayArr[1] : displayArr?.[0] || code;
          const formattedText = formatProcedure(code, description, settings);
          
          // Check if already added (match by code or formatted text)
          if (!procedures.some(p => p.includes(code) || p === formattedText)) {
            results.push({ code, description });
          }
        }
        
        setSuggestions(results);
        setIsOpen(true);
      } catch (error) {
        console.error("Error fetching HCPCS suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, value]);

  const addProcedure = (procedure: string) => {
    const trimmed = procedure.trim();
    if (!trimmed || procedures.includes(trimmed)) return;
    
    const newProcedures = [...procedures, trimmed];
    onChange(serializeListField(newProcedures));
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const removeProcedure = (index: number) => {
    const newProcedures = procedures.filter((_, i) => i !== index);
    onChange(serializeListField(newProcedures));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ".") {
      e.preventDefault();
      if (inputValue.trim()) {
        addProcedure(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && procedures.length > 0) {
      removeProcedure(procedures.length - 1);
    }
  };

  const handleSelectSuggestion = (suggestion: HCPCSResult) => {
    const settings = getProcedureSettings();
    const formatted = formatProcedure(suggestion.code, suggestion.description, settings);
    addProcedure(formatted);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {procedures.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {procedures.map((procedure, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              data-testid={`procedure-tag-${index}`}
            >
              <span className="max-w-[250px] truncate">{procedure}</span>
              <button
                type="button"
                onClick={() => removeProcedure(index)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                data-testid={`button-remove-procedure-${index}`}
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
          placeholder={procedures.length > 0 ? "Add another procedure..." : placeholder}
          className="pr-10"
          data-testid="input-procedure"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Scissors className="h-4 w-4 text-muted-foreground" />
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
                data-testid={`suggestion-procedure-${index}`}
              >
                <div className="font-medium">{suggestion.description}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  HCPCS: {suggestion.code}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {inputValue.length >= 2 && !loading && suggestions.length === 0 && isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div
            className="cursor-pointer px-3 py-2 text-sm hover-elevate"
            onClick={() => addProcedure(inputValue)}
            data-testid="add-custom-procedure"
          >
            <span className="text-muted-foreground">Add: </span>
            <span className="font-medium">{inputValue}</span>
          </div>
        </div>
      )}

      <p className="mt-1.5 text-xs text-muted-foreground">
        Search HCPCS codes or enter freeform text. Press Enter, comma, or period to add.
      </p>
    </div>
  );
}
