import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Pill, ChevronDown } from "lucide-react";

interface DrugSuggestion {
  name: string;
  rxcui: string;
  strengths: string[];
}

interface MedicationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function useShowRxcui() {
  const [showRxcui, setShowRxcui] = useState(() => {
    return localStorage.getItem("medportal_show_rxcui") === "true";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setShowRxcui(localStorage.getItem("medportal_show_rxcui") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return showRxcui;
}

export function MedicationAutocomplete({
  value,
  onChange,
  placeholder = "Search for medication...",
  className,
}: MedicationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<DrugSuggestion[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DrugSuggestion | null>(null);
  const [showStrengths, setShowStrengths] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const showRxcui = useShowRxcui();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowStrengths(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizeStrengths = (rawStrengths: unknown): string[] => {
    if (!rawStrengths) return [];
    if (Array.isArray(rawStrengths)) {
      return rawStrengths.filter((s) => typeof s === "string" && s.trim());
    }
    if (typeof rawStrengths === "string") {
      return rawStrengths.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  useEffect(() => {
    if (inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    if (selectedDrug && inputValue === selectedDrug.name) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(inputValue)}&ef=STRENGTHS_AND_FORMS,RXCUIS&maxList=10`
        );
        const data = await response.json();
        
        // API response format: [count, names, extras, displayNames]
        // where extras = { STRENGTHS_AND_FORMS: [[strengths1], [strengths2], ...], RXCUIS: [[rxcui1], ...] }
        const [, names, extras] = data;
        
        if (names && names.length > 0) {
          const formattedSuggestions: DrugSuggestion[] = names.map((name: string, index: number) => ({
            name,
            rxcui: extras?.RXCUIS?.[index]?.[0] || "",
            strengths: normalizeStrengths(extras?.STRENGTHS_AND_FORMS?.[index]),
          }));
          
          setSuggestions(formattedSuggestions);
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching drug suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, selectedDrug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedDrug(null);
    setShowStrengths(false);
    onChange(newValue);
  };

  const formatDrugValue = (drugName: string, rxcui: string) => {
    if (showRxcui && rxcui) {
      return `[${rxcui}] ${drugName}`;
    }
    return drugName;
  };

  const handleSelectDrug = (drug: DrugSuggestion) => {
    setSelectedDrug(drug);
    if (drug.strengths.length > 0) {
      setShowStrengths(true);
      setSuggestions([]);
    } else {
      const formattedValue = formatDrugValue(drug.name, drug.rxcui);
      setInputValue(formattedValue);
      onChange(formattedValue);
      setIsOpen(false);
    }
  };

  const handleSelectStrength = (strength: string) => {
    const drugName = selectedDrug?.name?.replace(/\s*\(.*\)$/, "") || "";
    const fullValue = `${drugName} ${strength.trim()}`;
    const formattedValue = formatDrugValue(fullValue, selectedDrug?.rxcui || "");
    setInputValue(formattedValue);
    onChange(formattedValue);
    setShowStrengths(false);
    setSelectedDrug(null);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="pr-10"
          data-testid="input-medication"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Pill className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && !showStrengths && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {suggestions.map((drug, index) => (
              <li
                key={`${drug.rxcui}-${index}`}
                onClick={() => handleSelectDrug(drug)}
                className="flex cursor-pointer items-center justify-between px-3 py-2 hover-elevate"
                data-testid={`suggestion-drug-${index}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{drug.name}</p>
                  <div className="flex items-center gap-2">
                    {showRxcui && drug.rxcui && (
                      <span className="text-xs text-primary font-mono">RXCUI: {drug.rxcui}</span>
                    )}
                    {drug.strengths.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {drug.strengths.length} strength{drug.strengths.length !== 1 ? "s" : ""} available
                      </span>
                    )}
                  </div>
                </div>
                {drug.strengths.length > 0 && (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showStrengths && selectedDrug && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="border-b px-3 py-2">
            <p className="text-sm font-medium text-muted-foreground">
              Select strength for {selectedDrug.name}
            </p>
          </div>
          <ul className="max-h-60 overflow-auto py-1">
            {selectedDrug.strengths.map((strength, index) => (
              <li
                key={index}
                onClick={() => handleSelectStrength(strength)}
                className="cursor-pointer px-3 py-2 text-sm hover-elevate"
                data-testid={`suggestion-strength-${index}`}
              >
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {inputValue.length >= 2 && !loading && suggestions.length === 0 && isOpen && !showStrengths && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-3 py-2 shadow-lg">
          <p className="text-sm text-muted-foreground">No medications found</p>
        </div>
      )}
    </div>
  );
}
