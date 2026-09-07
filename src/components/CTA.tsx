interface Props {
  onJump: (id: string) => void
}

export function CTA({ onJump }: Props) {
  return (
    <div className="cta__actions">
      <a className="btn btn--primary" href="#start">
        Open an account
      </a>
      <button type="button" className="btn" onClick={() => onJump('markets')}>
        Explore markets
      </button>
      <button type="button" className="btn" onClick={() => onJump('funding')}>
        Contact support
      </button>
    </div>
  )
}
