"use client";
import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext({})

const RadioGroup = React.forwardRef(({ className, onValueChange, defaultValue, value, ...props }, ref) => {
    // Basic controlled/uncontrolled support
    const [val, setVal] = React.useState(defaultValue || value)
    
    // To support controlled usage from hook form via Controller
    React.useEffect(() => {
        if (value !== undefined) setVal(value)
    }, [value])

    const handleValueChange = (newValue) => {
        if (value === undefined) setVal(newValue)
        onValueChange?.(newValue)
    }

  return (
    <RadioGroupContext.Provider value={{ value: val, onValueChange: handleValueChange }}>
        <div className={cn("grid gap-2", className)} ref={ref} {...props} />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = React.useContext(RadioGroupContext)
  const isChecked = selectedValue === value

  return (
    <button
      type="button" 
      role="radio"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      value={value}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
        className
      )}
      onClick={() => onValueChange(value)}
      ref={ref}
      {...props}
    >
      {isChecked && <div className="h-2.5 w-2.5 fill-current text-current bg-current rounded-full" />}
    </button>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }

