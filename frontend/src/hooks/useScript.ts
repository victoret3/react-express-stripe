import { useEffect, useState } from 'react';

type ScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ScriptOptions {
  removeOnUnmount?: boolean;
  attributes?: Record<string, string>;
}

/**
 * Custom hook to dynamically load an external script.
 * 
 * @param src The URL of the script to load
 * @param options Additional options for script loading
 * @returns The current status of the script loading process
 */
export const useScript = (
  src: string,
  options: ScriptOptions = { removeOnUnmount: false }
): ScriptStatus => {
  const [status, setStatus] = useState<ScriptStatus>(src ? 'loading' : 'idle');

  useEffect(() => {
    // If there's no src, set status to idle and exit
    if (!src) {
      setStatus('idle');
      return;
    }

    // Check if the script already exists in the DOM
    let script: HTMLScriptElement | null = document.querySelector(`script[src="${src}"]`);
    
    // If the script doesn't exist, create a new one
    if (!script) {
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      // Add any additional attributes
      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          script?.setAttribute(key, value);
        });
      }
      
      document.body.appendChild(script);
      
      // Set initial status
      setStatus('loading');
    } else {
      // If the script is already in the DOM, check its status
      setStatus(script.getAttribute('data-status') as ScriptStatus || 'ready');
    }

    // Event handlers
    const handleLoad = () => {
      if (script) {
        script.setAttribute('data-status', 'ready');
        setStatus('ready');
      }
    };

    const handleError = () => {
      if (script) {
        script.setAttribute('data-status', 'error');
        setStatus('error');
        // Optionally remove the script on error
        if (options.removeOnUnmount) {
          script.remove();
        }
      }
    };

    // Add event listeners
    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    // Cleanup function
    return () => {
      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
      
      if (options.removeOnUnmount && script) {
        script.remove();
      }
    };
  }, [src, options.removeOnUnmount, options.attributes]);

  return status;
};
