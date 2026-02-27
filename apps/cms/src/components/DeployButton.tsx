'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

type StepStatus = 'pending' | 'active' | 'done' | 'failed'
type BuildStatus = 'idle' | 'building' | 'success' | 'failed'

interface BuildState {
  build_id?: string
  status: BuildStatus
  timestamp?: string
  pages_count?: number
  error?: string | null
  steps: Record<string, StepStatus>
}

const STEP_LABELS: Record<string, string> = {
  cms_check: 'Проверка CMS',
  build: 'Сборка страниц',
  validate: 'Валидация',
  deploy: 'Публикация',
}

const STEP_ORDER = ['cms_check', 'build', 'validate', 'deploy']

export default function DeployButton() {
  const [state, setState] = useState<BuildState>({ status: 'idle', steps: {} })
  const [deploying, setDeploying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/build-status')
      if (res.ok) {
        const data: BuildState = await res.json()
        setState(data)

        if (data.status === 'success' || data.status === 'failed') {
          stopPolling()
          setDeploying(false)
        }
      }
    } catch {
      // Webhook unreachable
    }
  }, [])

  const startPolling = useCallback(() => {
    if (intervalRef.current) return
    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 2000)
  }, [fetchStatus])

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    fetchStatus()
    return () => stopPolling()
  }, [fetchStatus])

  const handleDeploy = async () => {
    if (deploying) return
    setDeploying(true)
    setState({ status: 'building', steps: {} })

    try {
      const res = await fetch('/deploy', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setState({
          status: 'failed',
          steps: {},
          error: data.error || `HTTP ${res.status}`,
        })
        setDeploying(false)
        return
      }
      startPolling()
    } catch {
      setState({
        status: 'failed',
        steps: {},
        error: 'Сервер сборки недоступен',
      })
      setDeploying(false)
    }
  }

  const isActive = deploying || state.status === 'building'
  const showSteps = isActive || state.status === 'success' || state.status === 'failed'

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <button
        type="button"
        onClick={handleDeploy}
        disabled={isActive}
        style={{
          width: '100%',
          padding: '10px 16px',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isActive ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          backgroundColor: isActive ? '#888' : '#000',
          color: '#fff',
        }}
      >
        {isActive ? 'Сборка...' : 'Опубликовать на сайт'}
      </button>

      {showSteps && (
        <div style={{
          marginTop: '8px',
          padding: '10px 12px',
          backgroundColor: '#fafafa',
          border: '1px solid #e5e5e5',
          borderRadius: '6px',
          fontSize: '13px',
          lineHeight: '1.8',
        }}>
          {STEP_ORDER.map(key => {
            const stepStatus = state.steps[key] || 'pending'
            const label = STEP_LABELS[key]
            return (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: stepStatus === 'pending' ? '#aaa' : '#333',
              }}>
                <StepIcon status={stepStatus} />
                <span>{label}</span>
                {key === 'build' && state.pages_count != null && state.pages_count > 0 && stepStatus === 'done' && (
                  <span style={{ color: '#999', marginLeft: 'auto', fontSize: '12px' }}>
                    {state.pages_count} стр.
                  </span>
                )}
              </div>
            )
          })}

          {state.status === 'failed' && (
            <div style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #e5e5e5',
              fontSize: '12px',
              color: '#666',
              lineHeight: 1.5,
            }}>
              {state.error && (
                <div style={{ marginBottom: '4px', color: '#999' }}>{state.error}</div>
              )}
              <div>Сайт работает. На нём предыдущая опубликованная версия.</div>
              <div>Обратитесь к разработчику, если проблема повторяется.</div>
            </div>
          )}

          {state.status === 'success' && (
            <div style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #e5e5e5',
              fontSize: '12px',
              color: '#666',
            }}>
              Опубликовано
              {state.timestamp && (
                <span> — {new Date(state.timestamp).toLocaleString('ru-RU')}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StepIcon({ status }: { status: StepStatus }) {
  const size = 16
  const style: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (status === 'done') {
    return (
      <svg style={style} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="#999" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (status === 'active') {
    return (
      <svg style={{ ...style, animation: 'spin 1s linear infinite' }} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="#ddd" strokeWidth="1.5" />
        <path d="M8 1a7 7 0 0 1 7 7" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </svg>
    )
  }

  if (status === 'failed') {
    return (
      <svg style={style} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="#999" strokeWidth="1.5" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  // pending
  return (
    <svg style={style} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#ddd" strokeWidth="1.5" />
    </svg>
  )
}
