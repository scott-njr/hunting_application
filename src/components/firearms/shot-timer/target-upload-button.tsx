'use client'

import { useRef } from 'react'
import { Camera } from 'lucide-react'
import { AIProgressModal } from '@/components/ui/ai-progress-modal'

interface TargetUploadButtonProps {
  onUpload: (file: File) => void
  analyzing: boolean
}

const ANALYSIS_STEPS = [
  'Uploading target photo...',
  'Analyzing shot pattern...',
  'Identifying point of impact...',
  'Evaluating grouping consistency...',
  'Determining corrective drills...',
]

export function TargetUploadButton({ onUpload, analyzing }: TargetUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onUpload(file)
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={analyzing}
        className="w-full px-4 py-2.5 text-sm font-medium border border-accent/50 text-accent rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Camera className="h-4 w-4" />
        Upload Target Photo for AI Analysis
      </button>
      <AIProgressModal
        open={analyzing}
        featureLabel="Target Analysis"
        steps={ANALYSIS_STEPS}
      />
    </>
  )
}
