import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import ToolHeader from './ToolHeader'
import AndroidHeader from '../../AndroidHeader'

interface NativeToolLayoutProps {
  title: string
  description: string
  children: React.ReactNode
  actions?: React.ReactNode
  onBack?: () => void
  hideNativeHeader?: boolean
}

export const NativeToolLayout = ({
  title,
  description,
  children,
  actions,
  onBack,
  hideNativeHeader
}: NativeToolLayoutProps) => {
  const navigate = useNavigate()
  
  // Determine if we should show the native-style header
  // It should only show if we are in Android/APK mode
  const isNative = Capacitor.isNativePlatform()
  const isAndroidView = isNative || document.body.classList.contains('android-mode') || window.location.pathname.includes('android')
  
  // A more reliable way is to check the layout context or simply use media queries 
  // but since we want to avoid double headers with the main Layout.tsx:
  const showNativeHeader = isAndroidView

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-black transition-colors">
      {/* Shared native AppBar - same language on Tool, History, Settings */}
      {showNativeHeader && !hideNativeHeader && (
        <AndroidHeader title={title} onBack={onBack || (() => navigate(-1))} />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full ${actions ? 'pb-32 md:pb-8' : ''}`}>
        {/* Web View Header (desktop only when the page brings its own tab header) */}
        <div className={`${showNativeHeader || hideNativeHeader ? 'hidden md:block' : 'block'} mb-8`}>
           <ToolHeader title={title} description={description} />
        </div>

        {/* Content Wrapper */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Grounded Bottom Action Bar */}
      {actions && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 z-40 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <div className="p-4 max-w-md mx-auto">
             {actions}
           </div>
        </div>
      )}
    </div>
  )
}