import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, parseListField, serializeListField } from "@/lib/utils";
import { Loader2, Activity, X } from "lucide-react";

interface PhenotypeSettings {
  showCode: boolean;
  codePosition: "prefix" | "append";
}

function getPhenotypeSettings(): PhenotypeSettings {
  try {
    const saved = localStorage.getItem("medportal_phenotype_settings");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return { showCode: true, codePosition: "prefix" };
}

function formatPhenotype(code: string, description: string, settings?: PhenotypeSettings): string {
  const s = settings || getPhenotypeSettings();
  
  if (!s.showCode) {
    return description;
  }
  
  if (s.codePosition === "prefix") {
    return `${code} - ${description}`;
  } else {
    return `${description} [${code}]`;
  }
}

interface PhenotypesInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface HPOResult {
  id: string;
  description: string;
}

export function PhenotypesInput({
  value,
  onChange,
  placeholder = "Search symptoms/phenotypes (HPO)...",
  className,
}: PhenotypesInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<HPOResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const phenotypes = parseListField(value);

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
          `https://clinicaltables.nlm.nih.gov/api/hpo/v3/search?terms=${encodeURIComponent(inputValue)}&maxList=10`
        );
        const data = await response.json();
        
        const ids = data[1] || [];
        const displayData = data[3] || [];
        const settings = getPhenotypeSettings();
        
        const results: HPOResult[] = [];
        for (let i = 0; i < ids.length; i++) {
          const id = ids[i];
          const displayArr = displayData[i];
          const description = Array.isArray(displayArr) && displayArr.length > 1 ? displayArr[1] : displayArr?.[0] || id;
          const formattedText = formatPhenotype(id, description, settings);
          
          // Check if already added (match by code or formatted text)
          if (!phenotypes.some(p => p.includes(id) || p === formattedText)) {
            results.push({ id, description });
          }
        }
        
        setSuggestions(results);
        setIsOpen(true);
      } catch (error) {
        console.error("Error fetching HPO suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, value]);

  const addPhenotype = (phenotype: string) => {
    const trimmed = phenotype.trim();
    if (!trimmed || phenotypes.includes(trimmed)) return;
    
    const newPhenotypes = [...phenotypes, trimmed];
    onChange(serializeListField(newPhenotypes));
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const removePhenotype = (index: number) => {
    const newPhenotypes = phenotypes.filter((_, i) => i !== index);
    onChange(serializeListField(newPhenotypes));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ".") {
      e.preventDefault();
      if (inputValue.trim()) {
        addPhenotype(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && phenotypes.length > 0) {
      removePhenotype(phenotypes.length - 1);
    }
  };

  const handleSelectSuggestion = (suggestion: HPOResult) => {
    const settings = getPhenotypeSettings();
    const formatted = formatPhenotype(suggestion.id, suggestion.description, settings);
    addPhenotype(formatted);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {phenotypes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {phenotypes.map((phenotype, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-sm py-1 px-2 flex items-center gap-1"
              data-testid={`badge-phenotype-${index}`}
            >
              <span className="max-w-[300px] truncate">{phenotype}</span>
              <button
                type="button"
                onClick={() => removePhenotype(index)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                data-testid={`button-remove-phenotype-${index}`}
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
          placeholder={phenotypes.length > 0 ? "Add another symptom..." : placeholder}
          className="pr-10"
          data-testid="input-phenotype"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Activity className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {suggestions.map((suggestion, index) => {
              const settings = getPhenotypeSettings();
              return (
                <li
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="cursor-pointer px-3 py-2 text-sm hover-elevate"
                  data-testid={`suggestion-phenotype-${index}`}
                >
                  <div className="font-medium">{suggestion.description}</div>
                  {settings.showCode && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      HPO: {suggestion.id}
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
            onClick={() => addPhenotype(inputValue)}
            data-testid="add-custom-phenotype"
          >
            <span className="text-muted-foreground">Add: </span>
            <span className="font-medium">{inputValue}</span>
          </div>
        </div>
      )}

      <p className="mt-1.5 text-xs text-muted-foreground">
        Search Human Phenotype Ontology (HPO) codes or enter freeform text. Press Enter, comma, or period to add.
      </p>
    </div>
  );
}
