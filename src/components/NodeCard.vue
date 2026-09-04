<script setup lang="ts">
import { computed } from 'vue'
import { CardX } from '@/components/ui/card-x'
import { ProgressThin } from '@/components/ui/progress-thin'
import { Badge } from '@/components/ui/badge'
import { formatBytes, formatUptime } from '@/utils/helper'
import { Icon } from '@iconify/vue'
import { getOSImage } from '@/utils/osImageHelper'

// Define the interface inline to avoid TS2307 import errors
interface NodeData {
  name: string;
  region?: string;
  status?: {
    online: boolean;
    uptime?: number;
    memory_used?: number;
    memory_total?: number;
    swap_used?: number;
    swap_total?: number;
    hdd_used?: number;
    hdd_total?: number;
    cpu?: number;
    network_out?: number;
    ping?: number | string;
    loss?: number | string;
    os?: string;
    // Specific ping fields from huilang-me/CF-Server-Monitor
    ping_ct?: string | number;
    ping_cu?: string | number;
    ping_cm?: string | number;
    loss_ct?: string | number;
    loss_cu?: string | number;
    loss_cm?: string | number;
    [key: string]: any;
  };
}

const props = defineProps<{
  node: NodeData
}>()

const statusText = computed(() => {
  if (!props.node.status?.online) return '离线'
  return formatUptime(props.node.status.uptime || 0)
})

const memoryPercent = computed(() => {
  if (!props.node.status?.online || !props.node.status.memory_total) return 0
  return ((props.node.status.memory_used! / props.node.status.memory_total) * 100).toFixed(1)
})

const swapPercent = computed(() => {
  if (!props.node.status?.online || !props.node.status.swap_total) return 0
  return ((props.node.status.swap_used! / props.node.status.swap_total) * 100).toFixed(1)
})

const diskPercent = computed(() => {
  if (!props.node.status?.online || !props.node.status.hdd_total) return 0
  return ((props.node.status.hdd_used! / props.node.status.hdd_total) * 100).toFixed(1)
})

const cpuPercent = computed(() => {
  if (!props.node.status?.online || props.node.status.cpu === undefined) return 0
  return Number(props.node.status.cpu).toFixed(1)
})

const trafficPercent = computed(() => {
  if (!props.node.status?.online) return 0
  const maxTraffic = 500 * 1024 * 1024 * 1024 // Fallback to 500GB
  const outTraffic = Number(props.node.status.network_out || 0)
  return Math.min(((outTraffic / maxTraffic) * 100), 100).toFixed(1)
})

const trafficFormattedText = computed(() => {
  if (!props.node.status?.online) return '0 B / 0 B'
  const outTraffic = Number(props.node.status.network_out || 0)
  const maxTraffic = 500 * 1024 * 1024 * 1024 // Fallback to 500GB
  return `${formatBytes(outTraffic)} / ${formatBytes(maxTraffic)}`
})

const isOnline = computed(() => props.node.status?.online === true)
const isOffline = computed(() => !isOnline.value)

// Safely get ping and loss data matching CF-Server-Monitor API
const getPingData = (pingKey: 'ping_ct' | 'ping_cu' | 'ping_cm', lossKey: 'loss_ct' | 'loss_cu' | 'loss_cm') => {
  if (!props.node.status) return { avg: 0, loss: 0 }
  
  // Try to get specific network data, parse from string if necessary
  const rawPing = props.node.status[pingKey] ?? props.node.status.ping ?? 0
  const rawLoss = props.node.status[lossKey] ?? props.node.status.loss ?? 0
  
  const parsedPing = typeof rawPing === 'string' ? parseFloat(rawPing) : rawPing;
  const parsedLoss = typeof rawLoss === 'string' ? parseFloat(rawLoss) : rawLoss;
  
  return {
    avg: isNaN(parsedPing) ? 0 : parsedPing,
    loss: isNaN(parsedLoss) ? 0 : parsedLoss
  }
}

const networkData = computed(() => ({
  telecom: getPingData('ping_ct', 'loss_ct'),
  unicom: getPingData('ping_cu', 'loss_cu'),
  mobile: getPingData('ping_cm', 'loss_cm')
}))

</script>

<template>
  <CardX class="flex flex-col h-full bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:bg-zinc-800/50">
    <div class="p-4 flex-1 flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="relative flex-shrink-0">
            <img :src="getOSImage(node.status?.os || 'unknown')" class="w-8 h-8 rounded-sm opacity-90 object-contain" :alt="node.status?.os || 'OS'" />
            <div 
              class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900"
              :class="isOnline ? 'bg-emerald-500' : 'bg-red-500'"
            />
          </div>
          <div class="min-w-0 flex flex-col">
            <h3 class="font-medium text-zinc-200 truncate flex items-center gap-2">
              {{ node.name }}
              <Badge v-if="node.region" variant="outline" class="text-[10px] px-1.5 py-0 border-zinc-700 text-zinc-400">
                {{ node.region }}
              </Badge>
            </h3>
            <span class="text-xs text-zinc-500 truncate mt-0.5">
              {{ node.status?.os || 'Unknown OS' }} • {{ statusText }}
            </span>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3" :class="{'opacity-50': isOffline}">
        <!-- CPU -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-zinc-400 flex items-center gap-1.5">
              <Icon icon="ph:cpu" class="w-3.5 h-3.5" />
              CPU
            </span>
            <span class="font-mono text-zinc-300">{{ cpuPercent }}%</span>
          </div>
          <ProgressThin :value="Number(cpuPercent)" class="h-1 bg-zinc-800" indicator-class="bg-emerald-500" />
        </div>

        <!-- RAM -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-zinc-400 flex items-center gap-1.5">
              <Icon icon="ph:memory" class="w-3.5 h-3.5" />
              RAM
            </span>
            <span class="font-mono text-zinc-300">{{ memoryPercent }}%</span>
          </div>
          <ProgressThin :value="Number(memoryPercent)" class="h-1 bg-zinc-800" indicator-class="bg-blue-500" />
        </div>

        <!-- SWAP -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-zinc-400 flex items-center gap-1.5">
              <Icon icon="ph:arrows-left-right" class="w-3.5 h-3.5" />
              SWAP
            </span>
            <span class="font-mono text-zinc-300">{{ swapPercent }}%</span>
          </div>
          <ProgressThin :value="Number(swapPercent)" class="h-1 bg-zinc-800" indicator-class="bg-amber-500" />
        </div>

        <!-- DISK -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-zinc-400 flex items-center gap-1.5">
              <Icon icon="ph:hard-drive" class="w-3.5 h-3.5" />
              DISK
            </span>
            <span class="font-mono text-zinc-300">{{ diskPercent }}%</span>
          </div>
          <ProgressThin :value="Number(diskPercent)" class="h-1 bg-zinc-800" indicator-class="bg-purple-500" />
        </div>
      </div>

      <div class="w-full h-px bg-zinc-800/50 my-1"></div>

      <!-- Traffic Progress -->
      <div class="space-y-1.5" :class="{'opacity-50': isOffline}">
        <div class="flex items-center justify-between text-xs mb-2">
          <span class="text-zinc-400 flex items-center gap-1.5">
            <Icon icon="ph:database" class="w-3.5 h-3.5 text-emerald-500" />
            流量
          </span>
          <span class="text-emerald-500">在线: {{ statusText.replace('天', '天') }}</span>
        </div>
        <div class="flex gap-1 h-2 mb-1">
          <div 
            v-for="i in 15" :key="i"
            class="flex-1 rounded-sm transition-all"
            :class="[
              isOffline ? 'bg-zinc-800' : 
              i <= (Number(trafficPercent) / 100 * 15) ? 'bg-emerald-400' : 'bg-zinc-800'
            ]"
          ></div>
        </div>
        <div class="text-right text-xs font-mono text-zinc-300 mt-1">
          {{ trafficFormattedText }}
        </div>
      </div>
      
      <div class="w-full h-px bg-zinc-800/50 mt-1 mb-2"></div>

      <!-- Multi-Network Ping Status -->
      <div class="space-y-3" :class="{'opacity-50': isOffline}">
        
        <!-- Telecom / 电信 -->
        <div class="flex items-center justify-between text-sm">
          <div class="w-10 text-zinc-400 text-xs">电信</div>
          <div class="w-16 font-mono text-yellow-400 text-right">
            {{ isOnline ? networkData.telecom.avg : 0 }}<span class="text-[10px] text-zinc-500 ml-1">ms</span>
          </div>
          <div class="flex flex-1 gap-1 px-3">
             <div 
                v-for="i in 20" :key="i"
                class="flex-1 h-2.5 rounded-[1px]"
                :class="isOnline ? 'bg-yellow-400' : 'bg-zinc-800'"
             ></div>
          </div>
          <div class="w-12 font-mono text-emerald-400 text-right text-xs">
            {{ isOnline ? Number(networkData.telecom.loss).toFixed(1) : '0.0' }}<span class="text-[10px] text-zinc-500 ml-0.5">%</span>
          </div>
        </div>

        <!-- Unicom / 联通 -->
        <div class="flex items-center justify-between text-sm">
          <div class="w-10 text-zinc-400 text-xs">联通</div>
          <div class="w-16 font-mono text-yellow-400 text-right">
             {{ isOnline ? networkData.unicom.avg : 0 }}<span class="text-[10px] text-zinc-500 ml-1">ms</span>
          </div>
          <div class="flex flex-1 gap-1 px-3">
             <div 
                v-for="i in 20" :key="i"
                class="flex-1 h-2.5 rounded-[1px]"
                :class="isOnline ? 'bg-yellow-400' : 'bg-zinc-800'"
             ></div>
          </div>
          <div class="w-12 font-mono text-emerald-400 text-right text-xs">
            {{ isOnline ? Number(networkData.unicom.loss).toFixed(1) : '0.0' }}<span class="text-[10px] text-zinc-500 ml-0.5">%</span>
          </div>
        </div>

        <!-- Mobile / 移动 -->
        <div class="flex items-center justify-between text-sm">
          <div class="w-10 text-zinc-400 text-xs">移动</div>
          <div class="w-16 font-mono text-yellow-400 text-right">
             {{ isOnline ? networkData.mobile.avg : 0 }}<span class="text-[10px] text-zinc-500 ml-1">ms</span>
          </div>
          <div class="flex flex-1 gap-1 px-3">
             <div 
                v-for="i in 20" :key="i"
                class="flex-1 h-2.5 rounded-[1px]"
                :class="isOnline ? 'bg-yellow-400' : 'bg-zinc-800'"
             ></div>
          </div>
          <div class="w-12 font-mono text-emerald-400 text-right text-xs">
            {{ isOnline ? Number(networkData.mobile.loss).toFixed(1) : '0.0' }}<span class="text-[10px] text-zinc-500 ml-0.5">%</span>
          </div>
        </div>

      </div>
    </div>
  </CardX>
</template>
