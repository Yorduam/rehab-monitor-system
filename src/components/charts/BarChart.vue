<template>
  <canvas ref="canvas" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  labels: { type: Array, required: true },
  datasets: { type: Array, required: true }, // [{ label, data, color }]
  width: { type: Number, default: 400 },
  height: { type: Number, default: 200 }
})

const canvas = ref(null)
let ctx = null

const draw = () => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  const w = props.width, h = props.height
  ctx.clearRect(0, 0, w, h)

  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const graphW = w - padding.left - padding.right
  const graphH = h - padding.top - padding.bottom

  // находим максимум
  let maxVal = 0
  props.datasets.forEach(ds => {
    maxVal = Math.max(maxVal, ...ds.data)
  })
  maxVal = Math.ceil(maxVal * 1.1)

  // оси
  ctx.beginPath()
  ctx.strokeStyle = 'var(--border)'
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, h - padding.bottom)
  ctx.lineTo(w - padding.right, h - padding.bottom)
  ctx.stroke()

  // Y метки
  for (let i = 0; i <= 4; i++) {
    const val = (maxVal / 4) * i
    const y = h - padding.bottom - (i * graphH / 4)
    ctx.fillStyle = 'var(--text-tertiary)'
    ctx.fillText(val.toFixed(1), padding.left - 25, y + 3)
    ctx.beginPath()
    ctx.strokeStyle = 'var(--border-light)'
    ctx.moveTo(padding.left, y)
    ctx.lineTo(w - padding.right, y)
    ctx.stroke()
  }

  // X метки
  const barWidth = (graphW / props.labels.length) * 0.7
  const step = graphW / props.labels.length
  for (let i = 0; i < props.labels.length; i++) {
    const x = padding.left + i * step + (step - barWidth) / 2
    ctx.fillStyle = 'var(--text-tertiary)'
    ctx.fillText(props.labels[i], x + barWidth/2 - 10, h - padding.bottom + 15)
  }

  // рисуем бары
  const datasetCount = props.datasets.length
  const subBarWidth = barWidth / datasetCount
  for (let i = 0; i < props.labels.length; i++) {
    for (let dsIdx = 0; dsIdx < datasetCount; dsIdx++) {
      const ds = props.datasets[dsIdx]
      const value = ds.data[i]
      const barHeight = (value / maxVal) * graphH
      const x = padding.left + i * step + (step - barWidth) / 2 + dsIdx * subBarWidth
      const y = h - padding.bottom - barHeight
      ctx.fillStyle = ds.color
      ctx.fillRect(x, y, subBarWidth - 1, barHeight)
    }
  }
}

onMounted(() => draw())
watch(() => [props.data, props.labels, props.datasets], draw)
</script>