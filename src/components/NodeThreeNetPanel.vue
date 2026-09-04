<script setup lang="ts">
import type { NodeData } from '@/stores/nodes'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { useNodePingDisplay } from '@/composables/useNodePingDisplay'

const props = defineProps<{ node: NodeData }>()

const { providerRows } = useNodePingDisplay(props.node.uuid)

/** 运营商对应的前缀圆点色 */
function providerDotColor(key: string): string {
  switch (key) {
    case 'ct': return 'bg-rose-500'
    case 'cu': return 'bg-orange-500'
    case 'cm': return 'bg-emerald-500'
    default: return 'bg-slate-400'
  }
}

/** 将柱条数组转为整行 tooltip 文本 */
function barsTooltipText(bars: { tooltip: string }[]): string {
  return bars.map(b => b.tooltip).join('\n')
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <!-- 延迟 -->
    <div class="flex items-center text-[11px] leading-none gap-2">
      <span class="text-muted-foreground w-7 shrink-0">延迟</span>
      <div class="flex-1 min-w-0" />
      <span class="font-medium tabular-nums shrink-0 min-w-[2.4em]" />
      <span class="text-[10px] text-muted-foreground/60 shrink-0">ms</span>
      <div class="flex-1 min-w-0" />
      <span class="font-medium tabular-nums shrink-0 min-w-[2.6em]" />
    </div>

    <div v-for="row in providerRows" :key="row.key" class="flex items-center text-[11px] leading-none gap-2">
      <!-- 运营商标识 -->
      <span class="size-2 rounded-full shrink-0" :class="providerDotColor(row.key)" />
      <span class="text-muted-foreground w-7 shrink-0 whitespace-nowrap">{{ row.name }}</span>
      <!-- 延迟柱状图 -->
      <div class="flex-1 min-w-0">
        <DataTooltip placement="top" :content="barsTooltipText(row.latencyBars)" content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]" class="!block w-full">
          <div
            class="grid h-5 items-end gap-[1px] cursor-default"
            :style="{ gridTemplateColumns: `repeat(${row.latencyBars.length}, minmax(0, 1fr))` }"
          >
            <span
              v-for="bar in row.latencyBars" :key="bar.key"
              class="block h-full w-full rounded-sm transition-all duration-150 hover:scale-y-125 hover:brightness-110"
              :class="bar.className"
              :title="bar.tooltip"
            />
          </div>
        </DataTooltip>
      </div>
      <!-- 延迟数值 -->
      <span class="font-medium tabular-nums shrink-0 text-right min-w-[2.4em]" :class="row.latencyToneClass">{{ row.latency }}</span>
      <span class="text-[10px] text-muted-foreground/60 shrink-0">ms</span>
      <!-- 丢包柱状图 -->
      <div class="flex-1 min-w-0">
        <DataTooltip placement="top" :content="barsTooltipText(row.lossBars)" content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]" class="!block w-full">
          <div
            class="grid h-5 items-end gap-[1px] cursor-default"
            :style="{ gridTemplateColumns: `repeat(${row.lossBars.length}, minmax(0, 1fr))` }"
          >
            <span
              v-for="bar in row.lossBars" :key="bar.key"
              class="block h-full w-full rounded-sm transition-all duration-150 hover:scale-y-125 hover:brightness-110"
              :class="bar.className"
              :title="bar.tooltip"
            />
          </div>
        </DataTooltip>
      </div>
      <!-- 丢包率 -->
      <span class="font-medium tabular-nums shrink-0 text-right min-w-[2.6em]" :class="row.lossToneClass">{{ row.loss }}</span>
    </div>
  </div>
</template>
