import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Stethoscope, X } from "lucide-react";

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
  const [conditions, setConditions] = useState<string[]>(() => {
    if (!value) return [];
    return value.split(",").map(c => c.trim()).filter(Boolean);
  });
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) {
      setConditions([]);
      return;
    }
    const newConditions = value.split(",").map(c => c.trim()).filter(Boolean);
    setConditions(newConditions);
  }, [value]);

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
          `https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=${encodeURIComponent(inputValue)}&maxList=10`
        );
        const data = await response.json();
        
        // API response format: [count, codes, extras, display_names]
        // Index 3 contains arrays of display strings - we want the first element of each
        const displayNamesRaw = data[3];
        
        if (displayNamesRaw && displayNamesRaw.length > 0) {
          // Each item in displayNamesRaw is an array, take the first element (the condition name)
          const displayNames = displayNamesRaw.map((item: string | string[]) => 
            Array.isArray(item) ? item[0] : item
          ).filter(Boolean);
          
          const filteredNames = displayNames.filter(
            (name: string) => !conditions.includes(name)
          );
          setSuggestions(filteredNames);
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
  }, [inputValue, conditions]);

  const addCondition = (condition: string) => {
    const trimmed = condition.trim();
    if (!trimmed || conditions.includes(trimmed)) return;
    
    const newConditions = [...conditions, trimmed];
    setConditions(newConditions);
    onChange(newConditions.join(", "));
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    onChange(newConditions.join(", "));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ".") {
      e.preventDefault();
      if (inputValue.trim()) {
        addCondition(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && conditions.length > 0) {
      removeCondition(conditions.length - 1);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    addCondition(suggestion);
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
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {inputValue.length >= 2 && !loading && suggestions.length === 0 && isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div
            className="cursor-pointer px-3 py-2 text-sm hover-elevate"
            onClick={() => addCondition(inputValue)}
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
