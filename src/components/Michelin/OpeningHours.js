// Weekly hours table + open/closed badge. Shared by the Michelin and ramen pages.
import { openStatus, weekRows } from './hours'

export default function OpeningHours({ r, now, city }) {
    const status = openStatus(r.week, now)
    const rows = weekRows(r.week)
    return (
        <section className="mic-hours" aria-labelledby="mic-hours-title">
            <h3 id="mic-hours-title">
                Opening hours <span className={`badge badge-${status.state}`}>{status.label}</span>
            </h3>
            {rows.length > 0 ? (
                <table>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.label} className={row.days.includes(now.day) ? 'is-today' : undefined}>
                                <th scope="row">{row.label}</th>
                                <td>{row.text}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="mic-muted">We couldn't find published hours. Check with the restaurant.</p>
            )}
            {r.hoursUnsure && rows.length > 0 && (
                <p className="mic-muted">⚠ Sources disagree or are old for these hours. Double-check before going.</p>
            )}
            {r.hoursNote && <p className="mic-muted">{r.hoursNote}</p>}
            {rows.length > 0 && (
                <p className="mic-muted">
                    {city.timeLong}. Hours change, especially on public holidays, so confirm before you go
                    {r.hoursSource && (
                        <>
                            {' '}
                            (<a href={r.hoursSource} target="_blank" rel="noreferrer">source ↗</a>)
                        </>
                    )}
                    .
                </p>
            )}
        </section>
    )
}
