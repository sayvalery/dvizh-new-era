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

const STEP_ORDER = ['cms_check', 'build', 'validate', 'deploy']

function formatStepLabel(key: string, status: StepStatus, state: BuildState): string {
  switch (key) {
    case 'cms_check':
      return status === 'done' ? 'CMS в порядке' : 'Проверка CMS'
    case 'build': {
      const count = state.pages_count
      if (status === 'done' && count && count > 0) return `Собрано ${count} страниц`
      if (status === 'active' && count && count > 0) return `Сборка ${count} страниц`
      return 'Сборка страниц'
    }
    case 'validate':
      return status === 'done' ? 'Проверено' : 'Валидация'
    case 'deploy':
      return status === 'done' ? 'Опубликовано' : 'Публикация'
    default: return key
  }
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate()
  const month = MONTHS[d.getMonth()]
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month}, ${hours}:${minutes}`
}

export default function DeployButton() {
  const [state, setState] = useState<BuildState>({ status: 'idle', steps: {} })
  const [deploying, setDeploying] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
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
    setSessionStarted(true)
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
  const showSteps = sessionStarted && (isActive || state.status === 'success' || state.status === 'failed')
  const showLastDate = !sessionStarted && state.timestamp

  return (
    <div style={{ padding: '16px 0 12px', width: '100%', alignSelf: 'stretch' }}>
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

      {showLastDate && (
        <div style={{
          marginTop: '6px',
          fontSize: '11px',
          color: '#999',
          textAlign: 'center',
        }}>
          Опубликовано {formatDate(state.timestamp!)}
        </div>
      )}

      {showSteps && (
        <div style={{
          marginTop: '6px',
          padding: '8px 10px',
          backgroundColor: '#fafafa',
          border: '1px solid #e5e5e5',
          borderRadius: '6px',
          fontSize: '11px',
          lineHeight: '1.9',
        }}>
          {STEP_ORDER.map(key => {
            const stepStatus = state.steps[key] || 'pending'
            const label = formatStepLabel(key, stepStatus, state)
            return (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: stepStatus === 'pending' ? '#aaa' : '#333',
              }}>
                <StepIcon status={stepStatus} />
                <span>{label}</span>
              </div>
            )
          })}

          {state.status === 'failed' && (
            <div style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid #e5e5e5',
              fontSize: '11px',
              color: '#666',
              lineHeight: 1.5,
            }}>
              {state.error && (
                <div style={{ marginBottom: '3px', color: '#999' }}>{state.error}</div>
              )}
              <div>Сайт работает. На нём предыдущая версия.</div>
            </div>
          )}

          {state.status === 'success' && (
            <div style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid #e5e5e5',
              fontSize: '11px',
              color: '#666',
            }}>
              Готово
              {state.timestamp && (
                <span> {formatDate(state.timestamp)}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StepIcon({ status }: { status: StepStatus }) {
  const size = 12
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

  return (
    <svg style={style} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#ddd" strokeWidth="1.5" />
    </svg>
  )
}
