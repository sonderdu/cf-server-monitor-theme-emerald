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
  <div class="grid grid-cols-2 gap-3">
    <!-- 延迟列 -->
    <div class="flex flex-col gap-1.5">
      <div class="text-[11px] font-medium text-muted-foreground">延迟</div>
      <div v-for="row in providerRows" :key="`latency-${row.key}`" class="flex items-center text-[11px] leading-none gap-1.5">
        <span class="size-2 rounded-full shrink-0" :class="providerDotColor(row.key)" />
        <span class="text-muted-foreground w-5 shrink-0">{{ row.name }}</span>
        <div
          class="grid h-2 flex-1 items-end gap-[0.5px]"
          :style="{ gridTemplateColumns: `repeat(${row.latencyBars.length}, minmax(0, 1fr))` }"
        >
          <DataTooltip
            v-for="bar in row.latencyBars" :key="bar.key" placement="top"
            :content="bar.tooltip" class="h-full w-full"
            content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
          >
            <span
              class="block h-full w-full rounded-[0.5px] transition-transform duration-150 group-hover/data-tooltip:scale-y-150"
              :class="bar.className"
            />
          </DataTooltip>
        </div>
        <span class="font-medium tabular-nums shrink-0 text-right" :class="row.latencyToneClass">{{ row.latency }}</span>
        <span class="text-[10px] text-muted-foreground/70 shrink-0">ms</span>
      </div>
    </div>

    <!-- 丢包列 -->
    <div class="flex flex-col gap-1.5">
      <div class="text-[11px] font-medium text-muted-foreground">丢包</div>
      <div v-for="row in providerRows" :key="`loss-${row.key}`" class="flex items-center text-[11px] leading-none gap-1.5">
        <span class="size-2 rounded-full shrink-0" :class="providerDotColor(row.key)" />
        <span class="text-muted-foreground w-5 shrink-0">{{ row.name }}</span>
        <div
          class="grid h-2 flex-1 items-end gap-[0.5px]"
          :style="{ gridTemplateColumns: `repeat(${row.lossBars.length}, minmax(0, 1fr))` }"
        >
          <DataTooltip
            v-for="bar in row.lossBars" :key="bar.key" placement="top"
            :content="bar.tooltip" class="h-full w-full"
            content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
          >
            <span
              class="block h-full w-full rounded-[0.5px] transition-transform duration-150 group-hover/data-tooltip:scale-y-150"
              :class="bar.className"
            />
          </DataTooltip>
        </div>
        <span class="font-medium tabular-nums shrink-0 text-right" :class="row.lossToneClass">{{ row.loss }}</span>
      </div>
    </div>
  </div>
</template>
