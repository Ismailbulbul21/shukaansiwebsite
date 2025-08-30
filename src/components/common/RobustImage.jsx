import { useState, useEffect } from 'react'

/**
 * RobustImage - Enhanced image component with fallback handling
 * Handles image loading errors gracefully with multiple retry attempts
 */
export default function RobustImage({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  onClick,
  onLoad,
  onError,
  profileName = '',
  fallbackSrc = null,
  retryAttempts = 3,
  retryDelay = 1500,
  showLoadingSpinner = true,
  ...otherProps 
}) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src)
    setIsLoading(true)
    setHasError(false)
    setRetryCount(0)
    setIsRetrying(false)
  }, [src])

  const handleImageLoad = (e) => {
    console.log(`✅ RobustImage loaded successfully: ${profileName || 'Unknown'}`)
    console.log(`✅ Loaded URL: ${currentSrc}`)
    console.log(`✅ Image dimensions: ${e.target.naturalWidth}x${e.target.naturalHeight}`)
    setIsLoading(false)
    setHasError(false)
    if (onLoad) onLoad(e)
  }

  const handleImageError = async (e) => {
    console.error(`❌ RobustImage load error: ${profileName || 'Unknown'} - ${currentSrc}`)
    console.error(`❌ Retry count: ${retryCount}/${retryAttempts}`)
    console.error(`❌ Error event details:`, e)
    console.error(`❌ Image element state:`, {
      src: e.target?.src,
      naturalWidth: e.target?.naturalWidth,
      naturalHeight: e.target?.naturalHeight,
      complete: e.target?.complete
    })
    
    // Test fetch to see what's happening with the URL
    try {
      const response = await fetch(currentSrc, { method: 'HEAD' })
      console.error(`❌ Fetch test result:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
    } catch (fetchError) {
      console.error(`❌ Fetch test failed:`, fetchError)
    }
    
    setIsLoading(false)
    
    // Try to retry loading the same image
    if (retryCount < retryAttempts) {
      setIsRetrying(true)
      console.log(`🔄 Retrying image load in ${retryDelay}ms...`)
      
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      
      setRetryCount(prev => prev + 1)
      setIsLoading(true)
      setIsRetrying(false)
      
      // Force reload by adding cache-busting parameter
      const separator = currentSrc.includes('?') ? '&' : '?'
      setCurrentSrc(`${src}${separator}retry=${retryCount + 1}&t=${Date.now()}`)
      return
    }
    
    // All retries exhausted, try fallback
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      console.log(`🔄 Using fallback image: ${fallbackSrc}`)
      setCurrentSrc(fallbackSrc)
      setRetryCount(0)
      setIsLoading(true)
      return
    }
    
    // No fallback or fallback also failed
    console.error(`💥 All attempts failed for: ${profileName || 'Unknown'}`)
    setHasError(true)
    
    if (onError) onError(e)
  }

  const renderLoadingSpinner = () => (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
        <p className="text-xs text-gray-500">
          {isRetrying ? `Retrying... (${retryCount}/${retryAttempts})` : 'Loading...'}
        </p>
      </div>
    </div>
  )

  const renderErrorFallback = () => (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div className="text-center p-4">
        <div className="text-4xl mb-2 text-blue-500">❓</div>
        <p className="text-xs text-gray-600 mb-2 font-medium">Photo unavailable</p>
        <p className="text-xs text-gray-400 mb-2">{profileName || 'User'}</p>
        <button
          onClick={() => {
            console.log(`🔄 Manual retry for ${profileName}: ${src}`)
            setRetryCount(0)
            setHasError(false)
            setIsLoading(true)
            // Try original URL without cache busting first
            setCurrentSrc(src)
          }}
          className="text-xs bg-pink-500 text-white px-2 py-1 rounded hover:bg-pink-600 transition-colors"
        >
          🔄 Retry
        </button>
      </div>
    </div>
  )

  return (
    <div className="relative w-full h-full" style={style}>
      {/* Main Image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${hasError ? 'opacity-0' : ''}`}
        onClick={onClick}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          ...style,
          opacity: hasError ? 0 : undefined
        }}
        {...otherProps}
      />
      
      {/* Loading Spinner */}
      {isLoading && showLoadingSpinner && renderLoadingSpinner()}
      
      {/* Error Fallback */}
      {hasError && renderErrorFallback()}
    </div>
  )
}
