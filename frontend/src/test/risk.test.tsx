import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiskBadge } from '../components/ui/risk-badge'
import { RiskCard, type RiskAssessmentData } from '../features/chat/RiskCard'

describe('RiskBadge', () => {
  it('renders safe level correctly with icon and label', () => {
    render(<RiskBadge level="safe" />)
    expect(screen.getByText('Safe')).toBeInTheDocument()
  })

  it('renders caution level correctly', () => {
    render(<RiskBadge level="caution" />)
    expect(screen.getByText('Caution')).toBeInTheDocument()
  })

  it('renders unsafe level correctly', () => {
    render(<RiskBadge level="unsafe" />)
    expect(screen.getByText('Unsafe')).toBeInTheDocument()
  })

  it('renders unknown level correctly', () => {
    render(<RiskBadge level="unknown" />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})

describe('RiskCard for all 4 levels', () => {
  const baseAssessment: RiskAssessmentData = {
    id: 'test-uuid-1234',
    location: {
      lat: 18.922,
      lon: 72.834,
    },
    level: 'safe',
    valid_from: '2026-10-18T12:00:00Z',
    valid_to: '2026-10-18T18:00:00Z',
    vessel_class: 'small_craft',
    synthetic: false,
    rules_version: '1.0.0-dev',
    factors: [
      {
        key: 'wave_height',
        label: 'Wave Height',
        value: 0.8,
        unit: 'm',
        caution_at: 1.5,
        unsafe_at: 2.5,
        level: 'safe',
        source: 'Open-Meteo',
      },
      {
        key: 'wind_speed',
        label: 'Wind Speed',
        value: 12.0,
        unit: 'kn',
        caution_at: 20.0,
        unsafe_at: 30.0,
        level: 'safe',
        source: 'Open-Meteo',
      },
    ],
    advisories: [],
  }

  it('renders safe assessment with disclaimer and factors', () => {
    render(<RiskCard assessment={baseAssessment} />)
    expect(screen.getAllByText('Safe').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Official warnings override ORCA/i)).toBeInTheDocument()
    expect(screen.getByText('Wave Height')).toBeInTheDocument()
    expect(screen.getByText('Wind Speed')).toBeInTheDocument()
  })

  it('renders caution assessment with caution badge and indicators', () => {
    const cautionAssessment: RiskAssessmentData = {
      ...baseAssessment,
      level: 'caution',
      factors: [
        {
          key: 'wave_height',
          label: 'Wave Height',
          value: 1.8,
          unit: 'm',
          caution_at: 1.5,
          unsafe_at: 2.5,
          level: 'caution',
          source: 'Open-Meteo',
        },
      ],
    }
    render(<RiskCard assessment={cautionAssessment} />)
    expect(screen.getAllByText('Caution').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('1.8 m')).toBeInTheDocument()
  })

  it('renders unsafe assessment with active advisory alerts', () => {
    const unsafeAssessment: RiskAssessmentData = {
      ...baseAssessment,
      level: 'unsafe',
      advisories: [
        {
          id: 'adv-99',
          headline: 'High Wave Alert - Maharashtra Coast',
          severity: 'severe',
          source: 'INCOIS',
        },
      ],
    }
    render(<RiskCard assessment={unsafeAssessment} />)
    expect(screen.getAllByText('Unsafe').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/High Wave Alert - Maharashtra Coast/i)).toBeInTheDocument()
  })

  it('renders unknown assessment when sensor data is missing or stale', () => {
    const unknownAssessment: RiskAssessmentData = {
      ...baseAssessment,
      level: 'unknown',
      missing: ['wave_height', 'current_speed'],
    }
    render(<RiskCard assessment={unknownAssessment} />)
    expect(screen.getAllByText('Unknown').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Missing or stale inputs:/i)).toBeInTheDocument()
    expect(screen.getByText(/wave_height, current_speed/i)).toBeInTheDocument()
  })

  it('renders synthetic banner when synthetic is true', () => {
    const demoAssessment: RiskAssessmentData = {
      ...baseAssessment,
      synthetic: true,
    }
    render(<RiskCard assessment={demoAssessment} />)
    expect(screen.getByText(/DEMO DATA/i)).toBeInTheDocument()
  })
})
