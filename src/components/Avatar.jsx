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
    flexShrink: 0,
    fontSize: avatar ? size * 0.55 : size * 0.4,
    fontFamily: avatar ? 'inherit' : "'Fraunces', serif",
    color: 'var(--gold-bright)',
    background: avatar ? avatar.bg : 'var(--bg-panel-2)',
    border: avatar ? 'none' : '1px solid var(--border)',
  }

  return (
    <div style={style}>
      {avatar ? avatar.emoji : (pseudo?.[0] || '?').toUpperCase()}
    </div>
  )
}
