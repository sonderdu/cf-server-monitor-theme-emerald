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
</script>

<template>
  <div class="flex flex-col gap-1">
    <div v-for="row in providerRows" :key="row.key" class="flex items-center text-[11px] leading-none gap-1.5">
      <!-- 运营商标识 -->
      <span class="size-2 rounded-full shrink-0" :class="providerDotColor(row.key)" />
      <span class="text-muted-foreground w-4 shrink-0">{{ row.name }}</span>
      <!-- 延迟柱状图 -->
      <div
        class="grid h-2 flex-1 items-end gap-[1px]"
        :style="{ gridTemplateColumns: `repeat(${row.latencyBars.length}, minmax(0, 1fr))` }"
      >
        <DataTooltip
          v-for="bar in row.latencyBars" :key="bar.key" placement="top"
          :content="bar.tooltip" class="h-full w-full"
          content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
        >
          <span
            class="block h-full w-full rounded-sm transition-transform duration-150 group-hover/data-tooltip:scale-y-150"
            :class="bar.className"
          />
        </DataTooltip>
      </div>
      <!-- 延迟数值 -->
      <span class="font-medium tabular-nums shrink-0 text-right min-w-[2.2em]" :class="row.latencyToneClass">{{ row.latency }}</span>
      <span class="text-[10px] text-muted-foreground/60 shrink-0 ml-2">ms</span>
      <!-- 丢包柱状图 -->
      <div
        class="grid h-2 flex-1 items-end gap-[1px] ml-1"
        :style="{ gridTemplateColumns: `repeat(${row.lossBars.length}, minmax(0, 1fr))` }"
      >
        <DataTooltip
          v-for="bar in row.lossBars" :key="bar.key" placement="top"
          :content="bar.tooltip" class="h-full w-full"
          content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
        >
          <span
            class="block h-full w-full rounded-sm transition-transform duration-150 group-hover/data-tooltip:scale-y-150"
            :class="bar.className"
          />
        </DataTooltip>
      </div>
      <!-- 丢包率 -->
      <span class="font-medium tabular-nums shrink-0 text-right min-w-[2.5em]" :class="row.lossToneClass">{{ row.loss }}</span>
    </div>
  </div>
</template>
