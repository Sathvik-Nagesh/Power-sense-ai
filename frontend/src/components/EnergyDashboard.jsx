import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

/**
 * D3.js energy consumption bar chart showing per-room power usage.
 */
export default function EnergyDashboard({ energyUsage = [] }) {
    const svgRef = useRef(null)

    useEffect(() => {
        if (!energyUsage.length || !svgRef.current) return

        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove()

        const width = svgRef.current.clientWidth || 400
        const height = 200
        const margin = { top: 20, right: 20, bottom: 40, left: 45 }
        const innerW = width - margin.left - margin.right
        const innerH = height - margin.top - margin.bottom

        const g = svg
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)

        // Scales
        const x = d3.scaleBand()
            .domain(energyUsage.map(d => d.room))
            .range([0, innerW])
            .padding(0.3)

        const maxPower = d3.max(energyUsage, d => d.max_power_kw) || 2.5
        const y = d3.scaleLinear()
            .domain([0, maxPower])
            .range([innerH, 0])

        // Grid lines
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(y).ticks(4).tickSize(-innerW).tickFormat(''))
            .selectAll('line')
            .style('stroke', 'rgba(255,255,255,0.05)')

        g.selectAll('.grid .domain').remove()

        // Max power bars (background)
        g.selectAll('.bar-bg')
            .data(energyUsage)
            .enter()
            .append('rect')
            .attr('x', d => x(d.room))
            .attr('y', d => y(d.max_power_kw))
            .attr('width', x.bandwidth())
            .attr('height', d => innerH - y(d.max_power_kw))
            .attr('rx', 3)
            .style('fill', 'rgba(255,255,255,0.04)')

        // Current power bars
        const getBarColor = (d) => {
            const efficiency = d.efficiency_pct || 0
            if (efficiency > 60) return '#10b981'
            if (efficiency > 30) return '#f59e0b'
            return '#ef4444'
        }

        g.selectAll('.bar')
            .data(energyUsage)
            .enter()
            .append('rect')
            .attr('x', d => x(d.room))
            .attr('y', innerH)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('rx', 3)
            .style('fill', d => getBarColor(d))
            .style('opacity', 0.85)
            .transition()
            .duration(800)
            .delay((d, i) => i * 80)
            .attr('y', d => y(d.current_power_kw))
            .attr('height', d => innerH - y(d.current_power_kw))

        // Bar labels
        g.selectAll('.bar-label')
            .data(energyUsage)
            .enter()
            .append('text')
            .attr('x', d => x(d.room) + x.bandwidth() / 2)
            .attr('y', d => y(d.current_power_kw) - 5)
            .attr('text-anchor', 'middle')
            .style('fill', '#f1f5f9')
            .style('font-size', '9px')
            .style('font-family', 'JetBrains Mono, monospace')
            .text(d => `${d.current_power_kw.toFixed(1)}`)

        // X axis
        g.append('g')
            .attr('transform', `translate(0,${innerH})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', '#94a3b8')
            .style('font-size', '9px')
            .style('font-family', 'JetBrains Mono, monospace')
            .attr('transform', 'rotate(-30)')
            .attr('text-anchor', 'end')

        g.selectAll('.domain').style('stroke', 'rgba(255,255,255,0.1)')
        g.selectAll('.tick line').style('stroke', 'rgba(255,255,255,0.1)')

        // Y axis
        g.append('g')
            .call(d3.axisLeft(y).ticks(4).tickFormat(d => `${d} kW`))
            .selectAll('text')
            .style('fill', '#94a3b8')
            .style('font-size', '8px')
            .style('font-family', 'JetBrains Mono, monospace')

    }, [energyUsage])

    return (
        <div className="chart-container">
            <svg ref={svgRef} style={{ width: '100%', height: '200px' }} />
        </div>
    )
}
