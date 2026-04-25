import { Check } from 'lucide-react'

export default function Stepper({ steps, currentStep }) {
  return (
    <div className="stepper">
      {steps.map((step, i) => {
        const status = i < currentStep ? 'done' : i === currentStep ? 'active' : 'idle'
        return (
          <div className="step-item" key={i}>
            <div className="step-wrapper">
              <div className={`step-circle ${status}`}>
                {status === 'done' ? <Check size={14} /> : i + 1}
              </div>
              <div className={`step-label ${status}`}>{step}</div>
            </div>
            {i < steps.length - 1 && (
              <div className={`step-connector${status === 'done' ? ' done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
