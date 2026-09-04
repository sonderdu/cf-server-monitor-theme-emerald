import type { MaybeRefOrGetter } from 'vue'
import type { NodeStatusPing, PingProviderWindowPoint } from '@/utils/rpc'
import { computed, toValue } from 'vue'
import { NODE_PING_BAR_COUNT, useNodePingStats } from '@/composables/useNodePingStats'
import { useNodesStore } from '@/stores/nodes'
import { formatDateTime } from '@/utils/helper'
import { getPingToneClass, PING_PROVIDERS } from '@/utils/nodeHelper'

export type NodePingMetric = 'latency' | 'loss'

export interface NodePingBar {
  key: string
  className: string
  tooltip: string
}

/** 三网面板每行柱条数量 */
export const PROVIDER_PING_BAR_COUNT = 10

interface UseNodePingDisplayOptions {
  enabled?: MaybeRefOrGetter<boolean>
  loadingDisplayText?: string
  emptyDisplayText?: string
  loadingPanelTooltipText?: Partial<Record<NodePingMetric, string>>
  emptyPanelTooltipText?: Partial<Record<NodePingMetric, string>>
}

function getLatencyToneClass(latency: number): string {
  if (latency <= 60)
    return 'bg-emerald-600/90'
  if (latency <= 120)
    return 'bg-green-500/80'
  if (latency <= 180)
    return 'bg-lime-400/80'
  if (latency <= 240)
    return 'bg-yellow-400/80'
  return 'bg-rose-500/80'
}

function getLossToneClass(loss: number): string {
  if (loss <= 1)
    return 'bg-emerald-600/90'
  if (loss <= 3)
    return 'bg-green-500/80'
  if (loss <= 6)
    return 'bg-lime-400/80'
  if (loss <= 9)
    return 'bg-yellow-400/80'
  return 'bg-rose-500/80'
}

/**
 * 将数据集按时间平均划分为 barCount 根柱子，
 * 每根柱取段内数据点的平均值（无论段内几条数据）。
 */
function segmentMetricBars(points: PingProviderWindowPoint[], metric: NodePingMetric, barCount: number): NodePingBar[] {
  if (!points.length)
    return []

  const count = Math.min(barCount, points.length)
  const firstTime = Date.parse(points[0]!.time)
  const lastTime = Date.parse(points.at(-1)!.time)
  const segmentSize = Math.max(1, (lastTime - firstTime) / count)

  const bars: NodePingBar[] = []
  for (let index = 0; index < count; index++) {
    const segmentStart = firstTime + index * segmentSize
    const segmentEnd = index === count - 1 ? lastTime + 1 : segmentStart + segmentSize
    const segmentPoints = points.filter((point) => {
      const time = Date.parse(point.time)
      return time >= segmentStart && time < segmentEnd
    })

    const latencyValues = segmentPoints
      .map(point => point.latency)
      .filter((value): value is number => value !== null)
    const lossValues = segmentPoints
      .map(point => point.loss)
      .filter((value): value is number => value !== null)

    const value = metric === 'latency'
      ? latencyValues.length
        ? latencyValues.reduce((sum, v) => sum + v, 0) / latencyValues.length
        : null
      : lossValues.length
        ? lossValues.reduce((sum, v) => sum + v, 0) / lossValues.length
        : null
    const segmentTime = new Date(segmentStart).toISOString()

    bars.push({
      key: `${segmentTime}-${index}`,
      className: value === null
        ? 'bg-muted-foreground/15'
        : metric === 'latency'
          ? getLatencyToneClass(value)
          : getLossToneClass(value),
      tooltip: value === null
        ? `${formatDateTime(segmentTime, 'HH:mm:ss')} N/A`
        : metric === 'latency'
          ? `${formatDateTime(segmentTime, 'HH:mm:ss')}\n${Math.round(value)} ms`
          : `${formatDateTime(segmentTime, 'HH:mm:ss')}\n${value.toFixed(1)}%`,
    })
  }

  return bars
}

export interface TopPingNetwork {
  key: string
  name: string
  latency: string
  toneClass: string
  tooltip: string
}

export interface ProviderPingRow {
  key: string
  name: string
  available: boolean
  latency: string
  latencyToneClass: string
  loss: string
  lossToneClass: string
  volatility: string
  latencyBars: NodePingBar[]
  lossBars: NodePingBar[]
}

/** 取前 3 个网络的实时延迟（CT/CU/CM），用于「三网」行 */
export function buildTopPingNetworks(ping?: Record<string, NodeStatusPing>): TopPingNetwork[] {
  return PING_PROVIDERS.slice(0, 3).map((provider) => {
    const entry = ping?.[provider.key]
    const latency = entry?.latest ?? 0
    const loss = entry?.loss ?? 100
    const available = latency > 0 && loss < 100

    return {
      key: provider.key,
      name: entry?.name ?? provider.label,
      latency: available ? `${Math.round(latency)}ms` : '--',
      toneClass: getPingToneClass(latency, available),
      tooltip: available
        ? `${entry?.name ?? provider.label}\n${Math.round(latency)} ms`
        : `${entry?.name ?? provider.label}\n暂无响应`,
    }
  })
}

export function useNodePingDisplay(
  uuid: MaybeRefOrGetter<string>,
  options: UseNodePingDisplayOptions = {},
) {
  // Home-card samples are appended by the shared subscribe=all WebSocket.
  const pingStatsEnabled = computed(() => options.enabled === undefined || toValue(options.enabled))

  const pingStats = useNodePingStats(uuid, {
    enabled: pingStatsEnabled,
  })

  const latencyBars = computed(() => segmentMetricBars(pingStats.history.value, 'latency', NODE_PING_BAR_COUNT))
  const lossBars = computed(() => segmentMetricBars(pingStats.history.value, 'loss', NODE_PING_BAR_COUNT))

  function buildEmptyPingBars(metric: NodePingMetric): NodePingBar[] {
    const tooltip = pingStats.loading.value
      ? '加载中'
      : pingStats.error.value
        ? '加载失败'
        : !pingStatsEnabled.value
            ? '未启用记录'
            : metric === 'latency'
              ? 'N/A'
              : 'N/A'

    return Array.from({ length: NODE_PING_BAR_COUNT }, (_, index) => ({
      key: `${metric}-empty-${index}`,
      className: 'bg-muted-foreground/10',
      tooltip,
    }))
  }

  const latencyRenderBars = computed(() => latencyBars.value.length ? latencyBars.value : buildEmptyPingBars('latency'))
  const lossRenderBars = computed(() => lossBars.value.length ? lossBars.value : buildEmptyPingBars('loss'))

  const latencyDisplay = computed(() => {
    if (pingStats.hasData.value)
      return `${Math.round(pingStats.avgLatency.value)} ms`
    if (pingStats.loading.value)
      return options.loadingDisplayText ?? '加载中'
    return options.emptyDisplayText ?? '-'
  })

  const lossDisplay = computed(() => {
    if (pingStats.hasData.value)
      return `${pingStats.avgLoss.value.toFixed(1)}%`
    if (pingStats.loading.value)
      return options.loadingDisplayText ?? '加载中'
    return options.emptyDisplayText ?? '-'
  })

  const latencyPanelTooltip = computed(() => {
    if (!pingStats.hasData.value) {
      if (pingStats.loading.value)
        return options.loadingPanelTooltipText?.latency ?? ''
      return options.emptyPanelTooltipText?.latency ?? ''
    }
    return `平均延迟 ${Math.round(pingStats.avgLatency.value)} ms`
  })

  const lossPanelTooltip = computed(() => {
    if (!pingStats.hasData.value) {
      if (pingStats.loading.value)
        return options.loadingPanelTooltipText?.loss ?? ''
      return options.emptyPanelTooltipText?.loss ?? ''
    }

    const volatility = pingStats.avgVolatility.value > 0
      ? `，平均波动 ${pingStats.avgVolatility.value.toFixed(2)}`
      : ''
    return `平均丢包 ${pingStats.avgLoss.value.toFixed(1)}%${volatility}`
  })

  // ===== 三网面板：按运营商拆分的延迟 / 丢包 / 波动率 =====
  const nodesStore = useNodesStore()
  const providerHistory = computed(() => nodesStore.pingProviderHistoryByUuid[toValue(uuid)] ?? {})
  const nodePing = computed(() => nodesStore.nodesByUuid.get(toValue(uuid))?.ping)

  /** 波动率：窗口内延迟序列的标准差（ms），衡量网络稳定性 */
  function latencyVolatility(points: PingProviderWindowPoint[]): number | null {
    const values = points
      .map(point => point.latency)
      .filter((value): value is number => value !== null)
    if (values.length < 2)
      return null
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
    return Math.sqrt(variance)
  }

  function buildEmptyProviderBars(metric: NodePingMetric, providerKey: string): NodePingBar[] {
    return Array.from({ length: PROVIDER_PING_BAR_COUNT }, (_, index) => ({
      key: `${providerKey}-${metric}-empty-${index}`,
      className: 'bg-muted-foreground/10',
      tooltip: 'N/A',
    }))
  }

  const providerRows = computed<ProviderPingRow[]>(() => {
    return PING_PROVIDERS.slice(0, 3).map((provider) => {
      const entry = nodePing.value?.[provider.key]
      const points = providerHistory.value[provider.key] ?? []
      const latency = entry?.latest ?? 0
      const loss = entry?.loss ?? 100
      const available = latency > 0 && loss < 100
      const volatility = latencyVolatility(points)

      const latencyBars = segmentMetricBars(points, 'latency', PROVIDER_PING_BAR_COUNT)
      const lossBars = segmentMetricBars(points, 'loss', PROVIDER_PING_BAR_COUNT)

      return {
        key: provider.key,
        name: entry?.name ?? provider.label,
        available,
        latency: available ? `${Math.round(latency)}` : '--',
        latencyToneClass: getPingToneClass(latency, available),
        loss: available ? `${loss.toFixed(1)}%` : '--',
        lossToneClass: available
          ? loss <= 1
            ? 'text-emerald-600 dark:text-emerald-400'
            : loss <= 5
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-rose-600 dark:text-rose-400'
          : 'text-muted-foreground',
        volatility: volatility === null ? '--' : `±${Math.round(volatility)}`,
        latencyBars: latencyBars.length ? latencyBars : buildEmptyProviderBars('latency', provider.key),
        lossBars: lossBars.length ? lossBars : buildEmptyProviderBars('loss', provider.key),
      }
    })
  })

  return {
    pingStats,
    pingStatsEnabled,
    latencyRenderBars,
    lossRenderBars,
    latencyDisplay,
    lossDisplay,
    latencyPanelTooltip,
    lossPanelTooltip,
    providerRows,
  }
}
