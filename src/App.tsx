import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  defaultRules,
  guidance,
  mortgageCriteria,
  renewalProcess,
  workflowRoles,
  type MortgageRate,
  type RateOption,
  type RuleSet,
} from './data'

type LoanInputs = {
  loanTerm: string
  beaconBand: string
  collateralType: string
  tdsrBand: string
  jobStabilityBand: string
  serviceBand: string
  baseRateAdjustment: number
}

type MortgageInputs = {
  mortgageTerm: string
  beaconScore: number
  insured: boolean
  incomeVerified: boolean
  propertyQuality: 'good' | 'fair' | 'poor'
  tdsWithinPolicy: boolean
  outstandingDerogatory: boolean
  requestedAmount: number
  ltv: number
  repaymentComfortable: boolean
}

type ApprovalState = Record<(typeof workflowRoles)[number], 'Pending' | 'Approved' | 'Rejected'>

type AuditEntry = {
  id: number
  memberName: string
  user: string
  timestamp: string
  finalRate: number
  totalAddOn: number
  loanTerm: string
  mortgageClass: string
  route: string
  riskScore: number
  override: number
}

const defaultLoanInputs: LoanInputs = {
  loanTerm: 'Variable',
  beaconBand: 'Over 700',
  collateralType: 'None',
  tdsrBand: '< 20%',
  jobStabilityBand: 'Over 8 years',
  serviceBand: '4+ and Day to Day Account',
  baseRateAdjustment: 0,
}

const defaultMortgageInputs: MortgageInputs = {
  mortgageTerm: '5 years',
  beaconScore: 705,
  insured: true,
  incomeVerified: true,
  propertyQuality: 'good',
  tdsWithinPolicy: true,
  outstandingDerogatory: false,
  requestedAmount: 250,
  ltv: 80,
  repaymentComfortable: true,
}

const defaultApprovals: ApprovalState = {
  'Lending Officer': 'Approved',
  'Branch Manager': 'Pending',
  'Credit Manager': 'Pending',
  'Head Office': 'Pending',
}

const readStoredValue = <T,>(key: string, fallback: T) => {
  const raw = localStorage.getItem(key)

  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const getOptionValue = (options: RateOption[], label: string) =>
  options.find((option) => option.label === label)?.addOnPct ?? 0

const getMortgageRate = (rates: MortgageRate[], term: string) =>
  rates.find((rate) => rate.term === term) ?? rates[rates.length - 1]

const formatPct = (value: number) => `${value.toFixed(2)}%`

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

function App() {
  const [rules, setRules] = useState<RuleSet>(() => readStoredValue('rate-matrix-rules', defaultRules))
  const [loanInputs, setLoanInputs] = useState<LoanInputs>(defaultLoanInputs)
  const [mortgageInputs, setMortgageInputs] = useState<MortgageInputs>(defaultMortgageInputs)
  const [memberName, setMemberName] = useState('Taylor Johnson')
  const [loanPurpose, setLoanPurpose] = useState('Owner occupied mortgage refinance')
  const [currentUser, setCurrentUser] = useState('lending.officer@valleycu.ca')
  const [approvalComment, setApprovalComment] = useState(
    'Standard pricing path with full documentation received.',
  )
  const [overridePct, setOverridePct] = useState(0)
  const [signature, setSignature] = useState('T. Johnson')
  const [approvals, setApprovals] = useState<ApprovalState>(defaultApprovals)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => readStoredValue('rate-matrix-audit', []))

  useEffect(() => {
    localStorage.setItem('rate-matrix-rules', JSON.stringify(rules))
  }, [rules])

  useEffect(() => {
    localStorage.setItem('rate-matrix-audit', JSON.stringify(auditLog))
  }, [auditLog])

  const components = useMemo(
    () => [
      { label: 'Term', selection: loanInputs.loanTerm, addOn: getOptionValue(rules.termOptions, loanInputs.loanTerm) },
      {
        label: 'Beacon',
        selection: loanInputs.beaconBand,
        addOn: getOptionValue(rules.beaconOptions, loanInputs.beaconBand),
      },
      {
        label: 'Collateral',
        selection: loanInputs.collateralType,
        addOn: getOptionValue(rules.collateralOptions, loanInputs.collateralType),
      },
      { label: 'TDSR', selection: loanInputs.tdsrBand, addOn: getOptionValue(rules.tdsrOptions, loanInputs.tdsrBand) },
      {
        label: 'Job Stability',
        selection: loanInputs.jobStabilityBand,
        addOn: getOptionValue(rules.jobStabilityOptions, loanInputs.jobStabilityBand),
      },
      {
        label: 'Services',
        selection: loanInputs.serviceBand,
        addOn: getOptionValue(rules.serviceOptions, loanInputs.serviceBand),
      },
      { label: 'Base Rate Input', selection: formatPct(loanInputs.baseRateAdjustment), addOn: loanInputs.baseRateAdjustment },
    ],
    [loanInputs, rules],
  )

  const totalAddOn = useMemo(
    () => components.reduce((total, component) => total + component.addOn, 0),
    [components],
  )

  const selectedMortgageRate = useMemo(
    () => getMortgageRate(rules.mortgageRates, mortgageInputs.mortgageTerm),
    [mortgageInputs.mortgageTerm, rules.mortgageRates],
  )

  const fiveYearRate = useMemo(
    () => getMortgageRate(rules.mortgageRates, '5 years'),
    [rules.mortgageRates],
  )

  const mortgageDecision = useMemo(() => {
    const reasons: string[] = []
    let classification: 'A Mortgage' | 'B Mortgage' | 'C Mortgage' = 'C Mortgage'

    const qualifiesForA =
      mortgageInputs.beaconScore >= 650 &&
      !mortgageInputs.outstandingDerogatory &&
      mortgageInputs.incomeVerified &&
      mortgageInputs.propertyQuality === 'good' &&
      mortgageInputs.tdsWithinPolicy

    const qualifiesForB =
      mortgageInputs.beaconScore >= 600 &&
      !mortgageInputs.outstandingDerogatory &&
      mortgageInputs.propertyQuality !== 'poor' &&
      mortgageInputs.repaymentComfortable

    if (qualifiesForA) {
      classification = 'A Mortgage'
      reasons.push('Credit, income verification, property quality, and debt-service policy align with A criteria.')
    } else if (qualifiesForB) {
      classification = 'B Mortgage'
      reasons.push('Application meets B mortgage minimums but misses at least one A-tier requirement.')
    } else {
      reasons.push('Application falls into the higher-risk C mortgage path.')
      if (mortgageInputs.insured) {
        reasons.push('C mortgages are uninsured only, so an insured application requires policy review.')
      }
      if (mortgageInputs.ltv > 65) {
        reasons.push('Current LTV exceeds the 65% C mortgage cap.')
      }
    }

    let recommendedRate = selectedMortgageRate.postedRate

    if (classification === 'A Mortgage') {
      recommendedRate = selectedMortgageRate.competitiveRate ?? selectedMortgageRate.postedRate
    } else if (classification === 'B Mortgage') {
      recommendedRate = mortgageInputs.insured
        ? Math.max(fiveYearRate.postedRate - 1, fiveYearRate.competitiveRate ?? 0)
        : Math.max(selectedMortgageRate.postedRate, selectedMortgageRate.competitiveRate ?? 0)
      if (!mortgageInputs.insured) {
        reasons.push('Any uninsured B-mortgage discount should be escalated for Head Office approval.')
      }
    } else {
      recommendedRate = Math.max(selectedMortgageRate.postedRate, fiveYearRate.postedRate) + 2
    }

    if (mortgageInputs.requestedAmount < 100) {
      recommendedRate += 0.5
      reasons.push('Amount under $100K adds 0.50% per policy.')
    }

    return {
      classification,
      recommendedRate,
      reasons,
    }
  }, [fiveYearRate, mortgageInputs, selectedMortgageRate])

  const riskScore = useMemo(() => {
    const mortgageRisk =
      mortgageDecision.classification === 'A Mortgage'
        ? 10
        : mortgageDecision.classification === 'B Mortgage'
          ? 25
          : 40

    return Number((totalAddOn * 10 + mortgageRisk + Math.max(0, mortgageInputs.ltv - 65) * 0.4).toFixed(1))
  }, [mortgageDecision.classification, mortgageInputs.ltv, totalAddOn])

  const finalRate = Number((mortgageDecision.recommendedRate + totalAddOn + overridePct).toFixed(2))

  const workflowRoute = useMemo(() => {
    const exceptions = [
      mortgageDecision.classification !== 'A Mortgage',
      mortgageInputs.requestedAmount < 100,
      !mortgageInputs.incomeVerified,
      !mortgageInputs.tdsWithinPolicy,
      overridePct !== 0,
      loanInputs.collateralType === 'Unsecured',
    ].filter(Boolean).length

    if (mortgageDecision.classification === 'C Mortgage' || exceptions >= 3) {
      return 'Head Office'
    }

    if (mortgageDecision.classification === 'B Mortgage' || exceptions >= 1) {
      return 'Credit Manager'
    }

    return 'Branch Manager'
  }, [loanInputs.collateralType, mortgageDecision.classification, mortgageInputs, overridePct])

  const auditChecks = useMemo(() => {
    const requiredInputs = Object.values(loanInputs).every((value) =>
      typeof value === 'number' ? Number.isFinite(value) : value !== '',
    )

    const outputsNumeric = Number.isFinite(totalAddOn) && Number.isFinite(finalRate)
    const criticalFields = memberName.trim() !== '' && currentUser.trim() !== '' && signature.trim() !== ''
    const printable = true
    const failCount = [requiredInputs, outputsNumeric, criticalFields, printable].filter((status) => !status).length

    return [
      { label: 'All required inputs selected', passed: requiredInputs, action: 'Complete all rate and member inputs.' },
      { label: 'Calculation outputs numeric', passed: outputsNumeric, action: 'Review editable rules and numeric entries.' },
      { label: 'No blank critical output fields', passed: criticalFields, action: 'Provide member, user, and signature details.' },
      { label: 'Print view available', passed: printable, action: 'Use the printable approval sheet below.' },
      { label: 'Overall audit', passed: failCount === 0, action: 'All checks must pass before approval.' },
    ]
  }, [currentUser, finalRate, loanInputs, memberName, signature, totalAddOn])

  const handleRuleChange = (
    section: keyof Pick<
      RuleSet,
      | 'termOptions'
      | 'beaconOptions'
      | 'collateralOptions'
      | 'tdsrOptions'
      | 'jobStabilityOptions'
      | 'serviceOptions'
    >,
    label: string,
    value: number,
  ) => {
    setRules((current) => ({
      ...current,
      [section]: current[section].map((option) =>
        option.label === label ? { ...option, addOnPct: value } : option,
      ),
    }))
  }

  const handleMortgageRateChange = (
    term: string,
    field: keyof Pick<MortgageRate, 'postedRate' | 'competitiveRate'>,
    value: number,
  ) => {
    setRules((current) => ({
      ...current,
      mortgageRates: current.mortgageRates.map((rate) =>
        rate.term === term ? { ...rate, [field]: Number.isNaN(value) ? 0 : value } : rate,
      ),
    }))
  }

  const handleApprovalChange = (role: keyof ApprovalState, value: ApprovalState[keyof ApprovalState]) => {
    setApprovals((current) => ({
      ...current,
      [role]: value,
    }))
  }

  const saveCalculation = () => {
    setAuditLog((current) => [
      {
        id: Date.now(),
        memberName,
        user: currentUser,
        timestamp: new Date().toISOString(),
        finalRate,
        totalAddOn,
        loanTerm: loanInputs.loanTerm,
        mortgageClass: mortgageDecision.classification,
        route: workflowRoute,
        riskScore,
        override: overridePct,
      },
      ...current,
    ])
  }

  const dashboard = useMemo(() => {
    const total = auditLog.length
    const approvalsRequired = auditLog.filter((entry) => entry.route !== 'Branch Manager').length
    const averageRate = total === 0 ? finalRate : auditLog.reduce((sum, entry) => sum + entry.finalRate, 0) / total
    const averageRisk = total === 0 ? riskScore : auditLog.reduce((sum, entry) => sum + entry.riskScore, 0) / total

    return {
      total,
      approvalsRequired,
      averageRate,
      averageRisk,
    }
  }, [auditLog, finalRate, riskScore])

  return (
    <main className="app-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Valley Credit Union • July 2026</p>
          <h1>Loan &amp; Mortgage Rate Matrix Platform</h1>
          <p className="hero-copy">
            Modernized pricing, classification, audit, workflow, and print output built from the current workbook rules.
          </p>
        </div>
        <div className="hero-metrics">
          <div className="metric-card">
            <span>Total add-on</span>
            <strong>{formatPct(totalAddOn)}</strong>
          </div>
          <div className="metric-card">
            <span>Mortgage class</span>
            <strong>{mortgageDecision.classification}</strong>
          </div>
          <div className="metric-card">
            <span>Final recommended rate</span>
            <strong>{formatPct(finalRate)}</strong>
          </div>
          <div className="metric-card">
            <span>Approval route</span>
            <strong>{workflowRoute}</strong>
          </div>
        </div>
      </header>

      <section className="grid-layout">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">1. Rate Matrix Calculator</p>
              <h2>Loan pricing inputs</h2>
            </div>
            <span className="pill">Real-time scoring</span>
          </div>

          <div className="form-grid">
            <label>
              Loan term
              <select
                value={loanInputs.loanTerm}
                onChange={(event) => setLoanInputs((current) => ({ ...current, loanTerm: event.target.value }))}
              >
                {rules.termOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Beacon score band
              <select
                value={loanInputs.beaconBand}
                onChange={(event) => setLoanInputs((current) => ({ ...current, beaconBand: event.target.value }))}
              >
                {rules.beaconOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Collateral type
              <select
                value={loanInputs.collateralType}
                onChange={(event) => setLoanInputs((current) => ({ ...current, collateralType: event.target.value }))}
              >
                {rules.collateralOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              TDSR band
              <select
                value={loanInputs.tdsrBand}
                onChange={(event) => setLoanInputs((current) => ({ ...current, tdsrBand: event.target.value }))}
              >
                {rules.tdsrOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Job stability
              <select
                value={loanInputs.jobStabilityBand}
                onChange={(event) =>
                  setLoanInputs((current) => ({ ...current, jobStabilityBand: event.target.value }))
                }
              >
                {rules.jobStabilityOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Member services
              <select
                value={loanInputs.serviceBand}
                onChange={(event) => setLoanInputs((current) => ({ ...current, serviceBand: event.target.value }))}
              >
                {rules.serviceOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Base rate adjustment %
              <input
                type="number"
                step="0.01"
                value={loanInputs.baseRateAdjustment}
                onChange={(event) =>
                  setLoanInputs((current) => ({
                    ...current,
                    baseRateAdjustment: Number(event.target.value),
                  }))
                }
              />
            </label>
            <label>
              Pricing override %
              <input
                type="number"
                step="0.01"
                value={overridePct}
                onChange={(event) => setOverridePct(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Selection</th>
                  <th>Add-on</th>
                </tr>
              </thead>
              <tbody>
                {components.map((component) => (
                  <tr key={component.label}>
                    <td>{component.label}</td>
                    <td>{component.selection}</td>
                    <td>{formatPct(component.addOn)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={2}>Total add-on</th>
                  <th>{formatPct(totalAddOn)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">2. Mortgage Classification Engine</p>
              <h2>Mortgage risk review</h2>
            </div>
            <span className="pill">{mortgageDecision.classification}</span>
          </div>

          <div className="form-grid">
            <label>
              Mortgage term
              <select
                value={mortgageInputs.mortgageTerm}
                onChange={(event) =>
                  setMortgageInputs((current) => ({ ...current, mortgageTerm: event.target.value }))
                }
              >
                {rules.mortgageRates.map((rate) => (
                  <option key={rate.term} value={rate.term}>
                    {rate.term}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Beacon score
              <input
                type="number"
                value={mortgageInputs.beaconScore}
                onChange={(event) =>
                  setMortgageInputs((current) => ({ ...current, beaconScore: Number(event.target.value) }))
                }
              />
            </label>
            <label>
              Requested amount ($K)
              <input
                type="number"
                value={mortgageInputs.requestedAmount}
                onChange={(event) =>
                  setMortgageInputs((current) => ({ ...current, requestedAmount: Number(event.target.value) }))
                }
              />
            </label>
            <label>
              Loan-to-value %
              <input
                type="number"
                value={mortgageInputs.ltv}
                onChange={(event) =>
                  setMortgageInputs((current) => ({ ...current, ltv: Number(event.target.value) }))
                }
              />
            </label>
            <label>
              Property quality
              <select
                value={mortgageInputs.propertyQuality}
                onChange={(event) =>
                  setMortgageInputs((current) => ({
                    ...current,
                    propertyQuality: event.target.value as MortgageInputs['propertyQuality'],
                  }))
                }
              >
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={mortgageInputs.insured}
                onChange={(event) =>
                  setMortgageInputs((current) => ({ ...current, insured: event.target.checked }))
                }
              />
              Insured mortgage
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={mortgageInputs.incomeVerified}
                onChange={(event) =>
                  setMortgageInputs((current) => ({ ...current, incomeVerified: event.target.checked }))
                }
              />
              Income verified
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={mortgageInputs.tdsWithinPolicy}
                onChange={(event) =>
                  setMortgageInputs((current) => ({ ...current, tdsWithinPolicy: event.target.checked }))
                }
              />
              TDS/GDS within policy
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={mortgageInputs.outstandingDerogatory}
                onChange={(event) =>
                  setMortgageInputs((current) => ({
                    ...current,
                    outstandingDerogatory: event.target.checked,
                  }))
                }
              />
              Outstanding derogatory bureau items
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={mortgageInputs.repaymentComfortable}
                onChange={(event) =>
                  setMortgageInputs((current) => ({
                    ...current,
                    repaymentComfortable: event.target.checked,
                  }))
                }
              />
              Repayment ability is comfortable
            </label>
          </div>

          <div className="result-grid">
            <div className="result-card">
              <span>Selected posted rate</span>
              <strong>{formatPct(selectedMortgageRate.postedRate)}</strong>
            </div>
            <div className="result-card">
              <span>Selected market rate</span>
              <strong>
                {selectedMortgageRate.competitiveRate === null
                  ? 'n/a'
                  : formatPct(selectedMortgageRate.competitiveRate)}
              </strong>
            </div>
            <div className="result-card">
              <span>Risk score</span>
              <strong>{riskScore}</strong>
            </div>
            <div className="result-card">
              <span>Recommended final rate</span>
              <strong>{formatPct(finalRate)}</strong>
            </div>
          </div>

          <div className="list-card">
            <h3>Decision rationale</h3>
            <ul>
              {mortgageDecision.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </article>

        <article className="panel panel-span-2">
          <div className="section-heading">
            <div>
              <p className="eyebrow">3. Editable Rules Administration</p>
              <h2>Pricing tables</h2>
            </div>
            <button type="button" className="secondary-button" onClick={() => setRules(defaultRules)}>
              Reset defaults
            </button>
          </div>

          <div className="admin-grid">
            {[
              ['Term adjustments', 'termOptions'],
              ['Beacon adjustments', 'beaconOptions'],
              ['Collateral adjustments', 'collateralOptions'],
              ['TDSR adjustments', 'tdsrOptions'],
              ['Job stability adjustments', 'jobStabilityOptions'],
              ['Service adjustments', 'serviceOptions'],
            ].map(([title, section]) => (
              <div key={section} className="list-card">
                <h3>{title}</h3>
                <div className="mini-table">
                  {(rules[section as keyof Pick<
                    RuleSet,
                    | 'termOptions'
                    | 'beaconOptions'
                    | 'collateralOptions'
                    | 'tdsrOptions'
                    | 'jobStabilityOptions'
                    | 'serviceOptions'
                  >] as RateOption[]).map((option) => (
                    <label key={option.label}>
                      <span>{option.label}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={option.addOnPct}
                        onChange={(event) =>
                          handleRuleChange(
                            section as keyof Pick<
                              RuleSet,
                              | 'termOptions'
                              | 'beaconOptions'
                              | 'collateralOptions'
                              | 'tdsrOptions'
                              | 'jobStabilityOptions'
                              | 'serviceOptions'
                            >,
                            option.label,
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mortgage term</th>
                  <th>Posted rate</th>
                  <th>Competitive market rate</th>
                </tr>
              </thead>
              <tbody>
                {rules.mortgageRates.map((rate) => (
                  <tr key={rate.term}>
                    <td>{rate.term}</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={rate.postedRate}
                        onChange={(event) =>
                          handleMortgageRateChange(rate.term, 'postedRate', Number(event.target.value))
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={rate.competitiveRate ?? 0}
                        disabled={rate.competitiveRate === null}
                        onChange={(event) =>
                          handleMortgageRateChange(rate.term, 'competitiveRate', Number(event.target.value))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">4. Approval Workflow</p>
              <h2>Routing and sign-off</h2>
            </div>
            <span className="pill">{workflowRoute}</span>
          </div>

          <div className="form-grid">
            <label>
              Member name
              <input value={memberName} onChange={(event) => setMemberName(event.target.value)} />
            </label>
            <label>
              Current user
              <input value={currentUser} onChange={(event) => setCurrentUser(event.target.value)} />
            </label>
            <label className="full-width">
              Loan purpose
              <input value={loanPurpose} onChange={(event) => setLoanPurpose(event.target.value)} />
            </label>
            <label className="full-width">
              Approval comments
              <textarea
                rows={4}
                value={approvalComment}
                onChange={(event) => setApprovalComment(event.target.value)}
              />
            </label>
            <label>
              Electronic signature
              <input value={signature} onChange={(event) => setSignature(event.target.value)} />
            </label>
          </div>

          <div className="approval-list">
            {workflowRoles.map((role) => (
              <label key={role}>
                <span>{role}</span>
                <select value={approvals[role]} onChange={(event) => handleApprovalChange(role, event.target.value as ApprovalState[keyof ApprovalState])}>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>
            ))}
          </div>

          <div className="button-row">
            <button type="button" onClick={saveCalculation}>
              Save to audit trail
            </button>
            <button type="button" className="secondary-button" onClick={() => window.print()}>
              Print rate sheet
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">5. Audit &amp; Reporting</p>
              <h2>Operational dashboard</h2>
            </div>
            <span className="pill">{auditLog.length} records</span>
          </div>

          <div className="result-grid">
            <div className="result-card">
              <span>Saved calculations</span>
              <strong>{dashboard.total}</strong>
            </div>
            <div className="result-card">
              <span>Escalated approvals</span>
              <strong>{dashboard.approvalsRequired}</strong>
            </div>
            <div className="result-card">
              <span>Average booked rate</span>
              <strong>{formatPct(dashboard.averageRate)}</strong>
            </div>
            <div className="result-card">
              <span>Average risk score</span>
              <strong>{dashboard.averageRisk.toFixed(1)}</strong>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Result</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {auditChecks.map((check) => (
                  <tr key={check.label}>
                    <td>{check.label}</td>
                    <td>{check.passed ? 'PASS' : 'FAIL'}</td>
                    <td>
                      <span className={`status ${check.passed ? 'pass' : 'fail'}`}>
                        {check.passed ? 'PASS' : 'REVIEW'}
                      </span>
                    </td>
                    <td>{check.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Member</th>
                  <th>User</th>
                  <th>Rate</th>
                  <th>Class</th>
                  <th>Route</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No audit records yet. Save a calculation to start the compliance trail.</td>
                  </tr>
                ) : (
                  auditLog.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.timestamp)}</td>
                      <td>{entry.memberName}</td>
                      <td>{entry.user}</td>
                      <td>{formatPct(entry.finalRate)}</td>
                      <td>{entry.mortgageClass}</td>
                      <td>{entry.route}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel panel-span-2 print-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">6. Printable approval sheet</p>
              <h2>Output print view</h2>
            </div>
            <span className="pill">Browser print ready</span>
          </div>

          <div className="print-sheet">
            <div>
              <h3>Member information</h3>
              <p><strong>Name:</strong> {memberName}</p>
              <p><strong>Loan purpose:</strong> {loanPurpose}</p>
              <p><strong>User:</strong> {currentUser}</p>
              <p><strong>Timestamp:</strong> {formatDateTime(new Date().toISOString())}</p>
            </div>
            <div>
              <h3>Rate outcome</h3>
              <p><strong>Mortgage class:</strong> {mortgageDecision.classification}</p>
              <p><strong>Total add-on:</strong> {formatPct(totalAddOn)}</p>
              <p><strong>Override:</strong> {formatPct(overridePct)}</p>
              <p><strong>Final rate:</strong> {formatPct(finalRate)}</p>
            </div>
            <div>
              <h3>Approval summary</h3>
              <p><strong>Route:</strong> {workflowRoute}</p>
              <p><strong>Comment:</strong> {approvalComment}</p>
              <p><strong>Signature:</strong> {signature}</p>
            </div>
          </div>
        </article>

        <article className="panel panel-span-2">
          <div className="section-heading">
            <div>
              <p className="eyebrow">7. Policy guidance</p>
              <h2>Reference content from the workbook</h2>
            </div>
          </div>

          <div className="info-grid">
            <div className="list-card">
              <h3>Mortgage criteria</h3>
              {mortgageCriteria.map((criteria) => (
                <div key={criteria.name} className="criteria-block">
                  <h4>{criteria.name}</h4>
                  <ul>
                    {criteria.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="list-card">
              <h3>Usage guidance</h3>
              <ul>
                {guidance.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3>Renewal process</h3>
              <ol>
                {renewalProcess.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
