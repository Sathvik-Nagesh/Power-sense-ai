import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function EnergyDashboard({ energyUsage = [] }) {
    const ref = useRef(null)

    useEffect(() => {
        if (!energyUsage.length || !ref.current) return
        const el = ref.current
        const W = el.clientWidth || 380
        const H = 210
        const m = { top: 18, right: 14, bottom: 42, left: 48 }
        const iW = W - m.left - m.right
        const iH = H - m.top - m.bottom

        const svg = d3.select(el)
        svg.selectAll('*').remove()
        svg.attr('width', W).attr('height', H)

        const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`)

        const x = d3.scaleBand()
            .domain(energyUsage.map(d => d.room))
            .range([0, iW]).padding(.35)

        const maxY = d3.max(energyUsage, d => d.max_power_kw) || 2.5
        const y = d3.scaleLinear().domain([0, maxY]).range([iH, 0])

        // Gridlines
        g.append('g').call(d3.axisLeft(y).ticks(4).tickSize(-iW).tickFormat(''))
            .selectAll('line').style('stroke', 'rgba(255,255,255,.06)')
        g.selectAll('.grid .domain').remove()

        // BG bars
        g.selectAll('.bar-bg').data(energyUsage).enter().append('rect')
            .attr('x', d => x(d.room)).attr('y', d => y(d.max_power_kw))
            .attr('width', x.bandwidth()).attr('height', d => iH - y(d.max_power_kw))
            .attr('rx', 4).style('fill', 'rgba(255,255,255,.04)')

        // Color by efficiency
        const barColor = d => {
            const eff = d.efficiency_pct || 0
            return eff > 55 ? '#00d68f' : eff > 25 ? '#ffb300' : '#ff4757'
        }

        // Actual bars
        g.selectAll('.bar').data(energyUsage).enter().append('rect')
            .attr('x', d => x(d.room)).attr('y', iH)
            .attr('width', x.bandwidth()).attr('height', 0)
            .attr('rx', 4).style('fill', barColor).style('opacity', .85)
            .transition().duration(700).delay((_, i) => i * 60)
            .attr('y', d => y(d.current_power_kw))
            .attr('height', d => iH - y(d.current_power_kw))

        // Values on top
        g.selectAll('.lbl').data(energyUsage).enter().append('text')
            .attr('x', d => x(d.room) + x.bandwidth() / 2)
            .attr('y', d => y(d.current_power_kw) - 4)
            .attr('text-anchor', 'middle')
            .style('fill', '#f0f4ff').style('font-size', '8px')
            .style('font-family', 'JetBrains Mono,monospace')
            .text(d => d.current_power_kw.toFixed(1))

        // X axis
        g.append('g').attr('transform', `translate(0,${iH})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', '#4a5578').style('font-size', '9px')
            .style('font-family', 'JetBrains Mono,monospace')
            .attr('transform', 'rotate(-30)').attr('text-anchor', 'end')

        g.selectAll('.domain').style('stroke', 'rgba(255,255,255,.08)')
        g.selectAll('.tick line').style('stroke', 'rgba(255,255,255,.08)')

        // Y axis
        g.append('g').call(d3.axisLeft(y).ticks(4).tickFormat(v => `${v}kW`))
            .selectAll('text')
            .style('fill', '#4a5578').style('font-size', '8px')
            .style('font-family', 'JetBrains Mono,monospace')

    }, [energyUsage])

    return (
        <div className="chart-wrap">
            <svg ref={ref} style={{ width: '100%', height: '100%' }} />
        </div>
    )
}
