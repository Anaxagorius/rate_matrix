export type RateOption = {
  label: string
  addOnPct: number
}

export type MortgageRate = {
  term: string
  postedRate: number
  competitiveRate: number | null
}

export type MortgageCriteria = {
  name: string
  bullets: string[]
}

export type RuleSet = {
  termOptions: RateOption[]
  beaconOptions: RateOption[]
  collateralOptions: RateOption[]
  tdsrOptions: RateOption[]
  jobStabilityOptions: RateOption[]
  serviceOptions: RateOption[]
  mortgageRates: MortgageRate[]
}

export const defaultRules: RuleSet = {
  termOptions: [
    { label: 'Variable', addOnPct: 0 },
    { label: '1 year', addOnPct: 2 },
    { label: '2 years', addOnPct: 2 },
    { label: '3 years', addOnPct: 2.25 },
    { label: '4 years', addOnPct: 2.5 },
    { label: '5 years', addOnPct: 2.75 },
  ],
  beaconOptions: [
    { label: 'Over 700', addOnPct: 0.25 },
    { label: '650-699', addOnPct: 0.5 },
    { label: '620-649', addOnPct: 1.5 },
    { label: '600-619', addOnPct: 2 },
    { label: '500-599', addOnPct: 4 },
    { label: 'Under 499', addOnPct: 7 },
  ],
  collateralOptions: [
    { label: 'None', addOnPct: 0 },
    { label: 'CUFM Securities Monitored', addOnPct: 0.25 },
    { label: 'Motor Vehicle: New-3 Yrs', addOnPct: 0.5 },
    { label: 'Motor Vehicle: 4-5 Yrs', addOnPct: 0.75 },
    { label: 'Motor Vehicle: >5 Yrs', addOnPct: 1 },
    { label: 'Unsecured', addOnPct: 2 },
  ],
  tdsrOptions: [
    { label: '< 20%', addOnPct: 0.25 },
    { label: '20% to 24.9%', addOnPct: 0.35 },
    { label: '25% to 29.9%', addOnPct: 0.5 },
    { label: '30% to 35%', addOnPct: 0.75 },
    { label: '35% to 39.9%', addOnPct: 1 },
    { label: 'Over 40%', addOnPct: 1.25 },
  ],
  jobStabilityOptions: [
    { label: 'Over 8 years', addOnPct: 0 },
    { label: '5yrs to 8yrs', addOnPct: 0.25 },
    { label: '2yrs to 5yrs', addOnPct: 0.5 },
    { label: 'Less than 2 yrs', addOnPct: 0.75 },
  ],
  serviceOptions: [
    { label: '4+ and Day to Day Account', addOnPct: 0 },
    { label: '4 or more', addOnPct: 0.15 },
    { label: '1 to 3', addOnPct: 0.25 },
    { label: 'No services', addOnPct: 0.5 },
  ],
  mortgageRates: [
    { term: '6 month closed', postedRate: 7.69, competitiveRate: null },
    { term: '6 month open', postedRate: 9.19, competitiveRate: null },
    { term: '1 year', postedRate: 7.19, competitiveRate: 5.19 },
    { term: '2 years', postedRate: 7.09, competitiveRate: 5.09 },
    { term: '3 years', postedRate: 6.99, competitiveRate: 4.99 },
    { term: '4 years', postedRate: 6.89, competitiveRate: 4.89 },
    { term: '5 years', postedRate: 6.79, competitiveRate: 4.79 },
  ],
}

export const mortgageCriteria: MortgageCriteria[] = [
  {
    name: 'A Mortgage',
    bullets: [
      'Insured or uninsured.',
      'Minimum 650 beacon with no outstanding derogatory bureau items.',
      'Good quality property or issues addressed through appraisal/improvements.',
      'Income verified using standard internal procedures including TDS and GDS.',
      'Priced at competitive market rates.',
      'Mortgages under $100K add 0.50% to the best available rate.',
    ],
  },
  {
    name: 'B Mortgage',
    bullets: [
      'Insured or uninsured.',
      'Minimum 600 beacon with no outstanding derogatory bureau items.',
      'Good quality property.',
      'Repayment ability is comfortable, even when income is not fully verifiable.',
      'Use VCU posted pricing, with insured deals eligible for up to 1.00% off 5-year posted provided the rate remains at or above market.',
      'Uninsured discounts require Head Office approval.',
    ],
  },
  {
    name: 'C Mortgage',
    bullets: [
      'Uninsured only.',
      'Credit challenged, often below 600 beacon.',
      'Fair-condition or hard-to-market property may be acceptable.',
      'Maximum 65% LTV.',
      'Repayment ability must still be comfortable.',
      'Price at 3- to 5-year posted plus at least 2.00%.',
    ],
  },
]

export const guidance = [
  'Print from the rate sheet section only.',
  'Open the application in a full browser window for the cleanest print output.',
  'Refresh and retry printing if the generated rate sheet appears stale.',
  'Administrators should update pricing through the rules tables rather than editing formulas.',
  'Use this application as the centralized source of truth for pricing and classification decisions.',
]

export const renewalProcess = [
  'Review the existing mortgage, prior discounting, property profile, and member history 60 to 90 days before maturity.',
  'Contact the member to confirm future plans such as renovation, sale, consolidation, or refinancing needs.',
  'Renew A mortgages directly when no new needs or risk changes are identified.',
  'Reassess B and C mortgages using updated credit, repayment, and relationship details before renewal.',
  'Document all renewal outreach, decisions, and terms for audit readiness.',
]

export const workflowRoles = ['Lending Officer', 'Branch Manager', 'Credit Manager', 'Head Office'] as const
