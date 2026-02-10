"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import styles from "./filterselect.module.css";

export default function FilterSelect({ paramName, options, placeholder }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Get the current value from the URL to keep the dropdown in sync
  const currentValue = searchParams.get(paramName) || "";

  const handleChange = (term) => {
    const params = new URLSearchParams(searchParams);
    
    // When changing Grade, we usually want to reset the Section filter
    if (paramName === "grade") {
      params.delete("section");
    }

    if (term) {
      params.set(paramName, term);
    } else {
      params.delete(paramName);
    }
    
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <select 
      className={styles.select}
      onChange={(e) => handleChange(e.target.value)}
      value={currentValue} // Controlled component: stays in sync with URL
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt, index) => (
        <option 
          // Uses unique key from data, or falls back to index if names repeat
          key={opt.key || `${opt.value}-${index}`} 
          value={opt.value}
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}