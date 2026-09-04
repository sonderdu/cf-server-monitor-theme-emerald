<script setup lang="ts">
import type { NodeData } from '@/stores/nodes'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { useNodePingDisplay } from '@/composables/useNodePingDisplay'

const props = defineProps<{ node: NodeData }>()

const { providerRows } = useNodePingDisplay(props.node.uuid)
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-for="row in providerRows" :key="row.key" class="flex flex-col gap-1">
      <div class="flex items-center text-[11px] leading-none">
        <span class="text-muted-foreground">{{ row.name }}</span>
        <div class="border-t-2 border-dotted border-gray-500/10 mx-2 flex-1" />
        <div class="flex items-baseline gap-0.5">
          <span class="font-medium" :class="row.latencyToneClass">{{ row.latency }}</span>
          <span class="text-[10px] text-muted-foreground">ms</span>
        </div>
        <span
          class="mx-2 text-[10px] text-muted-foreground/70"
          title="网络波动（窗口内延迟标准差）"
        >{{ row.volatility }}</span>
        <span class="font-medium" :class="row.lossToneClass">{{ row.loss }}</span>
      </div>
      <div class="flex gap-1.5">
        <div
          class="grid h-1.5 flex-1 items-end gap-[1px]"
          :style="{ gridTemplateColumns: `repeat(${row.latencyBars.length}, minmax(0, 1fr))` }"
        >
          <DataTooltip
            v-for="bar in row.latencyBars" :key="bar.key" placement="top"
            :content="bar.tooltip" class="h-full w-full"
            content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
          >
            <span
              class="block h-full w-full rounded-[1px] transition-transform duration-150 group-hover/data-tooltip:scale-y-150"
              :class="bar.className"
            />
          </DataTooltip>
        </div>
        <div
          class="grid h-1.5 flex-1 items-end gap-[1px]"
          :style="{ gridTemplateColumns: `repeat(${row.lossBars.length}, minmax(0, 1fr))` }"
        >
          <DataTooltip
            v-for="bar in row.lossBars" :key="bar.key" placement="top"
            :content="bar.tooltip" class="h-full w-full"
            content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
          >
            <span
              class="block h-full w-full rounded-[1px] transition-transform duration-150 group-hover/data-tooltip:scale-y-150"
              :class="bar.className"
            />
          </DataTooltip>
        </div>
      </div>
    </div>
  </div>
</template>
