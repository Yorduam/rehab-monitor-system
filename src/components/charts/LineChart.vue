<template>
  <canvas ref="canvas" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  labels: { type: Array, required: true },
  width: { type: Number, default: 400 },
  height: { type: Number, default: 200 },
  color: { type: String, default: '#76B729' }
})

const canvas = ref(null)
let ctx = null

const draw = () => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  const w = props.width, h = props.height
  ctx.clearRect(0, 0, w, h)
  if (!props.data.length) return

  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const graphW = w - padding.left - padding.right
  const graphH = h - padding.top - padding.bottom

  
  ctx.beginPath()
  ctx.strokeStyle = 'var(--border)'
  ctx.lineWidth = 1
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, h - padding.bottom)
  ctx.lineTo(w - padding.right, h - padding.bottom)
  ctx.stroke()

  
  const maxVal = Math.max(...props.data, 1)
  const stepY = maxVal / 4
  for (let i = 0; i <= 4; i++) {
    const y = h - padding.bottom - (i * graphH / 4)
    ctx.fillStyle = 'var(--text-tertiary)'
    ctx.font = '10px sans-serif'
    ctx.fillText(Math.round(stepY * i), padding.left - 25, y + 3)
    ctx.beginPath()
    ctx.strokeStyle = 'var(--border-light)'
    ctx.moveTo(padding.left, y)
    ctx.lineTo(w - padding.right, y)
    ctx.stroke()
  }

  
  const stepX = graphW / (props.labels.length - 1)
  for (let i = 0; i < props.labels.length; i++) {
    const x = padding.left + i * stepX
    ctx.fillStyle = 'var(--text-tertiary)'
    ctx.fillText(props.labels[i], x - 10, h - padding.bottom + 15)
  }

  
  ctx.beginPath()
  ctx.strokeStyle = props.color
  ctx.lineWidth = 2
  const points = props.data.map((val, i) => {
    const x = padding.left + i * stepX
    const y = h - padding.bottom - (val / maxVal) * graphH
    return { x, y }
  })
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  })
  ctx.stroke()

  
  points.forEach(p => {
    ctx.beginPath()
    ctx.fillStyle = props.color
    ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI)
    ctx.fill()
  })
}

onMounted(() => draw())
watch(() => [props.data, props.labels], draw)
</script>