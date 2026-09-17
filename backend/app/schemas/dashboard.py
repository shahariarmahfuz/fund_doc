from typing import List, Optional
from pydantic import BaseModel
from app.schemas.common import BaseSchema

class GroupDistributionItem(BaseModel):
    name: str
    value: float

class MonthlyChartItem(BaseModel):
    month: str
    contributions: float
    loans: float
    grants: float

class MetricComparison(BaseModel):
    current: float
    previous: Optional[float] = None
    change_percentage: Optional[float] = None
    has_comparison: bool = False
    has_data: bool = False

class DashboardStats(BaseModel):
    totalMembers: int
    activeMembers: int
    inactiveMembers: int
    totalGroups: int
    foundationTotalFund: MetricComparison
    totalGroupFunds: MetricComparison
    currentCashBalance: MetricComparison
    totalContributions: MetricComparison
    totalActiveLoans: int
    outstandingLoanAmount: float
    totalGrants: int
    totalBeneficiaries: int
    groupFundDistribution: List[GroupDistributionItem]
    monthlyChartData: List[MonthlyChartItem]
