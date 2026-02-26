'use client'

import React, { useState } from 'react'

type DeployState = 'idle' | 'building' | 'success' | 'error'

export default function DeployButton() {
  const [state, setState] = useState<DeployState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleDeploy = async () => {
    if (state === 'building') return

    setState('building')
    setErrorMessage('')

    try {
      const res = await fetch('/api/deploy', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setState('success')
        setTimeout(() => setState('idle'), 5000)
      } else {
        setState('error')
        setErrorMessage(data.error || 'Неизвестная ошибка')
      }
    } catch (err) {
      setState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Сеть недоступна')
    }
  }

  const styles: Record<DeployState, React.CSSProperties> = {
    idle: { backgroundColor: '#000', color: '#fff' },
    building: { backgroundColor: '#666', color: '#fff', cursor: 'not-allowed' },
    success: { backgroundColor: '#16a34a', color: '#fff' },
    error: { backgroundColor: '#dc2626', color: '#fff' },
  }

  const labels: Record<DeployState, string> = {
    idle: '🚀 Опубликовать на сайт',
    building: '⏳ Сборка...',
    success: '✅ Опубликовано',
    error: '❌ Ошибка сборки',
  }

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <button
        type="button"
        onClick={handleDeploy}
        disabled={state === 'building'}
        style={{
          ...styles[state],
          width: '100%',
          padding: '10px 16px',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: state === 'building' ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {labels[state]}
      </button>
      {state === 'error' && errorMessage && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#991b1b',
            lineHeight: 1.4,
            maxHeight: '120px',
            overflow: 'auto',
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  )
}
