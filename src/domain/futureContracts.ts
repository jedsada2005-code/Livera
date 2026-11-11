import type { Evidence, BenefitCashflow, FundingKind } from './catalog';
// Detailed contracts reserved for rounds 8–9. Round 6 collects only a small starter draft.
export type Money=Evidence<number>; // Integer satang; null means unknown, never zero.
export type RuleVersion={id:string;kind:'tax'|'sso';jurisdiction:'TH';effectiveFrom:string;effectiveUntil:string|null;checkedOn:string;sourceUrl:string};
export type SourceLink={id:string;kind:FundingKind;origin:'member'|'owned-policy'|'statement';linkedRecordId:string|null;alreadyIncludedInOpeningBalance:boolean};
export type SavingsDetails=SourceLink&{kind:'savings';openingBalanceSatang:Money;monthlyContributionSatang:Money;annualNetReturnPercent:Evidence<number>;contributionTiming:'month-end'};
export type PolicyDetails=SourceLink&{kind:'insurance';ownedPolicyId:string|null;benefits:Evidence<BenefitCashflow[]>;cashbackTreatment:'spend'|'reinvest'|'undecided';surrenderAssumed:boolean;guaranteedOnly:boolean};
export type PvdDetails=SourceLink&{kind:'pvd';openingEmployeeBalanceSatang:Money;openingEmployerBalanceSatang:Money;monthlySalarySatang:Money;salaryGrowthPercent:Evidence<number>;employeeContributionPercent:Evidence<number>;employerContributionPercent:Evidence<number>;employerVestedPercent:Evidence<number>;annualNetReturnPercent:Evidence<number>;expectedExitDate:string|null;netOfTax:boolean|null};
export type SsoDetails=SourceLink&{kind:'sso';section:'33'|'39'|'40'|'unknown';contributionMonths:Evidence<number>;assessableWageHistory:Evidence<{month:string;satang:number}[]>;expectedMembershipEnd:string|null;expectedClaimAge:Evidence<number>;manualMonthlyPensionSatang:Money;ruleVersionId:string|null};
export type TaxDetails=SourceLink&{kind:'tax';taxYear:number;annualIncomeSatang:Money;otherAllowancesSatang:Money;deductibleItems:{id:string;linkedRecordId:string|null;kind:string;paidSatang:Money}[];taxSavingSatang:Money;reinvestSaving:boolean;ruleVersionId:string|null};
export type FundingDetails=SavingsDetails|PolicyDetails|PvdDetails|SsoDetails|TaxDetails;
export type ResidenceCostPlan={residenceId:string|null;packageId:string|null;startYear:number;years:number;occupants:number;monthlyCareSupplementSatang:Money;monthlyOtherCostsSatang:Money;refundableDepositSatang:Money;depositRefundAssumption:'not-assumed'|'contract-confirmed';annualEscalationPercent:Evidence<number>};
export type AccumulationPlan={version:1;asOfDate:string;age:number;targetAge:number;endAge:number;sources:FundingDetails[];residence:ResidenceCostPlan|null;inflationPercent:Evidence<number>};
export type ResultTrace={sourceRecordId:string;year:number;includedAs:'asset'|'cashflow'|'excluded';reason:string};
export type AccumulationResult={valuationDate:string;assetAtTargetSatang:Money;monthlyIncomeSatang:Money;residenceCostSatang:Money;gapSatang:Money;additionalMonthlySavingSatang:Money;trace:ResultTrace[];assumptions:string[];ruleVersionIds:string[]};
