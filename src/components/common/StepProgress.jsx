import { Check } from "lucide-react";
function StepProgress({ steps, currentStep }) {
  return <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${step.number < currentStep ? "bg-accent text-white" : step.number === currentStep ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}
  >
                {step.number < currentStep ? <Check className="w-5 h-5" /> : <span>{step.number}</span>}
              </div>
              <span
    className={`mt-2 text-sm ${step.number <= currentStep ? "text-foreground" : "text-muted-foreground"}`}
  >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && <div className="flex-1 h-0.5 mx-4 bg-secondary">
                <div
    className={`h-full transition-all duration-300 ${step.number < currentStep ? "bg-accent" : "bg-transparent"}`}
  />
              </div>}
          </div>)}
      </div>
    </div>;
}
export {
  StepProgress as default
};
