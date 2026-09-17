import type { Group } from "@/types/models"

export type GroupWithCount = Group & {
  _count: {
    members: number
  }
  currentFund?: number
}
