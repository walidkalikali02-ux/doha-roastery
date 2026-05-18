'use client'
import { useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { Upload, X, Loader, ImageIcon, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/contexts/LanguageContext'

interface Props {
  value: string | null
  onChange: (url: string) => void
}

export default function ImageUpload({ value, onChange }: Props) {
  const { t } = useLang()
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'compressing' | 'uploading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)
  const [preview, setPreview] = useState<string | null>(value)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorMsg(t('يرجى رفع صورة فقط', 'Please upload an image file'))
      return
    }

    setErrorMsg(null)
    setOriginalSize(file.size)
    setStatus('compressing')
    setProgress(20)

    let compressed: File
    try {
      compressed = await imageCompression(file, {
        maxSizeMB: 0.5,        // max 500 KB
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        onProgress: (p) => setProgress(20 + Math.round(p * 0.4)), // 20–60%
      })
      setCompressedSize(compressed.size)
    } catch {
      setStatus('error')
      setErrorMsg(t('فشل ضغط الصورة', 'Image compression failed'))
      return
    }

    // Local preview
    setPreview(URL.createObjectURL(compressed))
    setProgress(65)
    setStatus('uploading')

    const ext = compressed.name.split('.').pop() ?? 'jpg'
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(path, compressed, { upsert: false, contentType: compressed.type })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    setProgress(100)
    setStatus('done')
    onChange(publicUrl)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function remove() {
    setPreview(null)
    setStatus('idle')
    setProgress(0)
    setOriginalSize(0)
    setCompressedSize(0)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const kb = (bytes: number) => (bytes / 1024).toFixed(0) + ' KB'
  const saving = originalSize > 0 && compressedSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => status === 'idle' || status === 'done' || status === 'error' ? inputRef.current?.click() : null}
        className={`relative border-2 border-dashed transition-colors cursor-pointer overflow-hidden
          ${status === 'error' ? 'border-red-300 bg-red-50' : 'border-sand/40 hover:border-sand bg-cream'}
          ${(status === 'compressing' || status === 'uploading') ? 'cursor-wait' : ''}
        `}
        style={{ minHeight: 180 }}
      >
        {/* Preview image */}
        {preview && (
          <img
            src={preview}
            alt="preview"
            className="w-full h-48 object-cover"
          />
        )}

        {/* Overlay states */}
        {status === 'idle' && !preview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-12 h-12 bg-sand/10 flex items-center justify-center">
              <ImageIcon size={22} strokeWidth={1.3} className="text-sand" />
            </div>
            <div>
              <p className="text-sm text-charcoal font-medium">
                {t('اسحب الصورة هنا أو انقر للاختيار', 'Drag image here or click to browse')}
              </p>
              <p className="text-xs text-charcoal/40 mt-1">
                {t('JPG, PNG, WebP — حد أقصى 5 ميغابايت', 'JPG, PNG, WebP — max 5 MB')}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-charcoal text-cream text-xs tracking-widest uppercase px-4 py-2">
              <Upload size={13} strokeWidth={1.5} />
              {t('رفع صورة', 'Upload Image')}
            </div>
          </div>
        )}

        {(status === 'compressing' || status === 'uploading') && (
          <div className="absolute inset-0 bg-charcoal/70 flex flex-col items-center justify-center gap-3">
            <Loader size={28} className="text-sand animate-spin" strokeWidth={1.5} />
            <p className="text-cream text-xs tracking-widest uppercase">
              {status === 'compressing'
                ? t('جاري ضغط الصورة...', 'Compressing...')
                : t('جاري الرفع...', 'Uploading...')}
            </p>
            {/* Progress bar */}
            <div className="w-32 h-1 bg-cream/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-sand transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'done' && preview && (
          <div className="absolute top-2 start-2">
            <span className="flex items-center gap-1 bg-green-700 text-cream text-[10px] tracking-widest uppercase px-2 py-1">
              <CheckCircle size={11} strokeWidth={2} />
              {t('تم الرفع', 'Uploaded')}
            </span>
          </div>
        )}

        {/* Remove button */}
        {preview && status !== 'compressing' && status !== 'uploading' && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove() }}
            className="absolute top-2 end-2 w-7 h-7 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={13} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Compression stats */}
      {status === 'done' && saving > 0 && (
        <div className="flex items-center gap-3 text-xs text-charcoal/50 bg-green-50 border border-green-100 px-4 py-2">
          <CheckCircle size={13} strokeWidth={2} className="text-green-600 flex-shrink-0" />
          <span>
            {t(
              `تم ضغط الصورة: ${kb(originalSize)} ← ${kb(compressedSize)} (وفّرنا ${saving}%)`,
              `Compressed: ${kb(originalSize)} → ${kb(compressedSize)} (saved ${saving}%)`
            )}
          </span>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <p className="text-xs text-red-500 px-1">{errorMsg}</p>
      )}

      {/* Re-upload hint when done */}
      {status === 'done' && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs tracking-widest uppercase text-charcoal/40 hover:text-sand transition-colors"
        >
          {t('تغيير الصورة', 'Change image')}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
