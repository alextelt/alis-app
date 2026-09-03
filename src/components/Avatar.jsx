import { parserAvatar } from '../utils'

export default function Avatar({ pseudo, avatarUrl, size = 32 }) {
  const avatar = parserAvatar(avatarUrl)

  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: avatar ? size * 0.55 : size * 0.4,
    fontFamily: avatar ? 'inherit' : "'Fraunces', serif",
    color: 'var(--gold-bright)',
    background: avatar ? avatar.bg : 'var(--bg-panel-2)',
    border: avatar ? 'none' : '1px solid var(--border)',
  }

  const badgeSize = Math.round(size * 0.4)
  const badgeStyle = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: badgeSize,
    height: badgeSize,
    borderRadius: '50%',
    background: 'var(--bg-panel)',
    border: '1px solid var(--gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: badgeSize * 0.6,
    lineHeight: 1,
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={style}>
        {avatar ? avatar.creature : (pseudo?.[0] || '?').toUpperCase()}
      </div>
      {avatar?.badge && <div style={badgeStyle}>{avatar.badge}</div>}
    </div>
  )
}
